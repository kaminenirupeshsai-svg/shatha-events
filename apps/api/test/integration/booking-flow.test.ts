import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { app } from '../../src/app.js';
import { connectDb, disconnectDb } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';
import { emailService } from '../../src/lib/email.service.js';
import { User } from '../../src/models/User.js';
import { Service } from '../../src/models/Service.js';
import { Booking } from '../../src/models/Booking.js';
import { Task } from '../../src/models/Task.js';
import { Notification } from '../../src/models/Notification.js';
import { RefreshToken } from '../../src/models/RefreshToken.js';
import { Review } from '../../src/models/Review.js';
import { Message } from '../../src/models/Message.js';

// The 6-digit code only ever leaves the server inside the body of a sent
// email - spying on the shared emailService singleton (the same instance
// auth.service.ts calls) lets the suite pull the real code back out and
// drive the actual verify-email endpoint, instead of reaching into Mongo to
// flip emailVerified directly. Falls through to the real console driver
// (writes to .email-log.txt) since spyOn doesn't replace the implementation.
function spyOnEmailSend() {
  return vi.spyOn(emailService, 'send');
}

function latestOtpFor(sendSpy: ReturnType<typeof spyOnEmailSend>, email: string): string {
  const call = [...sendSpy.mock.calls].reverse().find(([msg]) => msg.to === email);
  const match = call?.[0]?.body.match(/\b(\d{6})\b/);
  if (!match) throw new Error(`No OTP found in mail sent to ${email}`);
  return match[1]!;
}

// This suite drives the real HTTP surface against a real MongoDB and is the
// only place the full multi-role flow (signup -> verify -> login -> vendor
// lists a service -> client books it -> admin transitions its status ->
// notifications/tasks fire) is exercised end-to-end. It requires a reachable
// Mongo instance, so it self-skips (rather than failing) when one isn't
// available - checked with a short timeout so `pnpm test` stays fast in
// environments without MongoDB installed.
async function isMongoReachable(): Promise<boolean> {
  try {
    const probe = await mongoose.createConnection(env.MONGODB_URI, { serverSelectionTimeoutMS: 1500 }).asPromise();
    await probe.close();
    return true;
  } catch {
    return false;
  }
}

const mongoAvailable = await isMongoReachable();

describe.skipIf(!mongoAvailable)('booking lifecycle (integration, requires MongoDB)', () => {
  const stamp = Date.now().toString(36);
  const clientEmail = `it-client-${stamp}@example.com`;
  const vendorEmail = `it-vendor-${stamp}@example.com`;
  const adminEmail = `it-admin-${stamp}@example.com`;
  const password = 'Password123!';

  let clientToken = '';
  let clientId = '';
  let vendorToken = '';
  let adminToken = '';
  let adminId = '';
  let serviceId = '';
  let bookingId = '';
  let refreshCookie = '';
  let sendSpy: ReturnType<typeof spyOnEmailSend>;

  beforeAll(async () => {
    await connectDb();
    sendSpy = spyOnEmailSend();
    // Admin accounts can't self-register (SignupRoleSchema only allows
    // client/vendor) - seed one directly, same as the real onboarding path.
    // Created straight in Mongo (not through signup()), so it gets the
    // schema default emailVerified: true and can log in immediately.
    const admin = await User.create({
      name: 'Integration Test Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(password, 4),
      role: 'admin',
    });
    adminId = admin._id.toString();
  });

  afterAll(async () => {
    sendSpy.mockRestore();
    await Promise.all([
      User.deleteMany({ email: { $in: [clientEmail, vendorEmail, adminEmail] } }),
      Service.deleteMany({ _id: serviceId || undefined }),
      Booking.deleteMany({ _id: bookingId || undefined }),
      Task.deleteMany({ bookingId: bookingId || undefined }),
      Notification.deleteMany({ relatedBookingId: bookingId || undefined }),
      RefreshToken.deleteMany({}),
    ]);
    await disconnectDb();
  });

  it('signs up a client without issuing a session, blocks login until verified, then logs in', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Integration Client', email: clientEmail, password, role: 'client' });

    expect(signup.status).toBe(201);
    expect(signup.body.email).toBe(clientEmail);
    // No session is issued at signup anymore - nothing to log in with yet.
    expect(signup.body.accessToken).toBeUndefined();
    expect(signup.headers['set-cookie']).toBeUndefined();

    const blockedLogin = await request(app).post('/api/auth/login').send({ email: clientEmail, password });
    expect(blockedLogin.status).toBe(403);
    expect(blockedLogin.body.code).toBe('EMAIL_NOT_VERIFIED');

    const otp = latestOtpFor(sendSpy, clientEmail);
    const wrongOtp = otp === '000000' ? '111111' : '000000';

    // A wrong code is rejected before we try the real one.
    const wrong = await request(app).post('/api/auth/verify-email').send({ email: clientEmail, otp: wrongOtp });
    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe('INVALID_VERIFICATION_CODE');

    const verify = await request(app).post('/api/auth/verify-email').send({ email: clientEmail, otp });
    expect(verify.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email: clientEmail, password });
    expect(login.status).toBe(200);
    expect(login.body.accessToken).toEqual(expect.any(String));

    const setCookie = login.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieHeader = Array.isArray(setCookie) ? setCookie.find((c: string) => c.startsWith('refreshToken=')) : setCookie;
    expect(cookieHeader).toBeDefined();
    refreshCookie = (cookieHeader as string).split(';')[0]!;
    clientToken = login.body.accessToken;
    clientId = login.body.user.id;
  });

  it('accepts a resend-verification request with no Authorization header and does not leak whether the email exists', async () => {
    // Unverified accounts have no session (login blocks them), so this
    // endpoint can't require auth - it takes an email directly instead, and
    // - like forgot-password - resolves 200 either way rather than revealing
    // whether the address is registered or already verified.
    const known = await request(app).post('/api/auth/resend-verification').send({ email: clientEmail });
    expect(known.status).toBe(200);

    const unknown = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: `nobody-${stamp}@example.com` });
    expect(unknown.status).toBe(200);
  });

  it('locks out further guesses after too many wrong codes, and a resend issues a working replacement', async () => {
    const throwawayEmail = `it-otp-limit-${stamp}@example.com`;
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'OTP Limit Test', email: throwawayEmail, password, role: 'client' });
    expect(signup.status).toBe(201);

    const otp = latestOtpFor(sendSpy, throwawayEmail);
    const wrongOtp = otp === '000000' ? '111111' : '000000';

    // Exhaust the 5-attempt limit with wrong guesses.
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/api/auth/verify-email').send({ email: throwawayEmail, otp: wrongOtp });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_VERIFICATION_CODE');
    }

    // The originally-correct code no longer works either - the limit invalidated it.
    const afterLimit = await request(app).post('/api/auth/verify-email').send({ email: throwawayEmail, otp });
    expect(afterLimit.status).toBe(400);
    expect(afterLimit.body.code).toBe('TOO_MANY_VERIFICATION_ATTEMPTS');

    // Resend issues a fresh code and resets the attempt counter.
    const resend = await request(app).post('/api/auth/resend-verification').send({ email: throwawayEmail });
    expect(resend.status).toBe(200);
    const freshOtp = latestOtpFor(sendSpy, throwawayEmail);
    expect(freshOtp).not.toBe(otp);

    const verify = await request(app).post('/api/auth/verify-email').send({ email: throwawayEmail, otp: freshOtp });
    expect(verify.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email: throwawayEmail, password });
    expect(login.status).toBe(200);

    await User.deleteOne({ email: throwawayEmail });
  });

  it('rejects a duplicate signup with 409', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Integration Client', email: clientEmail, password, role: 'client' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('rotates the refresh token and rejects the old one on reuse', async () => {
    const first = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(first.status).toBe(200);

    // The original cookie was single-use; presenting it again must fail.
    const reused = await request(app).post('/api/auth/refresh').set('Cookie', refreshCookie);
    expect(reused.status).toBe(401);
  });

  it('only lets one of two concurrent refreshes with the same token succeed (no replay race)', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: clientEmail, password });
    const setCookie = login.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.find((c: string) => c.startsWith('refreshToken=')) : setCookie;
    const cookie = (cookieHeader as string).split(';')[0]!;

    const [a, b] = await Promise.all([
      request(app).post('/api/auth/refresh').set('Cookie', cookie),
      request(app).post('/api/auth/refresh').set('Cookie', cookie),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 401]);
  });

  it('rejects login with the wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: clientEmail, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('logs the admin in', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: adminEmail, password });
    expect(res.status).toBe(200);
    adminToken = res.body.accessToken;
  });

  it('signs up a vendor as pending, blocks login until verified, then blocks service creation until an admin approves the account', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Integration Vendor', email: vendorEmail, password, role: 'vendor' });
    expect(signup.status).toBe(201);

    const blockedLogin = await request(app).post('/api/auth/login').send({ email: vendorEmail, password });
    expect(blockedLogin.status).toBe(403);
    expect(blockedLogin.body.code).toBe('EMAIL_NOT_VERIFIED');

    const otp = latestOtpFor(sendSpy, vendorEmail);
    const verify = await request(app).post('/api/auth/verify-email').send({ email: vendorEmail, otp });
    expect(verify.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email: vendorEmail, password });
    expect(login.status).toBe(200);
    expect(login.body.user.vendorStatus).toBe('pending');
    vendorToken = login.body.accessToken;
    const vendorId = login.body.user.id;

    const serviceInput = {
      title: 'Integration Test Photography',
      category: 'photography_film',
      description: 'A service created purely for the automated integration test suite.',
      priceRange: { min: 100, max: 500 },
    };

    const blocked = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send(serviceInput);
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('VENDOR_NOT_APPROVED');

    // Not yet approved - must not appear in the public vendor directory, and
    // that directory must never expose email/phone to a non-admin caller.
    const directoryBefore = await request(app)
      .get('/api/users?role=vendor')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(directoryBefore.status).toBe(200);
    expect(directoryBefore.body.items.some((v: { id: string }) => v.id === vendorId)).toBe(false);

    const approve = await request(app)
      .patch(`/api/users/${vendorId}/vendor-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(approve.status).toBe(200);
    expect(approve.body.vendorStatus).toBe('approved');

    const directoryAfter = await request(app)
      .get('/api/users?role=vendor')
      .set('Authorization', `Bearer ${clientToken}`);
    const listedVendor = directoryAfter.body.items.find((v: { id: string }) => v.id === vendorId);
    expect(listedVendor).toBeDefined();
    expect(listedVendor.email).toBeUndefined();
    expect(listedVendor.phone).toBeUndefined();

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send(serviceInput);

    expect(res.status).toBe(201);
    expect(res.body.vendorName).toBe('Integration Vendor');
    serviceId = res.body.id;
  });

  it('still blocks booking creation at the service layer if an account is marked unverified after its token was issued (defense in depth for stale sessions)', async () => {
    // Login now requires emailVerified, so this state is unreachable through
    // the normal auth flow - the only way to produce it is a token that was
    // already issued before the account somehow became unverified again
    // (nothing in the app does this today, but the service-layer check in
    // bookings.service.ts createBooking exists specifically for this class
    // of edge case, so it stays covered here rather than only reachable in
    // theory).
    await User.updateOne({ email: clientEmail }, { emailVerified: false });
    try {
      const eventDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          eventType: 'wedding',
          eventDate,
          guestCount: 10,
          services: [{ serviceId, notes: '' }],
          budget: 500,
        });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    } finally {
      await User.updateOne({ email: clientEmail }, { emailVerified: true });
    }
  });

  it('lets the client create a booking against the vendor’s service', async () => {
    const eventDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        eventType: 'wedding',
        eventDate,
        guestCount: 50,
        services: [{ serviceId, notes: 'integration test' }],
        budget: 2000,
        message: 'Integration test booking',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(res.body.services).toHaveLength(1);
    expect(res.body.services[0].title).toBe('Integration Test Photography');
    bookingId = res.body.id;
  });

  it('lets the owning vendor see the booking under /bookings/vendor', async () => {
    const res = await request(app).get('/api/bookings/vendor').set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items.some((b: { id: string }) => b.id === bookingId)).toBe(true);
  });

  it('forbids a client from the admin-only /bookings listing', async () => {
    const res = await request(app).get('/api/bookings').set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(403);
  });

  it('lets the admin move the booking from pending to reviewed, auto-assigning themselves', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'reviewed', note: 'Looks good' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('reviewed');
    expect(res.body.assignedAdminName).toBe('Integration Test Admin');
    expect(res.body.statusHistory).toHaveLength(2);
  });

  it('rejects an invalid status transition (reviewed -> completed)', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('notified the client in-app about the status change', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(
      res.body.items.some(
        (n: { relatedBookingId: string; type: string }) => n.relatedBookingId === bookingId && n.type === 'booking_status_changed',
      ),
    ).toBe(true);
  });

  it('reports the real unread count (not capped by any list page size) and clears it on mark-all-read', async () => {
    const before = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${clientToken}`);
    expect(before.status).toBe(200);
    expect(before.body.count).toBeGreaterThanOrEqual(1);

    const markAll = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(markAll.status).toBe(204);

    const after = await request(app).get('/api/notifications/unread-count').set('Authorization', `Bearer ${clientToken}`);
    expect(after.status).toBe(200);
    expect(after.body.count).toBe(0);
  });

  it('admin creates a task on the booking, assignee sees it under /tasks/mine, and can complete it', async () => {
    const created = await request(app)
      .post(`/api/bookings/${bookingId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Integration test task', assignedTo: clientId });
    expect(created.status).toBe(201);
    const taskId = created.body.id;

    const mine = await request(app).get('/api/tasks/mine').set('Authorization', `Bearer ${clientToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.some((t: { id: string }) => t.id === taskId)).toBe(true);

    const updated = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'done' });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('done');
  });

  it('rejects creating a task assigned to a non-existent user instead of 500ing', async () => {
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Orphan task', assignedTo: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('ASSIGNEE_NOT_FOUND');
  });

  it('a non-admin cannot create tasks on the booking', async () => {
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/tasks`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ title: 'Should be forbidden', assignedTo: clientId });
    expect(res.status).toBe(403);
  });

  it('blocks a second booking against a vendor already confirmed for the same date, but allows a different date', async () => {
    const conflictDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    const otherDate = new Date(Date.now() + 61 * 24 * 60 * 60 * 1000).toISOString();

    const first = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        eventType: 'corporate',
        eventDate: conflictDate,
        guestCount: 20,
        services: [{ serviceId, notes: '' }],
        budget: 1000,
      });
    expect(first.status).toBe(201);
    const firstBookingId = first.body.id;

    // Only a genuinely confirmed (or in-progress) booking should block a new
    // request - move it past 'reviewed' first.
    await request(app)
      .patch(`/api/bookings/${firstBookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'reviewed' });
    const confirm = await request(app)
      .patch(`/api/bookings/${firstBookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed' });
    expect(confirm.status).toBe(200);
    expect(confirm.body.status).toBe('confirmed');

    const conflict = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        eventType: 'birthday',
        eventDate: conflictDate,
        guestCount: 5,
        services: [{ serviceId, notes: '' }],
        budget: 200,
      });
    expect(conflict.status).toBe(409);
    expect(conflict.body.code).toBe('VENDOR_DATE_CONFLICT');

    const noConflict = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        eventType: 'birthday',
        eventDate: otherDate,
        guestCount: 5,
        services: [{ serviceId, notes: '' }],
        budget: 200,
      });
    expect(noConflict.status).toBe(201);

    await Booking.deleteMany({ _id: { $in: [firstBookingId, noConflict.body.id] } });
  });

  it('lets a client review a vendor once a booking is completed, blocks it before, and prevents a duplicate', async () => {
    const eventDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    const create = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        eventType: 'social',
        eventDate,
        guestCount: 15,
        services: [{ serviceId, notes: '' }],
        budget: 400,
      });
    expect(create.status).toBe(201);
    const reviewBookingId = create.body.id;

    // Too early - the booking isn't completed yet.
    const tooEarly = await request(app)
      .post(`/api/bookings/${reviewBookingId}/reviews`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ serviceId, rating: 5 });
    expect(tooEarly.status).toBe(400);
    expect(tooEarly.body.code).toBe('BOOKING_NOT_COMPLETED');

    // Walk it through the only legal path to 'completed'.
    for (const status of ['reviewed', 'confirmed', 'in_progress', 'completed']) {
      const res = await request(app)
        .patch(`/api/bookings/${reviewBookingId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status });
      expect(res.status).toBe(200);
    }

    // A service id that isn't actually on this booking is rejected.
    const wrongService = await request(app)
      .post(`/api/bookings/${reviewBookingId}/reviews`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ serviceId: new mongoose.Types.ObjectId().toString(), rating: 4 });
    expect(wrongService.status).toBe(400);
    expect(wrongService.body.code).toBe('SERVICE_NOT_IN_BOOKING');

    const review = await request(app)
      .post(`/api/bookings/${reviewBookingId}/reviews`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ serviceId, rating: 5, comment: 'Wonderful to work with.' });
    expect(review.status).toBe(201);
    expect(review.body.rating).toBe(5);
    expect(review.body.serviceId).toBe(serviceId);
    expect(review.body.clientName).toBe('Integration Client');

    const duplicate = await request(app)
      .post(`/api/bookings/${reviewBookingId}/reviews`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ serviceId, rating: 3 });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('ALREADY_REVIEWED');

    const bookingReviews = await request(app)
      .get(`/api/bookings/${reviewBookingId}/reviews`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(bookingReviews.status).toBe(200);
    expect(bookingReviews.body).toHaveLength(1);

    const serviceReviews = await request(app).get(`/api/services/${serviceId}/reviews`);
    expect(serviceReviews.status).toBe(200);
    expect(serviceReviews.body.items.some((r: { id: string }) => r.id === review.body.id)).toBe(true);

    const serviceAfter = await request(app).get(`/api/services/${serviceId}`);
    expect(serviceAfter.body.avgRating).toBe(5);
    expect(serviceAfter.body.reviewCount).toBeGreaterThanOrEqual(1);

    await Review.deleteMany({ bookingId: reviewBookingId });
    await Booking.deleteOne({ _id: reviewBookingId });
  });

  it('lets a client and vendor message each other on a booking, visible to admin, and rejects a vendor id not on the booking', async () => {
    const serviceRes = await request(app).get(`/api/services/${serviceId}`);
    const vendorIdForService = serviceRes.body.vendorId as string;

    const create = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        eventType: 'corporate',
        eventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        guestCount: 10,
        services: [{ serviceId, notes: '' }],
        budget: 300,
      });
    expect(create.status).toBe(201);
    const messageBookingId = create.body.id;
    // The vendor is snapshotted onto the booking's service item at creation time.
    expect(create.body.services[0].vendorId).toBe(vendorIdForService);

    // A vendor id that isn't actually on this booking is rejected.
    const badVendor = await request(app)
      .post(`/api/bookings/${messageBookingId}/messages/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ body: 'Hello?' });
    expect(badVendor.status).toBe(400);
    expect(badVendor.body.code).toBe('VENDOR_NOT_ON_BOOKING');

    const fromClient = await request(app)
      .post(`/api/bookings/${messageBookingId}/messages/${vendorIdForService}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ body: 'Hi, can you confirm the setup time?' });
    expect(fromClient.status).toBe(201);
    expect(fromClient.body.senderRole).toBe('client');

    const fromVendor = await request(app)
      .post(`/api/bookings/${messageBookingId}/messages/${vendorIdForService}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ body: 'Sure, 2pm works great.' });
    expect(fromVendor.status).toBe(201);
    expect(fromVendor.body.senderRole).toBe('vendor');

    const asClient = await request(app)
      .get(`/api/bookings/${messageBookingId}/messages/${vendorIdForService}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(asClient.status).toBe(200);
    expect(asClient.body).toHaveLength(2);
    expect(asClient.body[0].body).toBe('Hi, can you confirm the setup time?');
    expect(asClient.body[1].body).toBe('Sure, 2pm works great.');

    const asAdmin = await request(app)
      .get(`/api/bookings/${messageBookingId}/messages/${vendorIdForService}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body).toHaveLength(2);

    await Message.deleteMany({ bookingId: messageBookingId });
    await Booking.deleteOne({ _id: messageBookingId });
  });

  it('lets an admin deactivate and reactivate a vendor, blocking login, revoking sessions, and hiding their services', async () => {
    const deactEmail = `it-deact-vendor-${stamp}@example.com`;
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Deactivation Test Vendor', email: deactEmail, password, role: 'vendor' });
    expect(signup.status).toBe(201);

    const otp = latestOtpFor(sendSpy, deactEmail);
    await request(app).post('/api/auth/verify-email').send({ email: deactEmail, otp });

    let login = await request(app).post('/api/auth/login').send({ email: deactEmail, password });
    const deactVendorId = login.body.user.id;
    let deactVendorToken = login.body.accessToken;

    await request(app)
      .patch(`/api/users/${deactVendorId}/vendor-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    const serviceInput = {
      title: 'Deactivation Test Service',
      category: 'photography_film',
      description: 'A service created purely to test the deactivation flow.',
      priceRange: { min: 50, max: 150 },
    };
    const createService = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${deactVendorToken}`)
      .send(serviceInput);
    expect(createService.status).toBe(201);
    const deactServiceId = createService.body.id;

    // Publicly visible while active.
    const beforeList = await request(app).get('/api/services').query({ q: 'Deactivation Test Service' });
    expect(beforeList.body.items.some((s: { id: string }) => s.id === deactServiceId)).toBe(true);

    const deactivate = await request(app)
      .patch(`/api/users/${deactVendorId}/active`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(deactivate.status).toBe(200);
    expect(deactivate.body.isActive).toBe(false);

    const blockedLogin = await request(app).post('/api/auth/login').send({ email: deactEmail, password });
    expect(blockedLogin.status).toBe(403);
    expect(blockedLogin.body.code).toBe('ACCOUNT_DEACTIVATED');

    // The service is hidden from the public catalog once its vendor is deactivated.
    const afterList = await request(app).get('/api/services').query({ q: 'Deactivation Test Service' });
    expect(afterList.body.items.some((s: { id: string }) => s.id === deactServiceId)).toBe(false);

    const reactivate = await request(app)
      .patch(`/api/users/${deactVendorId}/active`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });
    expect(reactivate.status).toBe(200);
    expect(reactivate.body.isActive).toBe(true);

    login = await request(app).post('/api/auth/login').send({ email: deactEmail, password });
    expect(login.status).toBe(200);
    deactVendorToken = login.body.accessToken;

    await Service.deleteOne({ _id: deactServiceId });
    await User.deleteOne({ _id: deactVendorId });
  });

  it('blocks an admin from deactivating themselves or the last remaining active admin', async () => {
    const selfDeactivate = await request(app)
      .patch(`/api/users/${adminId}/active`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(selfDeactivate.status).toBe(400);
    expect(selfDeactivate.body.code).toBe('CANNOT_DEACTIVATE_SELF');

    const adminTwoEmail = `it-admin-two-${stamp}@example.com`;
    const adminTwo = await User.create({
      name: 'Integration Test Admin Two',
      email: adminTwoEmail,
      passwordHash: await bcrypt.hash(password, 4),
      role: 'admin',
    });
    const adminTwoLogin = await request(app).post('/api/auth/login').send({ email: adminTwoEmail, password });
    const adminTwoToken = adminTwoLogin.body.accessToken;

    // Two active admins exist right now, so deactivating one is fine.
    const deactivateTwo = await request(app)
      .patch(`/api/users/${adminTwo._id.toString()}/active`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(deactivateTwo.status).toBe(200);

    // Now only the primary admin is active. adminTwo's access token is still
    // cryptographically valid (deactivation revokes refresh tokens, not
    // already-issued access tokens) - using it to target the one remaining
    // active admin must still be blocked.
    const lastAdminAttempt = await request(app)
      .patch(`/api/users/${adminId}/active`)
      .set('Authorization', `Bearer ${adminTwoToken}`)
      .send({ isActive: false });
    expect(lastAdminAttempt.status).toBe(400);
    expect(lastAdminAttempt.body.code).toBe('LAST_ADMIN');

    await User.deleteOne({ _id: adminTwo._id });
  });

  it('lets the client cancel their own booking', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });
});

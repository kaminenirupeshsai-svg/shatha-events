import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { app } from '../../src/app.js';
import { connectDb, disconnectDb } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';
import { User } from '../../src/models/User.js';
import { Service } from '../../src/models/Service.js';
import { Booking } from '../../src/models/Booking.js';
import { Task } from '../../src/models/Task.js';
import { Notification } from '../../src/models/Notification.js';
import { RefreshToken } from '../../src/models/RefreshToken.js';

// This suite drives the real HTTP surface against a real MongoDB and is the
// only place the full multi-role flow (signup -> vendor lists a service ->
// client books it -> admin transitions its status -> notifications/tasks
// fire) is exercised end-to-end. It requires a reachable Mongo instance, so
// it self-skips (rather than failing) when one isn't available - checked
// with a short timeout so `pnpm test` stays fast in environments without
// MongoDB installed.
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
  const unverifiedClientEmail = `it-unverified-client-${stamp}@example.com`;
  const unverifiedVendorEmail = `it-unverified-vendor-${stamp}@example.com`;
  const password = 'Password123!';

  let clientToken = '';
  let clientId = '';
  let vendorToken = '';
  let adminToken = '';
  let serviceId = '';
  let bookingId = '';
  let refreshCookie = '';

  beforeAll(async () => {
    await connectDb();
    // Admin accounts can't self-register (SignupRoleSchema only allows
    // client/vendor) - seed one directly, same as the real onboarding path.
    await User.create({
      name: 'Integration Test Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(password, 4),
      role: 'admin',
    });
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({
        email: { $in: [clientEmail, vendorEmail, adminEmail, unverifiedClientEmail, unverifiedVendorEmail] },
      }),
      Service.deleteMany({ _id: serviceId || undefined }),
      Booking.deleteMany({ _id: bookingId || undefined }),
      Task.deleteMany({ bookingId: bookingId || undefined }),
      Notification.deleteMany({ relatedBookingId: bookingId || undefined }),
      RefreshToken.deleteMany({}),
    ]);
    await disconnectDb();
  });

  it('signs up a client and returns a session (and sets the refresh cookie)', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Integration Client', email: clientEmail, password, role: 'client' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('client');
    expect(res.body.user.emailVerified).toBe(false);
    expect(res.body.accessToken).toEqual(expect.any(String));

    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieHeader = Array.isArray(setCookie) ? setCookie.find((c: string) => c.startsWith('refreshToken=')) : setCookie;
    expect(cookieHeader).toBeDefined();
    refreshCookie = (cookieHeader as string).split(';')[0]!;
    clientToken = res.body.accessToken;
    clientId = res.body.user.id;

    // Stand in for "clicked the verification link" - the raw token only ever
    // exists in the email body, nothing testable to extract it from at the
    // HTTP layer. The gate itself is proven separately below with a
    // dedicated unverified-account test; the rest of this suite exercises
    // the everyday booking lifecycle, which needs a verified account.
    await User.updateOne({ email: clientEmail }, { emailVerified: true });
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

  it('signs up a vendor as pending, blocks service creation until an admin approves the account', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Integration Vendor', email: vendorEmail, password, role: 'vendor' });
    expect(signup.status).toBe(201);
    expect(signup.body.user.vendorStatus).toBe('pending');
    vendorToken = signup.body.accessToken;
    const vendorId = signup.body.user.id;

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

    // Approved vendor-status alone isn't enough - still blocked until email
    // is verified too (a separate, independent gate; see createService).
    const stillUnverified = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send(serviceInput);
    expect(stillUnverified.status).toBe(403);
    expect(stillUnverified.body.code).toBe('EMAIL_NOT_VERIFIED');

    await User.updateOne({ email: vendorEmail }, { emailVerified: true });

    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send(serviceInput);

    expect(res.status).toBe(201);
    expect(res.body.vendorName).toBe('Integration Vendor');
    serviceId = res.body.id;
  });

  it('blocks an unverified client from booking and an unverified (but approved) vendor from listing', async () => {
    const clientSignup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Unverified Client', email: unverifiedClientEmail, password, role: 'client' });
    expect(clientSignup.body.user.emailVerified).toBe(false);
    const unverifiedClientToken = clientSignup.body.accessToken;

    const eventDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const blockedBooking = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${unverifiedClientToken}`)
      .send({
        eventType: 'wedding',
        eventDate,
        guestCount: 10,
        services: [{ serviceId, notes: '' }],
        budget: 500,
      });
    expect(blockedBooking.status).toBe(403);
    expect(blockedBooking.body.code).toBe('EMAIL_NOT_VERIFIED');

    const vendorSignup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Unverified Vendor', email: unverifiedVendorEmail, password, role: 'vendor' });
    const unverifiedVendorToken = vendorSignup.body.accessToken;
    const unverifiedVendorId = vendorSignup.body.user.id;

    // Approved so the vendor-status gate passes, isolating the assertion to
    // the email-verification gate specifically.
    await request(app)
      .patch(`/api/users/${unverifiedVendorId}/vendor-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    const blockedService = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${unverifiedVendorToken}`)
      .send({
        title: 'Should be blocked',
        category: 'photography_film',
        description: 'Should not be creatable while unverified.',
        priceRange: { min: 100, max: 200 },
      });
    expect(blockedService.status).toBe(403);
    expect(blockedService.body.code).toBe('EMAIL_NOT_VERIFIED');
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

  it('lets the client cancel their own booking', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'cancelled' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });
});

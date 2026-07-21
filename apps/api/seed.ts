/**
 * Populates a fresh database with a realistic slice of Shatha Events data:
 * one admin, five vendors (one per service category), three clients, a
 * handful of bookings across different statuses, a couple of tasks, and a
 * few notifications. Destructive - wipes every collection first.
 *
 * Usage: pnpm --filter @app/api seed   (or `pnpm seed` from the repo root)
 */
import bcrypt from 'bcrypt';
import { connectDb, disconnectDb } from './src/config/db.js';
import { logger } from './src/lib/logger.js';
import { User } from './src/models/User.js';
import { Service } from './src/models/Service.js';
import { Booking } from './src/models/Booking.js';
import { Task } from './src/models/Task.js';
import { Notification } from './src/models/Notification.js';
import { RefreshToken } from './src/models/RefreshToken.js';

const BCRYPT_ROUNDS = 12;
const SEED_PASSWORD = 'Password123!';
const DAY_MS = 24 * 60 * 60 * 1000;

const VENDOR_SEEDS = [
  {
    name: 'Amelia Rowe',
    email: 'amelia@decorco.example',
    category: 'decor_styling',
    title: 'Elegant Floral & Decor Styling',
    description:
      'Full-service floral design and venue styling for weddings and upscale events, from concept sketches through day-of teardown.',
    min: 1500,
    max: 8000,
  },
  {
    name: 'Noah Bennett',
    email: 'noah@lensandlight.example',
    category: 'photography_film',
    title: 'Lens & Light Photography + Film',
    description: 'Cinematic wedding and event photography and videography, with same-week sneak-peek galleries.',
    min: 1800,
    max: 6500,
  },
  {
    name: 'Priya Kapoor',
    email: 'priya@savorcatering.example',
    category: 'catering_hospitality',
    title: 'Savor Catering & Hospitality',
    description: 'Chef-driven catering with custom menus, full bar service, and trained front-of-house event staff.',
    min: 3000,
    max: 15000,
  },
  {
    name: 'Marcus Diallo',
    email: 'marcus@venueworks.example',
    category: 'venue_logistics',
    title: 'VenueWorks Logistics & Setup',
    description: 'End-to-end venue sourcing, floor-plan design, rentals, and day-of logistics management.',
    min: 2000,
    max: 12000,
  },
  {
    name: 'Sofia Torres',
    email: 'sofia@encoreent.example',
    category: 'entertainment_activities',
    title: 'Encore Entertainment & Activities',
    description: 'Live bands, DJs, MCs, and interactive guest experiences tailored to your event.',
    min: 900,
    max: 5000,
  },
] as const;

const CLIENT_SEEDS = [
  { name: 'Elena Martinez', email: 'elena@example.com' },
  { name: 'James O’Connor', email: 'james@example.com' },
  { name: 'Grace Kim', email: 'grace@example.com' },
] as const;

async function main(): Promise<void> {
  await connectDb();
  logger.info('Wiping existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Service.deleteMany({}),
    Booking.deleteMany({}),
    Task.deleteMany({}),
    Notification.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

  logger.info('Creating admin...');
  const admin = await User.create({
    name: 'Shatha Admin',
    email: 'admin@shatha.events',
    passwordHash,
    role: 'admin',
  });

  logger.info('Creating vendors and their services...');
  const services = [];
  for (const v of VENDOR_SEEDS) {
    const vendorUser = await User.create({ name: v.name, email: v.email, passwordHash, role: 'vendor' });
    const service = await Service.create({
      title: v.title,
      category: v.category,
      description: v.description,
      priceRange: { min: v.min, max: v.max },
      vendorId: vendorUser._id,
      isActive: true,
    });
    services.push(service);
  }
  const decor = services[0]!;
  const photo = services[1]!;
  const catering = services[2]!;
  const venue = services[3]!;
  const entertainment = services[4]!;

  logger.info('Creating clients...');
  const clients = [];
  for (const c of CLIENT_SEEDS) {
    clients.push(await User.create({ name: c.name, email: c.email, passwordHash, role: 'client' }));
  }
  const elena = clients[0]!;
  const james = clients[1]!;
  const grace = clients[2]!;

  logger.info('Creating bookings...');
  const booking1 = await Booking.create({
    clientId: elena._id,
    eventType: 'wedding',
    eventDate: new Date(Date.now() + 60 * DAY_MS),
    guestCount: 120,
    services: [
      { serviceId: decor._id, title: decor.title, notes: 'Ivory and sage color palette' },
      { serviceId: photo._id, title: photo.title, notes: null },
      { serviceId: catering._id, title: catering.title, notes: 'One vegan menu required' },
    ],
    budget: 25000,
    message: 'Looking for a garden-style wedding with a warm, elegant feel.',
    status: 'confirmed',
    assignedAdminId: admin._id,
    statusHistory: [
      { status: 'pending', changedAt: new Date(Date.now() - 10 * DAY_MS), note: null },
      { status: 'reviewed', changedAt: new Date(Date.now() - 8 * DAY_MS), note: 'Great fit for our top vendors' },
      { status: 'confirmed', changedAt: new Date(Date.now() - 5 * DAY_MS), note: 'Deposit received' },
    ],
  });

  const booking2 = await Booking.create({
    clientId: james._id,
    eventType: 'corporate',
    eventDate: new Date(Date.now() + 30 * DAY_MS),
    guestCount: 200,
    services: [
      { serviceId: venue._id, title: venue.title, notes: null },
      { serviceId: catering._id, title: catering.title, notes: 'Buffet style, gluten-free options required' },
    ],
    budget: 40000,
    message: 'Annual company gala - need full logistics support end to end.',
    status: 'pending',
    statusHistory: [{ status: 'pending', changedAt: new Date(), note: null }],
  });

  const booking3 = await Booking.create({
    clientId: grace._id,
    eventType: 'birthday',
    eventDate: new Date(Date.now() + 15 * DAY_MS),
    guestCount: 40,
    services: [
      { serviceId: entertainment._id, title: entertainment.title, notes: 'Live DJ, kid-friendly playlist' },
      { serviceId: photo._id, title: photo.title, notes: null },
    ],
    budget: 6000,
    status: 'reviewed',
    assignedAdminId: admin._id,
    statusHistory: [
      { status: 'pending', changedAt: new Date(Date.now() - 3 * DAY_MS), note: null },
      { status: 'reviewed', changedAt: new Date(Date.now() - 1 * DAY_MS), note: 'Assigning entertainment vendor now' },
    ],
  });

  logger.info('Creating tasks...');
  await Task.create([
    {
      bookingId: booking1._id,
      title: 'Confirm floral delivery time with venue',
      assignedTo: admin._id,
      dueDate: new Date(Date.now() + 20 * DAY_MS),
      status: 'todo',
    },
    {
      bookingId: booking1._id,
      title: 'Finalize catering headcount',
      assignedTo: admin._id,
      dueDate: new Date(Date.now() + 25 * DAY_MS),
      status: 'in_progress',
    },
    {
      bookingId: booking3._id,
      title: 'Book DJ equipment rental',
      assignedTo: admin._id,
      dueDate: new Date(Date.now() + 10 * DAY_MS),
      status: 'todo',
    },
  ]);

  logger.info('Creating notifications...');
  await Notification.create([
    {
      userId: elena._id,
      type: 'booking_status_changed',
      message: 'Your booking is now "confirmed"',
      relatedBookingId: booking1._id,
      isRead: false,
    },
    {
      userId: admin._id,
      type: 'new_booking',
      message: 'New booking request from a client for a corporate event',
      relatedBookingId: booking2._id,
      isRead: false,
    },
    {
      userId: grace._id,
      type: 'booking_status_changed',
      message: 'Your booking is now "reviewed"',
      relatedBookingId: booking3._id,
      isRead: true,
    },
  ]);

  logger.info('Seed complete.');
  logger.info(`All seeded accounts share the password: ${SEED_PASSWORD}`);
  logger.info('Admin login: admin@shatha.events');
  logger.info(`Vendor logins: ${VENDOR_SEEDS.map((v) => v.email).join(', ')}`);
  logger.info(`Client logins: ${CLIENT_SEEDS.map((c) => c.email).join(', ')}`);

  await disconnectDb();
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Seeding failed');
  process.exit(1);
});

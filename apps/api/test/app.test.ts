import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

// These exercise the app end-to-end through supertest, but deliberately only
// cover paths that never reach MongoDB (health check, 404s, and validation/
// auth failures that middleware/validate.ts and middleware/auth.ts reject
// before a controller ever touches the database) - no live Mongo instance
// is required to run this suite.
describe('GET /api/health', () => {
  it('responds 200 with an ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});

describe('unmatched routes', () => {
  it('returns a 404 ApiError-shaped body', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
  });
});

describe('input validation (no DB required - rejected before the controller runs)', () => {
  it('rejects signup with a malformed body', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects login with a missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('rejects an out-of-range services list query', async () => {
    const res = await request(app).get('/api/services').query({ limit: 5000 });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed id in the service detail route', async () => {
    const res = await request(app).get('/api/services/not-a-valid-object-id');
    expect(res.status).toBe(400);
  });
});

describe('authentication is required', () => {
  it('rejects GET /api/users/me without a token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('rejects POST /api/bookings without a token', async () => {
    const res = await request(app).post('/api/bookings').send({});
    expect(res.status).toBe(401);
  });

  it('rejects a malformed Authorization header', async () => {
    const res = await request(app).get('/api/users/me').set('Authorization', 'Basic not-a-bearer-token');
    expect(res.status).toBe(401);
  });

  it('rejects an obviously invalid bearer token', async () => {
    const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer garbage.token.value');
    expect(res.status).toBe(401);
  });
});

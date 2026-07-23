import { Router } from 'express';
import { ContactInputSchema } from '@app/shared';
import { validate } from '../../middleware/validate.js';
import { authRateLimiter } from '../../middleware/rate-limit.js';
import * as contactController from './contact.controller.js';

export const contactRouter = Router();

// Public, unauthenticated form - reuse the auth limiter's stricter budget
// since this is just as abusable for spam as signup/login.
contactRouter.post('/', authRateLimiter, validate(ContactInputSchema), contactController.submit);

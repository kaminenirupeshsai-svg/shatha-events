import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { imageUpload } from '../../middleware/upload.js';
import { uploadRateLimiter } from '../../middleware/rate-limit.js';
import * as uploadsController from './uploads.controller.js';

export const uploadsRouter = Router();

uploadsRouter.post('/', auth, uploadRateLimiter, imageUpload.single('file'), uploadsController.uploadImage);

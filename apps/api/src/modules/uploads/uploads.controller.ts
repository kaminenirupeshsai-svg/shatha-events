import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { AppError } from '../../lib/app-error.js';
import * as uploadsService from './uploads.service.js';

// Generic upload endpoint, independent of the domain-specific avatar
// (modules/users) and service-image (modules/services) flows - useful for
// any future feature that just needs "give me a URL for this file".
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw AppError.badRequest('No file was uploaded (expected field "file")', 'MISSING_FILE');
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const result = await uploadsService.uploadFile(
    { buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype },
    baseUrl,
  );
  res.status(201).json(result);
});

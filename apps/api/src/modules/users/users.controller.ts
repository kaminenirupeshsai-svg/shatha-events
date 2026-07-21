import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { AppError } from '../../lib/app-error.js';
import { saveUpload } from '../../lib/storage.js';
import * as usersService from './users.service.js';
import type { ListUsersParams } from './users.service.js';

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getMe(req.user!.id);
  res.status(200).json(user);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateProfile(req.user!.id, req.body);
  res.status(200).json(user);
});

export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  await usersService.updatePassword(req.user!.id, req.body);
  res.status(204).send();
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateSettings(req.user!.id, req.body);
  res.status(200).json(user);
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw AppError.badRequest('No file was uploaded (expected field "avatar")', 'MISSING_FILE');
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = await saveUpload(
    { buffer: req.file.buffer, originalname: req.file.originalname, mimetype: req.file.mimetype },
    baseUrl,
  );
  const user = await usersService.setAvatar(req.user!.id, url);
  res.status(200).json(user);
});

// GET /api/users - vendor-directory browsing (?role=vendor) is open to any
// signed-in user; listing any other slice of the user base is admin-only.
export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListUsersParams & { q?: string };
  const isVendorDirectoryLookup = query.role === 'vendor';
  if (!isVendorDirectoryLookup && req.user!.role !== 'admin') {
    throw AppError.forbidden('Only admins can list users');
  }
  const result = await usersService.listUsers(query);
  res.status(200).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getUserById(req.params.id as string);
  res.status(200).json(user);
});

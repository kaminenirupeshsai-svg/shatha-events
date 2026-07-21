import type { Request, Response } from 'express';
import type { ServiceListQuery } from '@app/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import { AppError } from '../../lib/app-error.js';
import { saveUpload } from '../../lib/storage.js';
import { verifyAccessToken } from '../../lib/jwt.js';
import type { AuthUser } from '../../middleware/auth.js';
import * as servicesService from './services.service.js';

/** Services listing/detail is public but personalized when a valid token is present - so auth is optional here, not required. */
function getOptionalUser(req: Request): AuthUser | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length).trim());
    return { id: payload.userId, role: payload.role };
  } catch {
    return undefined;
  }
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await servicesService.listServices(req.query as unknown as ServiceListQuery, getOptionalUser(req));
  res.status(200).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const service = await servicesService.getServiceById(req.params.id as string, getOptionalUser(req));
  res.status(200).json(service);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const service = await servicesService.createService(req.user!, req.body);
  res.status(201).json(service);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const service = await servicesService.updateService(req.params.id as string, req.user!, req.body);
  res.status(200).json(service);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await servicesService.deleteService(req.params.id as string, req.user!);
  res.status(204).send();
});

export const uploadImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw AppError.badRequest('No files were uploaded (expected field "images")', 'MISSING_FILE');
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const urls = await Promise.all(
    files.map((file) =>
      saveUpload({ buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype }, baseUrl),
    ),
  );
  const service = await servicesService.addServiceImages(req.params.id as string, req.user!, urls);
  res.status(200).json(service);
});

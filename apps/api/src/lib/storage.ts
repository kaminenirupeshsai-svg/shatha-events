import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from './logger.js';
import { AppError } from './app-error.js';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export interface StorageService {
  /**
   * Persists the file and returns an absolute, publicly-fetchable URL.
   * `baseUrl` (e.g. "http://localhost:4000") is only used by the local
   * driver, which serves files back out of itself; the Cloudinary driver
   * already returns a fully-qualified URL of its own.
   */
  save(file: UploadedFile, baseUrl: string): Promise<string>;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

function extensionFor(mimetype: string, originalname: string): string {
  const known: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return known[mimetype] ?? path.extname(originalname) ?? '';
}

/** Default driver: writes into apps/api/uploads, served statically by app.ts at /uploads. */
class LocalStorageService implements StorageService {
  async save(file: UploadedFile, baseUrl: string): Promise<string> {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const filename = `${randomUUID()}${extensionFor(file.mimetype, file.originalname)}`;
    await fs.writeFile(path.join(UPLOADS_DIR, filename), file.buffer);
    return `${baseUrl}/uploads/${filename}`;
  }
}

/**
 * Cloudinary driver. Talks to the plain upload REST API via fetch (no SDK
 * dependency, same approach as lib/email.service.ts's Resend driver) using a
 * signed request so no unsigned upload preset needs to be configured.
 */
class CloudinaryStorageService implements StorageService {
  async save(file: UploadedFile): Promise<string> {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new Error('STORAGE_DRIVER=cloudinary requires the three CLOUDINARY_* env vars');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + env.CLOUDINARY_API_SECRET)
      .digest('hex');

    const form = new FormData();
    form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    form.append('api_key', env.CLOUDINARY_API_KEY);
    form.append('timestamp', String(timestamp));
    form.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: form },
    );
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      logger.error({ status: response.status, text }, 'Cloudinary upload failed');
      throw new Error(`Cloudinary upload error: ${response.status}`);
    }
    const data = (await response.json()) as { secure_url?: string };
    if (!data.secure_url) {
      throw new Error('Cloudinary response missing secure_url');
    }
    return data.secure_url;
  }
}

function createStorageService(): StorageService {
  if (env.STORAGE_DRIVER === 'cloudinary') {
    return new CloudinaryStorageService();
  }
  return new LocalStorageService();
}

export const storageService: StorageService = createStorageService();

export async function saveUpload(file: UploadedFile, baseUrl: string): Promise<string> {
  try {
    return await storageService.save(file, baseUrl);
  } catch (err) {
    logger.error({ err }, 'File upload failed');
    throw AppError.internal('Could not store the uploaded file', 'UPLOAD_FAILED');
  }
}

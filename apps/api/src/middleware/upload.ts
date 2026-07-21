import multer from 'multer';
import { AppError } from '../lib/app-error.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Buffers the file in memory (never touches disk directly) so
 * lib/storage.ts's local and Cloudinary drivers can both consume the same
 * shape. Fine at this scale - image uploads are capped at 5MB.
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(AppError.badRequest('Only JPEG, PNG, WEBP, or GIF images are allowed', 'INVALID_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
});

import { saveUpload } from '../../lib/storage.js';
import type { UploadedFile } from '../../lib/storage.js';

export async function uploadFile(file: UploadedFile, baseUrl: string): Promise<{ url: string }> {
  const url = await saveUpload(file, baseUrl);
  return { url };
}

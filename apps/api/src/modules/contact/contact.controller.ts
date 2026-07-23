import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import * as contactService from './contact.service.js';

export const submit = asyncHandler(async (req: Request, res: Response) => {
  await contactService.sendContactMessage(req.body);
  res.status(200).json({ message: "Message sent — we'll get back to you within a business day." });
});

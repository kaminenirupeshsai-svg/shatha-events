import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import * as messagesService from './messages.service.js';

// bookingId arrives as :id (this router is mounted at
// /api/bookings/:id/messages with mergeParams - see bookings.routes.ts);
// vendorId is this router's own :vendorId segment.

export const listThread = asyncHandler(async (req: Request, res: Response) => {
  const messages = await messagesService.listThread(
    req.params.id as string,
    req.params.vendorId as string,
    req.user!,
  );
  res.status(200).json(messages);
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await messagesService.sendMessage(
    req.params.id as string,
    req.params.vendorId as string,
    req.user!,
    req.body,
  );
  res.status(201).json(message);
});

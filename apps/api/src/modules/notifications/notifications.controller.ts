import type { Request, Response } from 'express';
import type { NotificationListQuery } from '@app/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import * as notificationsService from './notifications.service.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.listNotifications(
    req.user!.id,
    req.query as unknown as NotificationListQuery,
  );
  res.status(200).json(result);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationsService.markRead(req.user!.id, req.params.id as string);
  res.status(200).json(notification);
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAllRead(req.user!.id);
  res.status(204).send();
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationsService.unreadCount(req.user!.id);
  res.status(200).json({ count });
});

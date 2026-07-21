import type { Request, Response } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import * as tasksService from './tasks.service.js';

// bookingId arrives as :id because this controller is mounted at
// /api/bookings/:id/tasks (see modules/bookings/bookings.routes.ts) with
// mergeParams enabled on the nested router.
export const createForBooking = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.createTask(req.params.id as string, req.body);
  res.status(201).json(task);
});

export const listForBooking = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await tasksService.listForBooking(req.params.id as string);
  res.status(200).json(tasks);
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await tasksService.listMine(req.user!.id);
  res.status(200).json(tasks);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const task = await tasksService.updateStatus(req.params.id as string, req.user!, req.body.status);
  res.status(200).json(task);
});

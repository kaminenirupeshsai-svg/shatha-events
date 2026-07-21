import type { Request, Response } from 'express';
import type { BookingListQuery } from '@app/shared';
import { asyncHandler } from '../../lib/async-handler.js';
import * as bookingsService from './bookings.service.js';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingsService.createBooking(req.user!, req.body);
  res.status(201).json(booking);
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingsService.listMyBookings(req.user!.id, req.query as unknown as BookingListQuery);
  res.status(200).json(result);
});

export const listVendor = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingsService.listVendorBookings(req.user!, req.query as unknown as BookingListQuery);
  res.status(200).json(result);
});

export const listAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookingsService.listAllBookings(req.query as unknown as BookingListQuery);
  res.status(200).json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingsService.getBookingById(req.params.id as string, req.user!);
  res.status(200).json(booking);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingsService.updateStatus(req.params.id as string, req.user!, req.body);
  res.status(200).json(booking);
});

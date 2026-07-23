import type { CreateServiceInput, ServiceListQuery, UpdateServiceInput } from '@app/shared';
import { Service } from '../../models/Service.js';
import type { ServiceDoc } from '../../models/Service.js';
import { User } from '../../models/User.js';
import { AppError } from '../../lib/app-error.js';
import { buildPaginatedResult, escapeRegex } from '../../lib/pagination.js';
import type { AuthUser } from '../../middleware/auth.js';
import { toServiceDto } from './services.mapper.js';

const SORT_MAP: Record<ServiceListQuery['sort'], Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { 'priceRange.min': 1 },
  price_desc: { 'priceRange.max': -1 },
};

export async function listServices(query: ServiceListQuery, viewer?: AuthUser) {
  const filter: Record<string, unknown> = {};
  if (query.category) filter.category = query.category;
  if (query.vendorId) filter.vendorId = query.vendorId;
  if (query.q) filter.title = { $regex: escapeRegex(query.q), $options: 'i' };

  // Inactive services are hidden from the public catalog, visible only to
  // admins and to the vendor viewing their own listing.
  const viewerOwnsVendorFilter = Boolean(viewer && query.vendorId && viewer.id === query.vendorId);
  const canSeeInactive = viewer?.role === 'admin' || viewerOwnsVendorFilter;
  if (!canSeeInactive) filter.isActive = true;

  const skip = (query.page - 1) * query.limit;
  const [docs, total] = await Promise.all([
    Service.find(filter)
      .populate('vendorId', 'name')
      .sort(SORT_MAP[query.sort])
      .skip(skip)
      .limit(query.limit),
    Service.countDocuments(filter),
  ]);
  return buildPaginatedResult(docs.map(toServiceDto), total, query.page, query.limit);
}

export async function getServiceById(id: string, viewer?: AuthUser) {
  const doc = await Service.findById(id).populate('vendorId', 'name');
  if (!doc) throw AppError.notFound('Service not found');

  const isOwner = Boolean(viewer && doc.vendorId && (doc.vendorId as { _id: { toString(): string } })._id.toString() === viewer.id);
  if (!doc.isActive && viewer?.role !== 'admin' && !isOwner) {
    throw AppError.notFound('Service not found');
  }
  return toServiceDto(doc);
}

export async function createService(vendor: AuthUser, input: CreateServiceInput) {
  // Checked fresh from the DB rather than the JWT, since both flags can
  // change mid-session and the access token has no opinion on either (see
  // auth/jwt.ts's payload shape).
  const account = await User.findById(vendor.id).select('vendorStatus emailVerified');

  // Admins aren't subject to vendor vetting, but every account (including
  // admins, though seeded admin accounts are always pre-verified) still
  // needs a confirmed email - see auth.service.ts signup/verifyEmail.
  if (vendor.role !== 'admin' && account?.vendorStatus !== 'approved') {
    throw AppError.forbidden('Your vendor account is pending admin approval', 'VENDOR_NOT_APPROVED');
  }
  if (!account?.emailVerified) {
    throw AppError.forbidden('Please verify your email before listing services', 'EMAIL_NOT_VERIFIED');
  }

  const doc = await Service.create({
    title: input.title,
    category: input.category,
    description: input.description,
    priceRange: input.priceRange,
    vendorId: vendor.id,
  });
  await doc.populate('vendorId', 'name');
  return toServiceDto(doc);
}

async function loadOwnedService(id: string, viewer: AuthUser): Promise<ServiceDoc> {
  const doc = await Service.findById(id);
  if (!doc) throw AppError.notFound('Service not found');
  const isOwner = doc.vendorId?.toString() === viewer.id;
  if (viewer.role !== 'admin' && !isOwner) {
    throw AppError.forbidden('You can only manage your own services');
  }
  return doc;
}

export async function updateService(id: string, viewer: AuthUser, input: UpdateServiceInput) {
  const doc = await loadOwnedService(id, viewer);
  if (input.title !== undefined) doc.title = input.title;
  if (input.category !== undefined) doc.category = input.category;
  if (input.description !== undefined) doc.description = input.description;
  if (input.priceRange !== undefined) doc.priceRange = input.priceRange;
  if (input.isActive !== undefined) doc.isActive = input.isActive;
  await doc.save();
  await doc.populate('vendorId', 'name');
  return toServiceDto(doc);
}

export async function deleteService(id: string, viewer: AuthUser): Promise<void> {
  const doc = await loadOwnedService(id, viewer);
  await doc.deleteOne();
}

export async function addServiceImages(id: string, viewer: AuthUser, urls: string[]) {
  const doc = await loadOwnedService(id, viewer);
  doc.images = [...(doc.images ?? []), ...urls];
  await doc.save();
  await doc.populate('vendorId', 'name');
  return toServiceDto(doc);
}

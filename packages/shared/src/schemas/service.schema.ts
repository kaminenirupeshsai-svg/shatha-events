import { z } from 'zod';
import { MongoIdSchema, PaginationQuerySchema } from './common.schema.js';

export const ServiceCategorySchema = z.enum([
  'decor_styling',
  'photography_film',
  'catering_hospitality',
  'venue_logistics',
  'entertainment_activities',
]);
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  decor_styling: 'Decor & Styling',
  photography_film: 'Photography & Film',
  catering_hospitality: 'Catering & Hospitality',
  venue_logistics: 'Venue & Logistics',
  entertainment_activities: 'Entertainment & Activities',
};

export const PriceRangeSchema = z.object({
  min: z.coerce.number().min(0),
  max: z.coerce.number().min(0),
});

export const ServiceDtoSchema = z.object({
  id: MongoIdSchema,
  title: z.string(),
  category: ServiceCategorySchema,
  description: z.string(),
  priceRange: PriceRangeSchema,
  images: z.array(z.string()),
  vendorId: MongoIdSchema.nullable(),
  vendorName: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type ServiceDto = z.infer<typeof ServiceDtoSchema>;

export const CreateServiceInputSchema = z
  .object({
    title: z.string().trim().min(3, 'Title is too short').max(120),
    category: ServiceCategorySchema,
    description: z.string().trim().min(10, 'Add a bit more detail').max(2000),
    priceRange: PriceRangeSchema,
  })
  .refine((v) => v.priceRange.max >= v.priceRange.min, {
    message: 'Maximum price must be greater than or equal to the minimum',
    path: ['priceRange', 'max'],
  });
export type CreateServiceInput = z.infer<typeof CreateServiceInputSchema>;

export const UpdateServiceInputSchema = CreateServiceInputSchema.innerType()
  .partial()
  .extend({ isActive: z.boolean().optional() });
export type UpdateServiceInput = z.infer<typeof UpdateServiceInputSchema>;

export const ServiceListQuerySchema = PaginationQuerySchema.extend({
  q: z.string().trim().max(200).optional(),
  category: ServiceCategorySchema.optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  vendorId: MongoIdSchema.optional(),
});
export type ServiceListQuery = z.infer<typeof ServiceListQuerySchema>;

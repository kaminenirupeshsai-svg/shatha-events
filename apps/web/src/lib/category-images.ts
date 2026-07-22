import type { ServiceCategory } from '@app/shared';

// Curated, stable Unsplash photo IDs used as category-fallback imagery
// wherever a service has no uploaded photos of its own (service.images is
// empty until a vendor uploads real photos). Real uploads always take
// priority - see ServiceCard's use of categoryImageUrl.
const CATEGORY_PHOTO_ID: Record<ServiceCategory, string> = {
  decor_styling: '1710587384835-0f3de33d8042',
  photography_film: '1519689950823-0a2251441815',
  catering_hospitality: '1518619745898-93e765966dcd',
  venue_logistics: '1723832348105-2e69f948135a',
  entertainment_activities: '1594623930572-300a3011d9ae',
};

export function categoryImageUrl(category: ServiceCategory, width = 800): string {
  return `https://images.unsplash.com/photo-${CATEGORY_PHOTO_ID[category]}?w=${width}&q=80&auto=format&fit=crop`;
}

export const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1595947416609-36011acee3d4?w=1600&q=80&auto=format&fit=crop';

export const CATEGORY_TONE: Record<ServiceCategory, string> = {
  decor_styling: 'bg-amber-tint',
  photography_film: 'bg-teal-tint',
  catering_hospitality: 'bg-terracotta-tint',
  venue_logistics: 'bg-emerald-tint',
  entertainment_activities: 'bg-slate-tint',
};

export const CATEGORY_ACCENT: Record<ServiceCategory, string> = {
  decor_styling: 'bg-amber',
  photography_film: 'bg-teal',
  catering_hospitality: 'bg-terracotta',
  venue_logistics: 'bg-emerald',
  entertainment_activities: 'bg-slate',
};

export const CATEGORY_BLURB: Record<ServiceCategory, string> = {
  decor_styling: 'Florals, staging, and styling that set the scene.',
  photography_film: 'Photographers and videographers who capture the day.',
  catering_hospitality: 'Menus, bar service, and staff for every guest count.',
  venue_logistics: 'Venues, rentals, and day-of logistics handled.',
  entertainment_activities: 'Music, hosts, and activities that keep it lively.',
};

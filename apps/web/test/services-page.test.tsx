import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ServiceDto } from '@app/shared';

// Mock the data-fetching hooks so this stays a presentational smoke test —
// no real network/React Query wiring needed to prove "loading -> content".
const mockUseServices = vi.fn();

vi.mock('@/features/services/hooks', () => ({
  useServices: (...args: unknown[]) => mockUseServices(...args),
  useCreateService: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateService: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteService: () => ({ mutate: vi.fn(), isPending: false }),
  useService: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('@/features/auth/hooks', () => ({
  useMe: () => ({
    data: { id: 'client-1', role: 'client', name: 'Ada Lovelace', email: 'ada@example.com' },
    isLoading: false,
  }),
}));

import ServicesPage from '@/app/(app)/services/page';

const mockService: ServiceDto = {
  id: '507f1f77bcf86cd799439011',
  title: 'Golden Hour Photography',
  category: 'photography_film',
  description: 'Full-day wedding coverage with a same-week preview gallery.',
  priceRange: { min: 1200, max: 3200 },
  images: [],
  vendorId: '507f1f77bcf86cd799439012',
  vendorName: 'Lumen Studios',
  isActive: true,
  avgRating: null,
  reviewCount: 0,
  createdAt: new Date().toISOString(),
};

describe('ServicesPage', () => {
  beforeEach(() => {
    mockUseServices.mockReset();
  });

  it('renders skeleton placeholders while the query is loading', () => {
    mockUseServices.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = render(<ServicesPage />);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('Golden Hour Photography')).not.toBeInTheDocument();
  });

  it('renders the fetched services once the query resolves', () => {
    mockUseServices.mockReturnValue({
      data: { items: [mockService], page: 1, limit: 12, total: 1, totalPages: 1 },
      isLoading: false,
    });

    render(<ServicesPage />);

    expect(screen.getByText('Golden Hour Photography')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows an empty state with no results instead of an empty grid', () => {
    mockUseServices.mockReturnValue({
      data: { items: [], page: 1, limit: 12, total: 0, totalPages: 0 },
      isLoading: false,
    });

    render(<ServicesPage />);

    expect(screen.getByText(/no services match your filters/i)).toBeInTheDocument();
  });
});

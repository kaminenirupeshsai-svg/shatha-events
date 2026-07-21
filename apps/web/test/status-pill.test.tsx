import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { BookingStatus } from '@app/shared';
import { StatusPill } from '@/components/shared/status-pill';

describe('StatusPill', () => {
  const cases: [BookingStatus, string][] = [
    ['pending', 'Pending'],
    ['reviewed', 'Reviewed'],
    ['confirmed', 'Confirmed'],
    ['in_progress', 'In progress'],
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
  ];

  it.each(cases)('renders the label for "%s"', (status, expectedLabel) => {
    render(<StatusPill status={status} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('never renders color as the only signal — the status word is always present as text', () => {
    render(<StatusPill status="confirmed" />);
    // The pill must contain readable text, not just a colored dot.
    expect(screen.getByText('Confirmed').textContent).toBe('Confirmed');
  });

  it('applies the emerald tone for "confirmed" per statusToneMap', () => {
    render(<StatusPill status="confirmed" />);
    expect(screen.getByText('Confirmed')).toHaveClass('bg-emerald-tint', 'text-emerald');
  });

  it('applies the terracotta tone for "cancelled" per statusToneMap', () => {
    render(<StatusPill status="cancelled" />);
    expect(screen.getByText('Cancelled')).toHaveClass('bg-terracotta-tint', 'text-terracotta');
  });

  it('applies the solid emerald-on-ivory tone for "completed" per statusToneMap', () => {
    render(<StatusPill status="completed" />);
    expect(screen.getByText('Completed')).toHaveClass('bg-emerald', 'text-ivory');
  });
});

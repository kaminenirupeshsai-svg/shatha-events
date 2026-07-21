import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { LoginForm } from '@/features/auth/login-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('LoginForm', () => {
  it('shows a validation error for an invalid email on blur, not on every keystroke', async () => {
    const user = userEvent.setup();
    renderWithClient(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);

    // Typing alone (no blur yet) must not surface an error — validation is onBlur.
    await user.type(emailInput, 'not-an-email');
    expect(screen.queryByText(/enter a valid email address/i)).not.toBeInTheDocument();

    // Leaving the field (blur) triggers validation.
    await user.tab();
    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  it('surfaces validation errors for every required field on a bad submit', async () => {
    const user = userEvent.setup();
    renderWithClient(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(await screen.findByText(/enter your password/i)).toBeInTheDocument();
  });

  it('moves focus to the first invalid field after a failed submit', async () => {
    const user = userEvent.setup();
    renderWithClient(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await screen.findByText(/enter a valid email address/i);
    expect(screen.getByLabelText(/email address/i)).toHaveFocus();
  });
});

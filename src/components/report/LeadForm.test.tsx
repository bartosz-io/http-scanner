// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LeadSubmissionResponseDTO } from '../../types';
import { LeadForm } from './LeadForm';

const HASH = '9249232fefb9a1c0455ba007d7784f6c';
const SCORE = 47.5;
const ACCEPTED: LeadSubmissionResponseDTO = {
  accepted: true,
  leadId: '7af46242-3570-4d9c-a08d-a70a07b9b817',
};

afterEach(() => {
  cleanup();
});

async function fillValidForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Message'), 'Help with CSP');
  await user.click(screen.getByRole('checkbox', {
    name: 'I agree to be contacted about paid security configuration support.',
  }));
  return user;
}

describe('LeadForm', () => {
  it('shows field-specific errors for required name, email, and consent', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(ACCEPTED);

    render(<LeadForm hash={HASH} score={SCORE} submit={submit} capture={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Request paid help' }));

    expect(await screen.findByText('Enter your name.')).not.toBeNull();
    expect(await screen.findByText('Enter a valid email address.')).not.toBeNull();
    expect(await screen.findByText('Consent is required.')).not.toBeNull();
    expect(submit).not.toHaveBeenCalled();
  });

  it('enforces the field limits in the rendered controls', () => {
    render(<LeadForm hash={HASH} score={SCORE} submit={vi.fn()} capture={vi.fn()} />);

    expect((screen.getByLabelText('Name') as HTMLInputElement).maxLength).toBe(100);
    expect((screen.getByLabelText('Email') as HTMLInputElement).maxLength).toBe(254);
    expect((screen.getByLabelText('Message') as HTMLTextAreaElement).maxLength).toBe(2000);
  });

  it('allows only one submission while the request is pending', async () => {
    let resolveSubmission!: (value: LeadSubmissionResponseDTO) => void;
    const submit = vi.fn(() => new Promise<LeadSubmissionResponseDTO>((resolve) => {
      resolveSubmission = resolve;
    }));
    const user = await fillValidFormAfterRender(submit);
    const button = screen.getByRole('button', { name: 'Requesting help…' }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    await user.click(button);
    expect(submit).toHaveBeenCalledOnce();

    await act(async () => {
      resolveSubmission(ACCEPTED);
    });
    expect(await screen.findByText('Your request has been received.')).not.toBeNull();
  });

  it('replaces the form after success and captures only report context', async () => {
    const capture = vi.fn();
    const submit = vi.fn().mockResolvedValue(ACCEPTED);
    render(<LeadForm hash={HASH} score={SCORE} submit={submit} capture={capture} />);

    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: 'Request paid help' }));

    expect(await screen.findByText('Your request has been received.')).not.toBeNull();
    expect(screen.queryByRole('form')).toBeNull();
    expect(submit).toHaveBeenCalledWith({
      hash: HASH,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Help with CSP',
      consent: true,
      website: '',
    });
    expect(capture.mock.calls).toEqual([
      ['lead form viewed', { hash: HASH, score: SCORE }],
      ['lead submitted', { hash: HASH, score: SCORE }],
    ]);
  });

  it('preserves values and offers a retry after a failed request', async () => {
    const capture = vi.fn();
    const submit = vi.fn()
      .mockRejectedValueOnce(new Error('An internal error occurred'))
      .mockResolvedValueOnce(ACCEPTED);
    render(<LeadForm hash={HASH} score={SCORE} submit={submit} capture={capture} />);

    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: 'Request paid help' }));

    expect(await screen.findByText('We could not submit your request. Please try again.')).not.toBeNull();
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Ada Lovelace');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('ada@example.com');
    expect((screen.getByLabelText('Message') as HTMLTextAreaElement).value).toBe('Help with CSP');
    expect(capture).toHaveBeenCalledWith('lead submission failed', {
      hash: HASH,
      score: SCORE,
    });

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Your request has been received.')).not.toBeNull();
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('keeps the honeypot inaccessible and marks the form as private', () => {
    const { container } = render(
      <LeadForm hash={HASH} score={SCORE} submit={vi.fn()} capture={vi.fn()} />
    );

    const root = container.firstElementChild;
    expect(root?.classList.contains('ph-no-capture')).toBe(true);
    expect(root?.classList.contains('ph-mask')).toBe(true);
    expect(screen.queryByRole('textbox', { name: 'Website' })).toBeNull();

    const honeypot = container.querySelector<HTMLInputElement>('input[name="website"]');
    expect(honeypot?.type).toBe('hidden');
    expect(honeypot?.value).toBe('');
  });
});

async function fillValidFormAfterRender(
  submit: (input: Parameters<NonNullable<React.ComponentProps<typeof LeadForm>['submit']>>[0]) => Promise<LeadSubmissionResponseDTO>
) {
  render(<LeadForm hash={HASH} score={SCORE} submit={submit} capture={vi.fn()} />);
  const user = await fillValidForm();
  await user.click(screen.getByRole('button', { name: 'Request paid help' }));
  await waitFor(() => expect(submit).toHaveBeenCalledOnce());
  return user;
}

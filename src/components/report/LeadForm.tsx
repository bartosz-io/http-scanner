import { useEffect, useRef, useState, type FormEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  LEAD_FIELD_LIMITS,
  leadSubmissionSchema,
  type LeadSubmissionRequestDTO,
} from '@shared/leadSubmission';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { submitLeadSubmission } from '@/lib/leadSubmissions';
import { capturePostHogEventWithoutAttribution } from '@/lib/posthogClient';
import type { LeadFormProps } from '@/types/reportTypes';

type LeadFormInput = z.input<typeof leadSubmissionSchema>;
type SubmissionState = 'idle' | 'error' | 'success';

export function LeadForm({
  hash,
  score,
  submit = submitLeadSubmission,
  capture = capturePostHogEventWithoutAttribution,
}: LeadFormProps) {
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [showMessage, setShowMessage] = useState(false);
  const submissionInFlight = useRef(false);
  const form = useForm<LeadFormInput, unknown, LeadSubmissionRequestDTO>({
    resolver: zodResolver(leadSubmissionSchema),
    defaultValues: {
      hash,
      name: '',
      email: '',
      message: '',
      consent: false,
      website: '',
    },
  });

  useEffect(() => {
    capture('lead form viewed', { hash, score });
  }, [capture, hash, score]);

  const handleSubmit = async (values: LeadSubmissionRequestDTO) => {
    if (submissionInFlight.current) {
      return;
    }

    submissionInFlight.current = true;
    setSubmissionState('idle');

    try {
      await submit(values);
      capture('lead submitted', { hash, score });
      setSubmissionState('success');
    } catch {
      capture('lead submission failed', { hash, score });
      setSubmissionState('error');
    } finally {
      submissionInFlight.current = false;
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void form.handleSubmit(handleSubmit)(event);
  };

  return (
    <div className="ph-no-capture ph-mask h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-md border">
        <div className="bg-muted px-6 py-3">
          <h2 className="text-xl font-semibold">Need help fixing your security headers?</h2>
        </div>
        <div className="flex-grow p-4 sm:p-5">
          {submissionState === 'success' ? (
            <div role="status" className="space-y-2">
              <p className="font-medium">Your request has been received.</p>
              <p className="text-muted-foreground text-sm">
                We will contact you about paid security configuration support.
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-3 text-sm">
                Request paid help configuring your site&apos;s HTTP security headers.
              </p>
              <Form {...form}>
                <form
                  aria-label="Paid security help request"
                  className="space-y-3"
                  onSubmit={onSubmit}
                >
                  <input type="hidden" {...form.register('hash')} />
                  <input type="hidden" {...form.register('website')} />

                  <div
                    data-testid="lead-identity-fields"
                    className="grid gap-3 md:grid-cols-2"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              autoComplete="name"
                              maxLength={LEAD_FIELD_LIMITS.name}
                              aria-required="true"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="email"
                              maxLength={LEAD_FIELD_LIMITS.email}
                              aria-required="true"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={showMessage}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setShowMessage(checked);
                        if (!checked) {
                          form.setValue('message', '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                    <span>Add custom message</span>
                  </label>

                  {showMessage && (
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              maxLength={LEAD_FIELD_LIMITS.message}
                              placeholder="What would you like help with?"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="mt-1 size-4"
                              aria-required="true"
                              checked={field.value}
                              onBlur={field.onBlur}
                              onChange={field.onChange}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormLabel className="font-normal leading-5">
                            I agree to be contacted about paid security configuration support.
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {submissionState === 'error' && (
                    <p role="alert" className="text-destructive text-sm">
                      We could not submit your request. Please try again.
                    </p>
                  )}

                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? 'Requesting help…'
                      : submissionState === 'error'
                        ? 'Try again'
                        : 'Request paid help'}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

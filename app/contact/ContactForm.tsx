'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './contact.module.css';

const ContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name needs at least 2 characters')
    .max(80, 'Keep the name under 80 characters'),
  email: z.string().trim().email('Use a valid email so we can reply'),
  message: z
    .string()
    .trim()
    .min(10, 'Tell us a bit more — at least 10 characters')
    .max(2000, 'Keep the message under 2,000 characters'),
});

type ContactInput = z.infer<typeof ContactSchema>;

export function ContactForm() {
  const [submitted, setSubmitted] = useState<ContactInput | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactInput>({
    resolver: zodResolver(ContactSchema),
    defaultValues: { name: '', email: '', message: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    // Mock backend — Task 9 spec says: log to console + show inline success.
    // Real wire-up lands in the backend phase.
    // eslint-disable-next-line no-console
    console.info('[contact] submission (mock):', data);
    await new Promise((res) => setTimeout(res, 400));
    setSubmitted(data);
    reset();
  });

  if (submitted) {
    return (
      <div className={styles.success} role="status" aria-live="polite">
        <p className={styles.successHeading}>MESSAGE QUEUED</p>
        <p className={styles.successBody}>
          Thanks, {submitted.name}. I&apos;ll reply to {submitted.email} within
          one working day. If it&apos;s urgent, WhatsApp is faster — link on
          the left.
        </p>
        <p className={styles.successHint}>
          (Note: real email delivery lands in the backend phase. For
          tonight, the form just logs to your browser console so you can
          see the payload.)
        </p>
        <button
          type="button"
          className={styles.successReset}
          onClick={() => setSubmitted(null)}
        >
          Send another →
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <p className={`h-eyebrow ${styles.formHeading}`}>SEND A MESSAGE</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-name">
          NAME
        </label>
        <input
          id="contact-name"
          className={styles.input}
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          {...register('name')}
        />
        {errors.name?.message && (
          <p id="contact-name-error" className={styles.error}>
            {errors.name.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-email">
          EMAIL
        </label>
        <input
          id="contact-email"
          className={styles.input}
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          {...register('email')}
        />
        {errors.email?.message && (
          <p id="contact-email-error" className={styles.error}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-message">
          MESSAGE
        </label>
        <textarea
          id="contact-message"
          className={styles.textarea}
          rows={6}
          aria-invalid={!!errors.message}
          aria-describedby={
            errors.message ? 'contact-message-error' : undefined
          }
          {...register('message')}
        />
        {errors.message?.message && (
          <p id="contact-message-error" className={styles.error}>
            {errors.message.message}
          </p>
        )}
      </div>

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send message →'}
      </button>
    </form>
  );
}

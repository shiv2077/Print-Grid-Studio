# Task 9 — /contact — plan

## Overnight spec
- Two-column desktop, stacked mobile
- Left: WhatsApp button (primary CTA), email link, hours, location
- Right: form (name, email, message). RHF + Zod. Submit handler logs
  to console + shows success state inline. (Real wire-up in backend.)
- Commit + reviewer.

## Approach
- `app/contact/page.tsx` — server component composition (intro + 2-col layout)
- `app/contact/ContactForm.tsx` — `'use client'` form (RHF + Zod)
- `app/contact/contact.module.css` — styles
- Form schema:
  - name: 2–80 chars
  - email: valid email
  - message: 10–2000 chars
- Submit handler logs to console, sets `submitted=true` state, shows
  inline success card. Form resets on success.
- WhatsApp button on the left is a styled `<a>` (not `<button>`) — same
  pattern as the Header CTA, no nesting violation.

## Inputs styling
- Bottom-border-only inputs (industrial / form-on-paper aesthetic)
- Focus state inherits global :focus-visible
- Error message in mono, ink-90 with accent dot prefix

## Acceptance
- 2-col desktop, single col mobile (≤900px)
- RHF + Zod valid; submit logs + shows success inline
- No `any`, no inline style for layout

# Task 3 — Layout shell — plan

Build StatusStrip, Header, Footer. Wire all three into `app/layout.tsx`.

## StatusStrip

- Full-width hairline-bottom strip
- Single line: `CHENNAI · HYDERABAD LATE JUNE 2026 · SHIPS PAN-INDIA IN 4 DAYS`
- mono-label class (JetBrains 11px uppercase 0.1em tracking)
- Sticky on scroll? No — sits above the Header, scrolls away normally
- Background: `--paper`, border-bottom: hairline
- Padding: 8px 0 vertical, container-aligned horizontally
- Server component
- Mobile: same content; if it overflows on 375px, allow horizontal
  marquee-like overflow OR truncate the middle "·" segment. Decision:
  shrink to 10px font and let it wrap if needed — wrapping with the
  bullet-separator looks fine.

## Header

- Sticky: `position: sticky; top: 0; z-index: 50; background: var(--paper);`
- Height: ~64px desktop, ~56px mobile
- Hairline border-bottom
- Wordmark left:
  - `PRINTGRID` — Inter 600, 18px, tracked normal
  - `studio · 3d printing` — JetBrains mono 11px, ink-50, on a second line
    OR inline. Decision: stack vertically. Tight column.
  - Anchored to /
- Nav right (4 links): Materials, How it works, Pricing, Contact
  - Inter 500 14px, ink-70 default, ink + 1px underline accent on hover
  - Hidden < 900px
- CTA right-most: `Button variant="primary"` "Get a quote →"
  - Compressed padding: 10px 20px (a hair smaller than default 14/28
    so the header doesn't feel tall)
- Mobile (≤900px):
  - Hamburger button on the right (lucide `Menu`)
  - Click opens a full-screen overlay: paper bg, big nav links
    (display-3 size), close button (lucide `X`) top-right
  - Esc closes the overlay
  - Body scroll locked while overlay open
  - Overlay is its own client component; the rest of Header stays SSR

## Footer

- 4-col grid desktop, stacked mobile
- bg `--ink`, color `--paper` (`on-ink` class)
- Padding: 96px top + bottom desktop, 64px mobile
- Internal hairlines: `--paper-30` for separators
- Top row: wordmark + tagline column (col 1) and 3 link/contact columns
- Cols:
  1. **Wordmark**: PRINTGRID + studio strapline + one-paragraph tagline:
     "Custom 3D printing from a small Chennai studio. Ships pan-India
     in 4 days. No SaaS, no surprises."
  2. **Pages**: Quote, Materials, About, Contact
  3. **Legal**: Terms, Privacy, Refunds, Shipping
  4. **Contact**:
     - WhatsApp: `wa.me/917540023670` (rendered as "+91 75400 23670")
     - Email: `aadharsh.j10@gmail.com`
     - Hours: "Mon–Sat · 10–7 IST"
     - Location: "Anna Nagar, Chennai"
- Bottom row (full width, hairline above):
  - Left: `© 2026 PRINTGRID STUDIO · Chennai, India`
  - Right: GSTIN placeholder mono `GSTIN — pending` (will be filled in
    by Aadharsh; flag in needs-human.md)

## app/layout.tsx wiring

- Import StatusStrip, Header, Footer
- Render order in `<body>`:
  ```
  <StatusStrip />
  <Header />
  {children}
  <Footer />
  ```
- The placeholder demo page (`app/page.tsx`) loses its bottom "Tasks
  complete" Section because the Footer now provides closure.

## Acceptance

- `tsc --noEmit` clean
- `npm test` green
- Header sticky verified (will manual-check later in Task 13)
- Mobile hamburger toggle works (will be exercised in browser during
  Task 13)
- All footer links lead somewhere or to a `#` placeholder for pages
  not yet built. Task 12 lands the legal pages; until then those use
  `#` and a comment. (Actually — better: link to `/privacy` etc. even
  though those pages don't exist yet. They will 404 until Task 12.
  Next.js doesn't have a way to mark pending routes; the 404 is fine
  for tonight.)

## Out of scope

- Any link target validation
- Real GSTIN value
- Logo SVG (text wordmark only — keeping the brief "industrial /
  honest" — avoids a gratuitous logo that adds nothing)

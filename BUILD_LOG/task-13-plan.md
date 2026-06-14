# Task 13 — Mobile pass — plan

## Spec
- Walk every page at 375px viewport
- Type scale: display 44 / display-2 32 / display-3 24
- Section padding 64px
- Multi-col → single col
- Header: hamburger overlay
- Quote breakdown → bottom drawer
- Reviewer per page, commit per page.

## Audit (already-implemented from earlier tasks)

| Concern | State | Notes |
|---|---|---|
| Type scale `display`→44, `display-2`→32, `display-3`→24 | ✅ | `app/globals.css` `@media (max-width: 640px)` block — also drops `lede` from 21px → 18px |
| Section padding 64px mobile | ✅ | `components/ui/Section.module.css` `@media (max-width: 768px)` |
| Container gutters 24px mobile | ✅ | `components/ui/Container.module.css` `@media (max-width: 768px)` |
| Header hamburger overlay | ✅ | Header.module.css + MobileMenu.tsx, breakpoint 900px |
| Hero (homepage) — col stack | ✅ | `Hero.module.css` 900px |
| Materials sections — col stack | ✅ | `MaterialSection.module.css` 900px |
| About — single col already | ✅ | 720px max + `.founderLayout` collapses 640px |
| Contact — col stack | ✅ | `contact.module.css` 900px |
| Quote — col stack | ✅ | `quote.module.css` 1100px |
| Orders — col stack | ✅ | `order.module.css` 900px |
| Legal pages — single col 720px | ✅ | wrapper handles it |
| Footer — 4 → 2 → 1 col | ✅ | 900px / 560px |

## Gap to close

**Quote breakdown bottom drawer.** Currently on mobile (≤1100px) the
breakdown stacks below the file list, which works but isn't the spec's
"bottom drawer". A pragmatic implementation:

- Keep the inline breakdown panel where it is (stacks below files) so
  the user can scroll to the full detail.
- Add a sticky bottom bar that pins to the viewport's bottom edge,
  always visible, showing: "Total ₹X · Continue →" — single tap to
  trigger checkout (the same handler the inline button uses).
- Show the bar only on mobile (≤900px) and only when there's a
  computed result (i.e. ≥1 parsed file).
- Don't add a slide-up drawer panel — that would need extra JS state
  and risks UX bugs on the iOS keyboard. The sticky-bottom-bar pattern
  is the same affordance with less surface area for bugs.

Target time: 30 min including a build pass.

## Other tweaks worth doing while I'm here

- The hero on /quote uses display class which @640px drops to 44 —
  good. But @640-900 it's still display 96. That can feel huge on
  iPad. Not in spec — skip.
- Orders code typography: `code` is sized 32px with a 24px mobile rule.
  Should probably also drop on small phones; already in CSS.
- Contact form input typography: 16px font-size — important to keep
  16px on iOS to prevent zoom-on-focus. Already 16px. ✓
- Materials page sections: `.specRow` 160px label column stays at
  140px on ≤900px — fine for 375px viewport.
- Footer.module.css already has 560px breakpoint for 1-col — fine.

## Build / commit

One commit covering:
- The quote bottom-bar
- Any missed mobile breakpoint tweaks

# Handoff: Casa Film Marketing Homepage

## Overview
Marketing homepage for Casa Film, a video delivery platform for UK wedding/commercial videographers. Goal: convert visiting videographers into free-trial signups. Positions against a competitor ("VidFlow") on customisation, pricing flexibility, and design quality.

## About the Design Files
The bundled file (`Casa Film Homepage.dc.html`) is a **design reference built in HTML** — a high-fidelity prototype of look, layout and copy, not production code to copy directly. Recreate this design in the target codebase's existing framework (React/Next.js per the original brief) using its own component patterns, routing and asset pipeline — do not embed the HTML file as-is.

## Fidelity
**High-fidelity.** Final colors, typography, spacing and copy are locked. Recreate pixel-accurately.

## Design Tokens

**Colors**
- Linen (page background): `#f5f0e8`
- Cream (panel background): `#f0e8d8`
- Dark (ink / dark sections): `#1a1410`
- Amber (primary accent): `#b5874a`
- Amber light (accent on dark bg): `#d4a865`
- Border/hairline: `#e2d7c1`
- Body copy grey: `#5a4f43` / `#4a4038`
- Muted text on dark: `#a8977c` / `#c9bda8`

**Typography**
- Headlines (H1/H2/H3, plan names, gallery mockup title): **Italiana** (serif display, no italic/bold variants used)
- Eyebrow labels, nav links, stat band, small caps text: **Archivo**, weight 600, uppercase, letter-spacing ~0.08–0.2em
- Buttons/CTAs ("Start Free Trial", "See How It Works"): **Albert Sans**, weight 600, uppercase, ~13px, letter-spacing 0.08em
- Body copy (paragraphs, descriptions, list items): **Albert Sans**, weight 400

Google Fonts import used in the prototype:
```
https://fonts.googleapis.com/css2?family=Italiana&family=Archivo:wght@500;600&family=Albert+Sans:wght@400;500;600;700&display=swap
```

**Spacing / shape**
- Section horizontal padding: `clamp(20px, 5vw, 64px)`, max content width `1360px`
- Card/section border radius: 2–6px (buttons 2px, cards 4–6px, avatar/icon circles 50%)
- Card borders: 1px solid `#e2d7c1`
- Grid cards use CSS Grid `repeat(auto-fit, minmax(Xpx, 1fr))` — no fixed breakpoints, fluid reflow

## Sections (top to bottom)

1. **Nav** — Logo left ("Casa" italic-style Italiana + thin amber rule + "FILM" in Archivo tracked caps), center-right links (Features/Pricing/Security anchor to section ids, "Log in"), dark pill "Start Free Trial" button.
2. **Hero** — Two-column (stacks on narrow widths): eyebrow label, H1 "A home for your finest work" (amber on "finest"), body paragraph, primary + secondary CTA buttons. Right column: a mocked browser-chrome card showing a branded client gallery (dark gallery UI, striped placeholder video thumbnail with "FILM PREVIEW — 4K" label, 4 thumbnail placeholders).
3. **Stats band** — 4-up row on cream background, hairline top/bottom border: "4K native support", "99.9% uptime", "AES-256 encryption", "Unlimited customisation".
4. **Features grid** — 6 cards in a hairline-divided grid (auto-fit, min 280px): Branded client galleries, 4K streaming, Timestamped feedback, One-click approvals, View analytics, Download controls. Each card has a small circular icon mark (simple CSS shapes — square/triangle/dot/check/bars/lock, no icon library), Italiana title, Albert Sans description.
5. **Gallery builder showcase** — Dark full-bleed section, 3-column grid: theme colour swatches (5 circles), font pairing sample stack, 3 layout-preview wireframes (grid/stack/full-bleed) with the active one amber-bordered.
6. **Pricing** — Monthly/Annual toggle switch (functional; annual applies a discount % and relabels billing). 3 plan cards (Starter £12, Professional £29 "Most Popular", Studio £69) — Professional is dark/elevated by default. Below: a 4-up pay-as-you-go storage bundle row (50GB £6, 200GB £18, 500GB £38, 1TB £65), no subscription needed.
7. **Security** — 2-column: left copy block, right a 5-item checklist (AES-256 encryption, geo-redundant storage, daily backups, original files preserved, GDPR compliant) with dark circular check-mark bullets.
8. **Testimonials** — 3 cards, cream background, italic pull-quote, initials avatar (striped placeholder circle), name + studio/city.
9. **Final CTA** — Full-bleed dark section, large centered Italiana statement "Your work deserves a home." (last word amber-light), single amber "Start Free Trial" button.
10. **Footer** — Dark background. Logo + one-line description, 3 link columns (Product / Company / Support), bottom row: copyright + text-only social links (Instagram/Twitter/LinkedIn — no icon glyphs).

## Interactions & Behavior
- **Billing toggle** (Pricing section): a switch control toggles `monthly` ⟷ `annual` state. Annual recalculates each plan's displayed monthly-equivalent price at a discount (default 20%, `Math.round(base * (1 - discount/100))`) and swaps the "billed monthly"/"billed annually" caption. Purely client-side UI state, no persistence needed.
- **Nav anchors** scroll to `#features`, `#pricing`, `#security` sections on the same page.
- No other dynamic behavior (no forms wired up — "Start Free Trial" / "Log in" are placeholder links `href="#"` in the prototype and need real destinations).
- Fully fluid/responsive: no fixed breakpoints — grids use `auto-fit`/`minmax()` and font sizes use `clamp()`. Recreate this as a fluid layout, not a fixed set of breakpoints.

## Content copy
All headline, body, plan, feature, testimonial and footer copy is final as written in the HTML file — carry it over verbatim unless product/legal asks for changes (plan pricing, feature lists, storage bundle prices, testimonial names/studios, security bullet copy).

## Assets
No image assets — all "imagery" (video thumbnails, avatars, layout previews) is a CSS placeholder (striped `repeating-linear-gradient` patterns) standing in for real product screenshots/photos to be dropped in later. The grain/noise overlay on the page is a small inline SVG `feTurbulence` filter at ~5% opacity, `mix-blend-mode: multiply`.

## Files
- `Casa Film Homepage.dc.html` — the full design reference (single file, inline styles, one small piece of JS state for the pricing toggle).

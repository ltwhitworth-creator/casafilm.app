'use client'
import { useState } from 'react'
import Link from 'next/link'

const ANNUAL_DISCOUNT_PERCENT = 20
const HIGHLIGHT_PLAN = 'Professional'

const STATS = [
  '4K native support',
  '99.9% uptime',
  'AES-256 encryption',
  'Unlimited customisation',
]

const FEATURES = [
  {
    icon: 'square',
    title: 'Branded client galleries',
    body: 'Full customisation of themes, fonts and colours so every delivery looks like your studio, not a template.',
  },
  {
    icon: 'play',
    title: '4K streaming',
    body: 'Instant playback at full resolution with no visible compression — the way you finished it.',
  },
  {
    icon: 'timeline',
    title: 'Timestamped feedback',
    body: 'Clients comment directly on the timeline, at the exact frame, instead of vague email notes.',
  },
  {
    icon: 'check',
    title: 'One-click approvals',
    body: 'Digital sign-off with a full revision history, so you always know what was agreed.',
  },
  {
    icon: 'bars',
    title: 'View analytics',
    body: 'Know when a client opened the gallery, how many times, and which chapters they rewatched.',
  },
  {
    icon: 'lock',
    title: 'Download controls',
    body: 'Protect your original files and decide exactly who can download what, and when.',
  },
]

const BASE_PLANS = [
  {
    name: 'Starter',
    price: 12,
    features: ['5 galleries', '100GB storage', 'Custom branding', 'Password protection'],
  },
  {
    name: 'Professional',
    price: 29,
    features: [
      'Unlimited galleries',
      '500GB storage',
      'Custom domain',
      'Watermarking',
      'Timestamped feedback',
      'View analytics',
    ],
  },
  {
    name: 'Studio',
    price: 69,
    features: [
      'Unlimited galleries',
      '2TB storage',
      'White-label',
      'Team members',
      'API access',
      'Priority support',
    ],
  },
]

const STORAGE_BUNDLES = [
  ['£6', '50GB'],
  ['£18', '200GB'],
  ['£38', '500GB'],
  ['£65', '1TB'],
]

const SECURITY_ITEMS = [
  ['AES-256 encryption', 'Every file is encrypted at rest and in transit.'],
  ['Geo-redundant storage', 'Your footage is mirrored across multiple UK and EU data centres.'],
  ['Daily backups', 'Automatic, versioned backups run every night without you lifting a finger.'],
  ['Original files preserved', 'We never re-compress or discard your source masters.'],
  ['GDPR compliant', 'Client data and footage are handled under strict UK/EU data protection standards.'],
]

const OWNERSHIP_BENEFITS = [
  'No long-term storage burden for videographers',
  'Couples get affordable lifetime access',
  'Automatic — no manual work required',
]

const TESTIMONIALS = [
  {
    quote:
      '"The gallery is the first thing clients say yes to before they even watch the film. It feels like our brand, not a plugin."',
    initials: 'EC',
    name: 'Elena Cross',
    studio: 'Cross & Co Films, Bristol',
  },
  {
    quote:
      '"Timestamped comments cut our revision emails to almost nothing. Clients just point at the frame."',
    initials: 'JW',
    name: 'Jamie Whitfield',
    studio: 'Whitfield Motion, Edinburgh',
  },
  {
    quote:
      '"Moved off VidFlow after one annual renewal too many. Casa Film feels built by people who actually shoot weddings."',
    initials: 'PM',
    name: 'Priya Malhotra',
    studio: 'Malhotra Studios, London',
  },
]

const FOOTER_COLUMNS = [
  {
    heading: 'Product',
    links: [
      ['Features', '#features'],
      ['Pricing', '#pricing'],
      ['Security', '#security'],
    ],
  },
  {
    heading: 'Company',
    links: [
      ['About', '#'],
      ['Journal', '#'],
      ['Contact', '#'],
    ],
  },
  {
    heading: 'Support',
    links: [
      ['Help Centre', '#'],
      ['Status', '#'],
      ['Terms & Privacy', '#'],
    ],
  },
]

function FeatureIcon({ kind }) {
  if (kind === 'square') return <span className="cf-mark-square" />
  if (kind === 'play') return <span className="cf-mark-play" />
  if (kind === 'timeline')
    return (
      <>
        <span className="cf-mark-line" />
        <span className="cf-mark-dot" />
      </>
    )
  if (kind === 'check') return <span className="cf-mark-check">✓</span>
  if (kind === 'bars')
    return (
      <span className="cf-mark-bars">
        <span />
        <span />
        <span />
      </span>
    )
  return (
    <span className="cf-mark-lock">
      <span />
    </span>
  )
}

export default function Home() {
  const [billing, setBilling] = useState('monthly')
  const isAnnual = billing === 'annual'

  const plans = BASE_PLANS.map((plan) => ({
    ...plan,
    displayPrice: isAnnual
      ? Math.round(plan.price * (1 - ANNUAL_DISCOUNT_PERCENT / 100))
      : plan.price,
    popular: plan.name === HIGHLIGHT_PLAN,
  }))

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Italiana&family=Archivo:wght@500;600&family=Albert+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        body { margin: 0; background: #f5f0e8; }

        .cf-home {
          --linen: #f5f0e8;
          --cream: #f0e8d8;
          --dark: #1a1410;
          --amber: #b5874a;
          --amberlight: #d4a865;
          --hairline: #e2d7c1;
          background: var(--linen);
          color: var(--dark);
          font-family: 'Albert Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }
        .cf-home *, .cf-home *::before, .cf-home *::after { box-sizing: border-box; }
        .cf-home a { text-decoration: none; }

        /* ── Grain overlay ── */
        .cf-grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 999;
          opacity: 0.05;
          mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>");
        }

        /* ── Shared primitives ── */
        .cf-wrap { max-width: 1360px; margin: 0 auto; }
        .cf-section { padding: clamp(70px, 8vw, 110px) clamp(20px, 5vw, 64px); }

        .cf-eyebrow {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--amber);
          margin-bottom: 16px;
        }
        .cf-h2 {
          font-family: 'Italiana', serif;
          font-weight: 500;
          font-size: clamp(30px, 4vw, 42px);
          margin: 0;
          line-height: 1.2;
        }
        .cf-btn {
          display: inline-block;
          padding: 16px 30px;
          border-radius: 2px;
          font-family: 'Albert Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: opacity 0.2s, background 0.2s, color 0.2s;
        }
        .cf-btn:hover { opacity: 0.85; }
        .cf-btn-dark { background: var(--dark); color: var(--linen); }
        .cf-btn-outline { border: 1px solid var(--dark); color: var(--dark); }
        .cf-btn-outline:hover { background: var(--dark); color: var(--linen); opacity: 1; }
        .cf-btn-amber { background: var(--amber); color: var(--dark); }

        /* ── Logo ── */
        .cf-logo { display: flex; align-items: center; gap: 14px; }
        .cf-logo-casa { font-family: 'Italiana', serif; font-size: 26px; }
        .cf-logo-rule { width: 28px; height: 1px; background: var(--amber); display: inline-block; }
        .cf-logo-film {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.25em;
          color: var(--amber);
        }

        /* ── Nav ── */
        .cf-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          padding: 28px clamp(20px, 5vw, 64px);
          max-width: 1360px;
          margin: 0 auto;
        }
        .cf-nav-links {
          display: flex;
          align-items: center;
          gap: clamp(20px, 3vw, 40px);
          flex-wrap: wrap;
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .cf-nav-links a { color: var(--dark); transition: color 0.2s; }
        .cf-nav-links a:hover { color: var(--amber); }
        .cf-nav-cta {
          background: var(--dark);
          padding: 12px 22px;
          border-radius: 2px;
          font-family: 'Albert Sans', sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: opacity 0.2s;
        }
        .cf-nav-links a.cf-nav-cta,
        .cf-nav-links a.cf-nav-cta:hover {
          color: var(--linen);
        }
        .cf-nav-links a.cf-nav-cta:hover { opacity: 0.85; }

        /* ── Hero ── */
        .cf-hero {
          max-width: 1360px;
          margin: 0 auto;
          padding: clamp(40px, 8vw, 90px) clamp(20px, 5vw, 64px) clamp(60px, 8vw, 110px);
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          gap: clamp(32px, 5vw, 60px);
          align-items: center;
        }
        .cf-hero-eyebrow {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--amber);
          margin-bottom: 22px;
        }
        .cf-hero h1 {
          font-family: 'Italiana', serif;
          font-weight: 500;
          font-size: clamp(40px, 6vw, 68px);
          line-height: 1.08;
          margin: 0 0 26px;
        }
        .cf-hero h1 span { color: var(--amber); }
        .cf-hero p {
          font-size: clamp(17px, 2vw, 19px);
          line-height: 1.7;
          color: #4a4038;
          max-width: 480px;
          margin: 0 0 38px;
        }
        .cf-hero-ctas { display: flex; gap: 16px; flex-wrap: wrap; }

        /* ── Hero gallery mockup ── */
        .cf-mock {
          background: var(--cream);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 30px 60px -20px rgba(26, 20, 16, 0.25);
        }
        .cf-mock-chrome { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .cf-mock-dot { width: 8px; height: 8px; border-radius: 50%; background: #d9c9a8; }
        .cf-mock-url {
          flex: 1;
          text-align: center;
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #8a7c66;
        }
        .cf-mock-screen { background: var(--dark); border-radius: 4px; padding: 28px 22px 22px; }
        .cf-mock-title {
          font-family: 'Italiana', serif;
          color: var(--amberlight);
          font-size: 22px;
          margin-bottom: 4px;
        }
        .cf-mock-meta {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #a8977c;
          margin-bottom: 20px;
        }
        .cf-mock-player {
          aspect-ratio: 16 / 9;
          border-radius: 3px;
          background: repeating-linear-gradient(115deg, #2a221a, #2a221a 14px, #33291f 14px, #33291f 28px);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .cf-mock-play {
          width: 0;
          height: 0;
          border-top: 14px solid transparent;
          border-bottom: 14px solid transparent;
          border-left: 22px solid var(--linen);
          opacity: 0.85;
        }
        .cf-mock-label {
          position: absolute;
          bottom: 10px;
          left: 12px;
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #c9b896;
          text-transform: uppercase;
        }
        .cf-mock-thumbs { display: flex; gap: 8px; margin-top: 14px; }
        .cf-mock-thumb {
          flex: 1;
          aspect-ratio: 1;
          border-radius: 2px;
          background: repeating-linear-gradient(45deg, #2a221a, #2a221a 6px, #332a20 6px, #332a20 12px);
        }
        .cf-mock-more {
          flex: 1;
          aspect-ratio: 1;
          border-radius: 2px;
          border: 1px dashed #5a4a35;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 10px;
          color: #8a7c66;
        }

        /* ── Stats band ── */
        .cf-stats {
          border-top: 1px solid var(--hairline);
          border-bottom: 1px solid var(--hairline);
          background: var(--cream);
        }
        .cf-stats-inner {
          max-width: 1360px;
          margin: 0 auto;
          padding: 34px clamp(20px, 5vw, 64px);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          text-align: center;
        }
        .cf-stat {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--dark);
        }

        /* ── Features ── */
        .cf-section-head { max-width: 620px; margin: 0 auto 56px; text-align: center; }
        .cf-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--hairline);
          border: 1px solid var(--hairline);
        }
        .cf-feature { background: var(--linen); padding: 36px 30px; }
        .cf-feature h3 {
          font-family: 'Italiana', serif;
          font-weight: 500;
          font-size: 21px;
          margin: 0 0 10px;
        }
        .cf-feature p { font-size: 15px; line-height: 1.65; color: #5a4f43; margin: 0; }
        .cf-feature-mark {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1px solid var(--amber);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
          position: relative;
        }
        .cf-mark-square { width: 14px; height: 14px; border-radius: 3px; border: 1px solid var(--amber); }
        .cf-mark-play {
          width: 0;
          height: 0;
          border-top: 7px solid transparent;
          border-bottom: 7px solid transparent;
          border-left: 11px solid var(--amber);
        }
        .cf-mark-line { width: 20px; height: 2px; background: var(--amber); }
        .cf-mark-dot {
          position: absolute;
          left: 29px;
          top: 15px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--amber);
        }
        .cf-mark-check { font-size: 15px; color: var(--amber); }
        .cf-mark-bars { display: flex; align-items: flex-end; gap: 3px; height: 16px; }
        .cf-mark-bars span { width: 4px; background: var(--amber); }
        .cf-mark-bars span:nth-child(1) { height: 6px; }
        .cf-mark-bars span:nth-child(2) { height: 11px; }
        .cf-mark-bars span:nth-child(3) { height: 16px; }
        .cf-mark-lock {
          width: 16px;
          height: 12px;
          border: 2px solid var(--amber);
          border-radius: 2px;
          position: relative;
          display: inline-block;
        }
        .cf-mark-lock span {
          position: absolute;
          top: -9px;
          left: 1px;
          width: 8px;
          height: 8px;
          border: 2px solid var(--amber);
          border-bottom: none;
          border-radius: 8px 8px 0 0;
        }

        /* ── Gallery builder showcase ── */
        .cf-builder {
          background: var(--dark);
          color: var(--linen);
          padding: clamp(70px, 8vw, 110px) clamp(20px, 5vw, 64px);
        }
        .cf-builder-head { max-width: 640px; margin: 0 auto 60px; text-align: center; }
        .cf-builder-head .cf-eyebrow { color: var(--amberlight); }
        .cf-builder-head h2 { margin-bottom: 18px; }
        .cf-builder-head p { font-size: 16px; line-height: 1.7; color: #c9bda8; margin: 0; }
        .cf-builder-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 40px;
        }
        .cf-builder-label {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #a8977c;
          margin-bottom: 18px;
        }
        .cf-swatches { display: flex; gap: 10px; flex-wrap: wrap; }
        .cf-swatch { width: 34px; height: 34px; border-radius: 50%; border: 2px solid #5a4a35; }
        .cf-swatch-active { border-color: var(--linen); }
        .cf-typestack { display: flex; flex-direction: column; gap: 10px; }
        .cf-type-serif { font-family: 'Italiana', serif; font-size: 20px; }
        .cf-type-mono {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.05em;
        }
        .cf-type-sans { font-family: 'Albert Sans', sans-serif; font-size: 16px; }
        .cf-layouts { display: flex; gap: 10px; }
        .cf-layout {
          flex: 1;
          height: 64px;
          border: 1px solid #5a4a35;
          border-radius: 3px;
          padding: 6px;
        }
        .cf-layout span { background: #3a3025; border-radius: 2px; }
        .cf-layout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
        .cf-layout-stack { display: flex; flex-direction: column; gap: 3px; }
        .cf-layout-stack span { flex: 1; }
        .cf-layout-full { border-color: var(--amber); }
        .cf-layout-full span { display: block; height: 100%; }

        /* ── Ownership transfer ── */
        .cf-ownership {
          background: var(--cream);
          border-top: 1px solid var(--hairline);
          border-bottom: 1px solid var(--hairline);
          padding: clamp(70px, 8vw, 110px) clamp(20px, 5vw, 64px);
        }
        .cf-ownership-head h2 span { color: var(--amber); }
        .cf-ownership-copy {
          max-width: 680px;
          margin: 0 auto 48px;
          text-align: center;
          font-size: 16px;
          line-height: 1.7;
          color: #4a4038;
        }
        .cf-ownership-benefits {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .cf-ownership-benefit {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: var(--linen);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 22px 20px;
        }
        .cf-ownership-benefit p {
          font-size: 14px;
          line-height: 1.5;
          color: #4a4038;
          margin: 0;
        }

        /* ── Pricing ── */
        .cf-pricing-head { max-width: 620px; margin: 0 auto 20px; text-align: center; }
        .cf-pricing-head h2 { margin-bottom: 14px; }
        .cf-toggle-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 50px;
          flex-wrap: wrap;
        }
        .cf-toggle-label {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8a7c66;
          transition: color 0.2s;
        }
        .cf-toggle-label-on { color: var(--dark); }
        .cf-toggle {
          width: 46px;
          height: 24px;
          border-radius: 20px;
          background: var(--dark);
          border: none;
          position: relative;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
        }
        .cf-toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--amberlight);
          transition: left 0.2s;
        }
        .cf-toggle-knob-on { left: 25px; }

        .cf-plan-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          align-items: start;
        }
        .cf-plan {
          background: var(--cream);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 36px 30px;
          position: relative;
        }
        .cf-plan-popular {
          background: var(--dark);
          border-color: var(--dark);
          transform: scale(1.03);
          box-shadow: 0 30px 50px -20px rgba(26, 20, 16, 0.4);
        }
        .cf-plan-badge {
          position: absolute;
          top: -13px;
          left: 30px;
          background: var(--amber);
          color: var(--linen);
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 20px;
        }
        .cf-plan h3 {
          font-family: 'Italiana', serif;
          font-weight: 500;
          font-size: 22px;
          margin: 12px 0 4px;
        }
        .cf-plan-price { display: flex; align-items: baseline; gap: 6px; margin: 18px 0 4px; }
        .cf-plan-price-amount { font-family: 'Italiana', serif; font-size: 40px; }
        .cf-plan-price-per { font-family: 'Archivo', sans-serif; font-weight: 600; font-size: 12px; color: #6a5f50; }
        .cf-plan-billed {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 11px;
          color: #6a5f50;
          margin-bottom: 20px;
        }
        .cf-plan ul {
          list-style: none;
          padding: 0;
          margin: 0 0 26px;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .cf-plan li { font-size: 14px; display: flex; gap: 10px; }
        .cf-plan li span { color: var(--amber); }
        .cf-plan-cta {
          display: block;
          text-align: center;
          background: transparent;
          color: var(--dark);
          border: 1px solid var(--dark);
          padding: 14px;
          border-radius: 2px;
          font-family: 'Albert Sans', sans-serif;
          font-weight: 600;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: opacity 0.2s, background 0.2s, color 0.2s;
        }
        .cf-plan-cta:hover { background: var(--dark); color: var(--linen); }
        .cf-plan-popular h3, .cf-plan-popular .cf-plan-price-amount, .cf-plan-popular li { color: var(--linen); }
        .cf-plan-popular .cf-plan-price-per, .cf-plan-popular .cf-plan-billed { color: #a8977c; }
        .cf-plan-popular .cf-plan-cta {
          background: var(--amber);
          border-color: var(--amber);
          color: var(--dark);
        }
        .cf-plan-popular .cf-plan-cta:hover { opacity: 0.85; background: var(--amber); color: var(--dark); }

        .cf-storage {
          margin-top: 64px;
          background: var(--cream);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 36px;
        }
        .cf-storage-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 26px;
        }
        .cf-storage-head h3 { font-family: 'Italiana', serif; font-weight: 500; font-size: 22px; margin: 0; }
        .cf-storage-head p {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 12px;
          color: #6a5f50;
          margin: 0;
        }
        .cf-storage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
        }
        .cf-storage-card {
          background: var(--linen);
          border: 1px solid var(--hairline);
          border-radius: 4px;
          padding: 20px;
          text-align: center;
        }
        .cf-storage-price { font-family: 'Italiana', serif; font-size: 24px; margin-bottom: 4px; }
        .cf-storage-size {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6a5f50;
        }

        /* ── Security ── */
        .cf-security {
          background: var(--cream);
          border-top: 1px solid var(--hairline);
          border-bottom: 1px solid var(--hairline);
          padding: clamp(70px, 8vw, 110px) clamp(20px, 5vw, 64px);
        }
        .cf-security-inner {
          max-width: 1360px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: clamp(30px, 5vw, 60px);
          align-items: center;
        }
        .cf-security h2 {
          font-family: 'Italiana', serif;
          font-weight: 500;
          font-size: clamp(28px, 4vw, 38px);
          margin: 0 0 18px;
          line-height: 1.2;
        }
        .cf-security-copy { font-size: 16px; line-height: 1.7; color: #5a4f43; margin: 0; max-width: 440px; }
        .cf-checklist { display: flex; flex-direction: column; gap: 18px; }
        .cf-check-item { display: flex; gap: 16px; align-items: flex-start; }
        .cf-check-bullet {
          width: 26px;
          height: 26px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--dark);
          color: var(--amberlight);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }
        .cf-check-title {
          font-family: 'Albert Sans', sans-serif;
          font-weight: 500;
          font-size: 16px;
          margin-bottom: 3px;
        }
        .cf-check-body { font-size: 14px; color: #6a5f50; }

        /* ── Testimonials ── */
        .cf-testimonial-head { max-width: 560px; margin: 0 auto 56px; text-align: center; }
        .cf-testimonial-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .cf-testimonial {
          background: var(--cream);
          border: 1px solid var(--hairline);
          border-radius: 6px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .cf-testimonial p { font-family: 'Italiana', serif; font-size: 18px; line-height: 1.55; margin: 0; }
        .cf-testimonial-by { display: flex; align-items: center; gap: 12px; }
        .cf-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: repeating-linear-gradient(45deg, #d9c9a8, #d9c9a8 5px, #e8ded0 5px, #e8ded0 10px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 12px;
          color: var(--dark);
          flex-shrink: 0;
        }
        .cf-testimonial-name { font-size: 14px; font-weight: 500; }
        .cf-testimonial-studio {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 11px;
          color: #8a7c66;
        }

        /* ── Final CTA ── */
        .cf-final {
          background: var(--dark);
          color: var(--linen);
          padding: clamp(90px, 10vw, 140px) clamp(20px, 5vw, 64px);
          text-align: center;
        }
        .cf-final h2 {
          font-family: 'Italiana', serif;
          font-weight: 500;
          font-size: clamp(36px, 6vw, 58px);
          margin: 0 0 30px;
          line-height: 1.15;
        }
        .cf-final h2 span { color: var(--amberlight); }
        .cf-final a { padding: 18px 36px; }

        /* ── Footer ── */
        .cf-footer {
          background: var(--dark);
          color: #c9bda8;
          padding: 60px clamp(20px, 5vw, 64px) 30px;
        }
        .cf-footer-top {
          max-width: 1360px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(200px, 1.4fr) repeat(3, minmax(140px, 1fr));
          gap: 32px;
          padding-bottom: 44px;
          border-bottom: 1px solid #3a3025;
        }
        .cf-footer-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .cf-footer-logo .cf-logo-casa { font-size: 22px; color: var(--linen); }
        .cf-footer-logo .cf-logo-rule { width: 24px; }
        .cf-footer-logo .cf-logo-film { font-size: 11px; color: var(--amberlight); }
        .cf-footer-blurb { font-size: 13px; line-height: 1.6; max-width: 260px; margin: 0; }
        .cf-footer-heading {
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--amberlight);
          margin-bottom: 16px;
        }
        .cf-footer-links { display: flex; flex-direction: column; gap: 10px; font-size: 13px; }
        .cf-footer-links a, .cf-footer-bottom a { color: #c9bda8; transition: color 0.2s; }
        .cf-footer-links a:hover, .cf-footer-bottom a:hover { color: var(--amberlight); }
        .cf-footer-bottom {
          max-width: 1360px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 24px;
          font-family: 'Archivo', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.06em;
        }
        .cf-footer-social { display: flex; gap: 20px; }

        /* ── Narrow widths: stack the fixed two-column layouts ── */
        @media (max-width: 860px) {
          .cf-hero, .cf-security-inner { grid-template-columns: minmax(0, 1fr); }
          .cf-footer-top { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
          .cf-feature-grid { grid-template-columns: repeat(2, 1fr); }
          .cf-ownership-benefits { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .cf-plan-popular { transform: none; }
          .cf-storage { padding: 28px 20px; }
          .cf-feature-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cf-home">
        <div className="cf-grain" />

        {/* ── Nav ── */}
        <nav className="cf-nav">
          <div className="cf-logo">
            <span className="cf-logo-casa">Casa</span>
            <span className="cf-logo-rule" />
            <span className="cf-logo-film">FILM</span>
          </div>
          <div className="cf-nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#security">Security</a>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="cf-nav-cta">Start Free Trial</Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="cf-hero">
          <div>
            <div className="cf-hero-eyebrow">For wedding &amp; commercial filmmakers</div>
            <h1>
              A home for your <span>finest</span> work
            </h1>
            <p>
              Casa Film turns your finished films into beautiful, password-protected client
              galleries — branded entirely to your studio, not ours. No credits, no clunky
              contracts, no compromise on craft.
            </p>
            <div className="cf-hero-ctas">
              <Link href="/signup" className="cf-btn cf-btn-dark">Start Free Trial</Link>
              <a href="#features" className="cf-btn cf-btn-outline">See How It Works</a>
            </div>
          </div>

          <div className="cf-mock">
            <div className="cf-mock-chrome">
              <span className="cf-mock-dot" />
              <span className="cf-mock-dot" />
              <span className="cf-mock-dot" />
              <span className="cf-mock-url">gallery.casafilm.co/the-hartleys</span>
            </div>
            <div className="cf-mock-screen">
              <div className="cf-mock-title">The Hartleys</div>
              <div className="cf-mock-meta">Wedding Film — 12.09.26</div>
              <div className="cf-mock-player">
                <div className="cf-mock-play" />
                <span className="cf-mock-label">film preview — 4K</span>
              </div>
              <div className="cf-mock-thumbs">
                <div className="cf-mock-thumb" />
                <div className="cf-mock-thumb" />
                <div className="cf-mock-thumb" />
                <div className="cf-mock-more">+8</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats band ── */}
        <section className="cf-stats">
          <div className="cf-stats-inner">
            {STATS.map((stat) => (
              <div key={stat}>
                <div className="cf-stat">{stat}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="cf-wrap cf-section">
          <div className="cf-section-head">
            <div className="cf-eyebrow">Built for the craft</div>
            <h2 className="cf-h2">Everything a delivery should feel like</h2>
          </div>
          <div className="cf-feature-grid">
            {FEATURES.map((feature) => (
              <div className="cf-feature" key={feature.title}>
                <div className="cf-feature-mark">
                  <FeatureIcon kind={feature.icon} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Gallery builder showcase ── */}
        <section className="cf-builder">
          <div className="cf-wrap">
            <div className="cf-builder-head">
              <div className="cf-eyebrow">Make it unmistakably yours</div>
              <h2 className="cf-h2">While VidFlow gives you a template, we give you a studio</h2>
              <p>
                Every colour, font and layout in your gallery can be tuned to match your brand — not
                ours.
              </p>
            </div>
            <div className="cf-builder-grid">
              <div>
                <div className="cf-builder-label">Theme palette</div>
                <div className="cf-swatches">
                  <span className="cf-swatch cf-swatch-active" style={{ background: '#b5874a' }} />
                  <span className="cf-swatch" style={{ background: '#1a1410' }} />
                  <span className="cf-swatch" style={{ background: '#e8ded0' }} />
                  <span className="cf-swatch" style={{ background: '#5c6b57' }} />
                  <span className="cf-swatch" style={{ background: '#7a3b30' }} />
                </div>
              </div>
              <div>
                <div className="cf-builder-label">Type pairing</div>
                <div className="cf-typestack">
                  <span className="cf-type-serif">Editorial Serif</span>
                  <span className="cf-type-mono">Mono Studio</span>
                  <span className="cf-type-sans">Modern Sans</span>
                </div>
              </div>
              <div>
                <div className="cf-builder-label">Layout</div>
                <div className="cf-layouts">
                  <div className="cf-layout cf-layout-grid">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="cf-layout cf-layout-stack">
                    <span />
                    <span />
                  </div>
                  <div className="cf-layout cf-layout-full">
                    <span />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Ownership transfer ── */}
        <section className="cf-ownership">
          <div className="cf-ownership-head cf-section-head">
            <div className="cf-eyebrow">A Unique Approach</div>
            <h2 className="cf-h2">
              Your clients keep their memories <span>forever</span>
            </h2>
          </div>
          <p className="cf-ownership-copy">
            After 12 months, couples can take ownership of their gallery for a one-time £19.99 fee
            covering 10 years of continued access — or download their film to keep themselves. This
            automatically frees up storage in the videographer&apos;s account, so galleries never pile
            up and videographers never have to worry about long-term storage costs.
          </p>
          <div className="cf-ownership-benefits">
            {OWNERSHIP_BENEFITS.map((benefit) => (
              <div className="cf-ownership-benefit" key={benefit}>
                <span className="cf-check-bullet">✓</span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="cf-wrap cf-section">
          <div className="cf-pricing-head">
            <div className="cf-eyebrow">Simple, honest pricing</div>
            <h2 className="cf-h2">No credits. No annual lock-in.</h2>
          </div>

          <div className="cf-toggle-row">
            <span className={`cf-toggle-label${isAnnual ? '' : ' cf-toggle-label-on'}`}>Monthly</span>
            <button
              type="button"
              className="cf-toggle"
              aria-label="Toggle annual billing"
              aria-pressed={isAnnual}
              onClick={() => setBilling(isAnnual ? 'monthly' : 'annual')}
            >
              <span className={`cf-toggle-knob${isAnnual ? ' cf-toggle-knob-on' : ''}`} />
            </button>
            <span className={`cf-toggle-label${isAnnual ? ' cf-toggle-label-on' : ''}`}>
              Annual (save {ANNUAL_DISCOUNT_PERCENT}%)
            </span>
          </div>

          <div className="cf-plan-grid">
            {plans.map((plan) => (
              <div
                className={`cf-plan${plan.popular ? ' cf-plan-popular' : ''}`}
                key={plan.name}
              >
                {plan.popular && <span className="cf-plan-badge">Most Popular</span>}
                <h3>{plan.name}</h3>
                <div className="cf-plan-price">
                  <span className="cf-plan-price-amount">£{plan.displayPrice}</span>
                  <span className="cf-plan-price-per">/mo</span>
                </div>
                <div className="cf-plan-billed">{isAnnual ? 'billed annually' : 'billed monthly'}</div>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <span>—</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="cf-plan-cta">Start Free Trial</Link>
              </div>
            ))}
          </div>

          <div className="cf-storage">
            <div className="cf-storage-head">
              <h3>Pay-as-you-go storage</h3>
              <p>No subscription needed — buy exactly what you need</p>
            </div>
            <div className="cf-storage-grid">
              {STORAGE_BUNDLES.map(([price, size]) => (
                <div className="cf-storage-card" key={size}>
                  <div className="cf-storage-price">{price}</div>
                  <div className="cf-storage-size">{size}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Security ── */}
        <section id="security" className="cf-security">
          <div className="cf-security-inner">
            <div>
              <div className="cf-eyebrow">Peace of mind</div>
              <h2>Your clients&apos; most precious footage, kept safe</h2>
              <p className="cf-security-copy">
                Every film you deliver is treated with the same care you gave it on the day. We built
                Casa Film&apos;s storage layer for irreplaceable memories, not disposable content.
              </p>
            </div>
            <div className="cf-checklist">
              {SECURITY_ITEMS.map(([title, body]) => (
                <div className="cf-check-item" key={title}>
                  <span className="cf-check-bullet">✓</span>
                  <div>
                    <div className="cf-check-title">{title}</div>
                    <div className="cf-check-body">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="cf-wrap cf-section">
          <div className="cf-testimonial-head">
            <div className="cf-eyebrow">From the field</div>
            <h2 className="cf-h2">Filmmakers who moved their delivery home</h2>
          </div>
          <div className="cf-testimonial-grid">
            {TESTIMONIALS.map((testimonial) => (
              <div className="cf-testimonial" key={testimonial.name}>
                <p>{testimonial.quote}</p>
                <div className="cf-testimonial-by">
                  <span className="cf-avatar">{testimonial.initials}</span>
                  <div>
                    <div className="cf-testimonial-name">{testimonial.name}</div>
                    <div className="cf-testimonial-studio">{testimonial.studio}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="cf-final">
          <h2>
            Your work deserves <span>a home.</span>
          </h2>
          <Link href="/signup" className="cf-btn cf-btn-amber">Start Free Trial</Link>
        </section>

        {/* ── Footer ── */}
        <footer className="cf-footer">
          <div className="cf-footer-top">
            <div>
              <div className="cf-logo cf-footer-logo">
                <span className="cf-logo-casa">Casa</span>
                <span className="cf-logo-rule" />
                <span className="cf-logo-film">FILM</span>
              </div>
              <p className="cf-footer-blurb">
                Premium video delivery for wedding and commercial filmmakers across the UK.
              </p>
            </div>
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading}>
                <div className="cf-footer-heading">{column.heading}</div>
                <div className="cf-footer-links">
                  {column.links.map(([label, href]) => (
                    <a href={href} key={label}>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="cf-footer-bottom">
            <span>© 2026 Casa Film. All rights reserved.</span>
            <div className="cf-footer-social">
              <a href="#">Instagram</a>
              <a href="#">Twitter</a>
              <a href="#">LinkedIn</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

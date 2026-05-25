'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const FEATURES = [
  ['Beautiful client delivery galleries', 'Present your films the way they deserve to be seen.'],
  ['Password-protected access', 'Your clients get a private, intimate screening experience.'],
  ['One-click client approval', 'Streamline your workflow from delivery to sign-off.'],
]

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    if (!email || !password) return
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      setSuccess(true)
      setMessage('Check your inbox to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Mono:wght@400;500&family=Jost:wght@300;400&display=swap" rel="stylesheet" />

      <style>{`
        .cf-layout {
          display: flex;
          min-height: 100vh;
        }

        /* ── Left dark panel ── */
        .cf-left {
          flex: 1;
          background: #1a1410;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px 56px;
          position: relative;
          overflow: hidden;
        }
        .cf-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23grain)' opacity='0.18'/%3E%3C/svg%3E");
          background-size: 220px 220px;
          opacity: 0.5;
          pointer-events: none;
        }

        /* ── Right form panel ── */
        .cf-right {
          flex: 1;
          background: #f5f0e8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px 56px;
        }

        /* ── Form inputs ── */
        .cf-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid #c8bfb0;
          padding: 12px 0;
          font-family: 'Jost', sans-serif;
          font-size: 16px;
          color: #1a1410;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .cf-input::placeholder {
          color: #b8ae9e;
          font-weight: 300;
        }
        .cf-input:focus {
          border-bottom-color: #b5874a;
        }

        /* ── Submit button ── */
        .cf-btn {
          width: 100%;
          padding: 18px;
          background: #1a1410;
          color: #f0e8d8;
          border: none;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          transition: background 0.2s;
          box-sizing: border-box;
        }
        .cf-btn:hover:not(:disabled) {
          background: #2e261d;
        }
        .cf-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .cf-layout {
            flex-direction: column;
          }
          .cf-left {
            flex: none;
            min-height: 340px;
            padding: 48px 32px;
            align-items: flex-start;
          }
          .cf-right {
            flex: none;
            align-items: flex-start;
            padding: 48px 32px;
          }
        }
      `}</style>

      <div className="cf-layout">

        {/* ── Left panel ── */}
        <div className="cf-left">
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '360px' }}>

            {/* Logo */}
            <div style={{ marginBottom: '56px' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '76px', color: '#f0e8d8', lineHeight: 1, marginBottom: '10px', letterSpacing: '-0.01em' }}>
                Casa
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: '#b5874a' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.55em', textTransform: 'uppercase', color: '#b5874a', paddingRight: '2px' }}>Film</span>
              </div>
            </div>

            {/* Tagline */}
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '23px', color: '#c4b49a', lineHeight: 1.55, marginBottom: '52px' }}>
              A home for your finest work.
            </p>

            {/* Feature bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {FEATURES.map(([title, desc]) => (
                <div key={title} style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#b5874a', marginTop: '7px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#f0e8d8', marginBottom: '5px' }}>
                      {title}
                    </div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#6e6358', fontWeight: 300, lineHeight: 1.6 }}>
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="cf-right">
          <div style={{ width: '100%', maxWidth: '380px' }}>

            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#b5874a', marginBottom: '14px' }}>
              Get started
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '38px', fontWeight: 400, color: '#1a1410', lineHeight: 1.2, marginBottom: '10px' }}>
              Create your account
            </h1>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '15px', color: '#7a6e62', fontWeight: 300, marginBottom: '48px' }}>
              Start delivering films your clients will love.
            </p>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9a8e82', marginBottom: '10px' }}>
                Email address
              </label>
              <input
                className="cf-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignUp()}
              />
            </div>

            <div style={{ marginBottom: '44px' }}>
              <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9a8e82', marginBottom: '10px' }}>
                Password
              </label>
              <input
                className="cf-input"
                type="password"
                placeholder="Choose a secure password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignUp()}
              />
            </div>

            {message && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: success ? '#b5874a' : '#c0392b', lineHeight: 1.5, marginBottom: '24px' }}>
                {message}
              </p>
            )}

            <button className="cf-btn" onClick={handleSignUp} disabled={loading || success}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.12em', color: '#b0a898', textAlign: 'center', marginTop: '14px' }}>
              No credit card required
            </p>

            <div style={{ marginTop: '52px', paddingTop: '32px', borderTop: '1px solid #ddd5c8', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '14px', color: '#9a8e82', fontWeight: 300 }}>
                Already have an account?{' '}
                <a href="/login" style={{ color: '#b5874a', textDecoration: 'none', fontWeight: 400 }}>
                  Sign in
                </a>
              </p>
            </div>

          </div>
        </div>

      </div>
    </>
  )
}

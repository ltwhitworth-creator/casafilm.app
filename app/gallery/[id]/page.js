'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const FONTS = (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Mono:wght@400;500&family=Jost:wght@300;400&display=swap" rel="stylesheet" />
  </>
)

export default function GalleryPage(props) {
  const [gallery, setGallery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [id, setId] = useState(null)

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await props.params
      setId(resolvedParams.id)
    }
    getParams()
  }, [])

  useEffect(() => {
    if (!id) return
    async function getGallery() {
      const { data } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', id)
        .single()
      setGallery(data)
      if (!data?.password) setUnlocked(true)
      setLoading(false)
    }
    getGallery()
  }, [id])

  function handleUnlock() {
    if (password === gallery.password) {
      setUnlocked(true)
      setError('')
    } else {
      setError('Incorrect password — please try again')
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        {FONTS}
        <div style={{ minHeight: '100vh', background: '#1a1410', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '44px', color: '#f0e8d8', lineHeight: 1, marginBottom: '10px' }}>
              Casa
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
              <div style={{ width: '32px', height: '1px', background: '#b5874a' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.5em', color: '#b5874a', textTransform: 'uppercase' }}>Film</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!gallery) {
    return (
      <>
        {FONTS}
        <div style={{ minHeight: '100vh', background: '#1a1410', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.2em', color: '#444', textTransform: 'uppercase' }}>
            Gallery not found
          </p>
        </div>
      </>
    )
  }

  // ── Locked — password screen ─────────────────────────────────────────────
  if (!unlocked) {
    return (
      <>
        {FONTS}
        <style>{`
          .gp-screen {
            position: relative;
            min-height: 100vh;
            background: #1a1410;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px 32px;
            overflow: hidden;
          }

          /* Grain texture */
          .gp-screen::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23grain)' opacity='0.2'/%3E%3C/svg%3E");
            background-size: 220px 220px;
            opacity: 0.55;
            pointer-events: none;
          }

          /* Password input */
          .gp-input {
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 1px solid rgba(240,232,216,0.18);
            padding: 16px 0;
            font-family: 'Jost', sans-serif;
            font-size: 17px;
            color: #f0e8d8;
            text-align: center;
            letter-spacing: 0.18em;
            outline: none;
            transition: border-color 0.25s;
            box-sizing: border-box;
          }
          .gp-input::placeholder {
            color: rgba(240,232,216,0.2);
            font-weight: 300;
            letter-spacing: 0.1em;
          }
          .gp-input:focus {
            border-bottom-color: #b5874a;
          }

          /* View My Film button */
          .gp-btn {
            width: 100%;
            padding: 20px;
            background: #b5874a;
            color: #1a1410;
            border: none;
            cursor: pointer;
            font-family: 'DM Mono', monospace;
            font-size: 11px;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            font-weight: 500;
            transition: background 0.2s;
            box-sizing: border-box;
          }
          .gp-btn:hover { background: #d4a865; }
          .gp-btn:active { background: #a07840; }

          @media (max-width: 480px) {
            .gp-screen { padding: 48px 24px; }
            .gp-name { font-size: 38px !important; }
          }
        `}</style>

        <div className="gp-screen">

          {/* Ambient amber glow — sits behind all content */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -55%)',
            width: '800px',
            height: '700px',
            background: 'radial-gradient(ellipse at center, rgba(181,135,74,0.11) 0%, rgba(181,135,74,0.04) 40%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px', textAlign: 'center' }}>

            {/* Logo */}
            <div style={{ marginBottom: '72px' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '52px', color: '#f0e8d8', lineHeight: 1, marginBottom: '10px' }}>
                Casa
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: '#b5874a' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.55em', textTransform: 'uppercase', color: '#b5874a', paddingRight: '2px' }}>
                  Film
                </span>
              </div>
            </div>

            {/* Gallery name — the hero moment */}
            <h1
              className="gp-name"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: 'italic',
                fontSize: '52px',
                fontWeight: 400,
                color: '#f0e8d8',
                lineHeight: 1.15,
                marginBottom: '16px',
                letterSpacing: '-0.01em',
              }}
            >
              {gallery.name}
            </h1>

            {/* Tagline */}
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#b5874a',
              marginBottom: '0',
            }}>
              A film for {gallery.client_name}
            </p>

            {/* Separator */}
            <div style={{
              width: '100%',
              height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(181,135,74,0.4), transparent)',
              margin: '44px 0',
            }} />

            {/* Password field */}
            <input
              className="gp-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              autoFocus
            />

            {/* Error */}
            {error && (
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: '#c0523a',
                marginTop: '16px',
                marginBottom: '0',
              }}>
                {error}
              </p>
            )}

            {/* CTA */}
            <button
              className="gp-btn"
              onClick={handleUnlock}
              style={{ marginTop: error ? '20px' : '28px' }}
            >
              View My Film
            </button>

          </div>
        </div>
      </>
    )
  }

  // ── Unlocked — gallery view (unchanged) ──────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#1a1410', padding: '60px 40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '60px' }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '28px', color: '#f0e8d8', lineHeight: '0.9', marginBottom: '6px' }}>Casa</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '80px' }}>
              <div style={{ flex: 1, height: '1px', background: '#b5874a' }}></div>
              <div style={{ fontFamily: 'monospace', fontSize: '7px', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#b5874a' }}>Film</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '400', color: '#f0e8d8', marginBottom: '4px' }}>
              {gallery.name}
            </h1>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#666', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              A film for {gallery.client_name}
            </p>
          </div>
        </div>

        {gallery.video_uid ? (
          <div style={{ marginBottom: '40px', position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              src={`https://iframe.cloudflarestream.com/${gallery.video_uid}`}
              style={{ border: 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div style={{ background: '#111', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              No video uploaded yet
            </p>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0', borderTop: '1px solid #222', borderBottom: '1px solid #222' }}>
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Delivered by</p>
            <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#666', letterSpacing: '0.1em' }}>Casa Film</p>
          </div>
          <button style={{ padding: '12px 28px', background: '#b5874a', color: '#1a1410', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '500' }}>
            Approve Film ✓
          </button>
        </div>
      </div>
    </div>
  )
}

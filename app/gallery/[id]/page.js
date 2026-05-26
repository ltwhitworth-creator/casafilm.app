'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const FONTS = (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Mono:wght@400;500&family=Jost:wght@300;400&display=swap" rel="stylesheet" />
  </>
)

const GRAIN_SVG = "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23grain)' opacity='0.2'/%3E%3C/svg%3E"

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function GalleryPage(props) {
  const [gallery, setGallery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState('')
  const [id, setId] = useState(null)
  const [videos, setVideos] = useState([])
  const [approved, setApproved] = useState(false)
  const [approving, setApproving] = useState(false)
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)
  const [isPreview, setIsPreview] = useState(false)
  const playerRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIsPreview(params.get('preview') === 'true')
  }, [])

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
      const [{ data }, { data: videosData }] = await Promise.all([
        supabase.from('galleries').select('*').eq('id', id).single(),
        supabase.from('videos').select('*').eq('gallery_id', parseInt(id)).order('order', { ascending: true }),
      ])
      setGallery(data)
      setVideos(videosData || [])
      if (!data?.password) setUnlocked(true)
      if (data?.client_approved) {
        setApproved(true)
      } else {
        try {
          if (localStorage.getItem(`cf_approved_${id}`) === '1') setApproved(true)
        } catch {}
      }
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

  async function handleApprove() {
    if (approved || approving) return
    setApproving(true)
    try {
      await supabase
        .from('galleries')
        .update({ client_approved: true, client_approved_at: new Date().toISOString() })
        .eq('id', id)
      localStorage.setItem(`cf_approved_${id}`, '1')
    } catch {}
    setApproved(true)
    setApproving(false)
  }

  function selectVideo(index) {
    setActiveVideoIndex(index)
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
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
            position: relative; min-height: 100vh; background: #1a1410;
            display: flex; align-items: center; justify-content: center;
            padding: 60px 32px; overflow: hidden;
          }
          .gp-screen::before {
            content: ''; position: absolute; inset: 0;
            background-image: url("${GRAIN_SVG}"); background-size: 220px 220px;
            opacity: 0.55; pointer-events: none;
          }
          .gp-input {
            width: 100%; background: transparent; border: none;
            border-bottom: 1px solid rgba(240,232,216,0.18); padding: 16px 0;
            font-family: 'Jost', sans-serif; font-size: 17px; color: #f0e8d8;
            text-align: center; letter-spacing: 0.18em; outline: none;
            transition: border-color 0.25s; box-sizing: border-box;
          }
          .gp-input::placeholder { color: rgba(240,232,216,0.2); font-weight: 300; letter-spacing: 0.1em; }
          .gp-input:focus { border-bottom-color: #b5874a; }
          .gp-btn {
            width: 100%; padding: 20px; background: #b5874a; color: #1a1410;
            border: none; cursor: pointer; font-family: 'DM Mono', monospace;
            font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase;
            font-weight: 500; transition: background 0.2s; box-sizing: border-box;
          }
          .gp-btn:hover { background: #d4a865; }
          .gp-btn:active { background: #a07840; }
          @media (max-width: 480px) {
            .gp-screen { padding: 48px 24px; }
            .gp-name { font-size: 38px !important; }
          }
        `}</style>
        <div className="gp-screen">
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-55%)', width: '800px', height: '700px', background: 'radial-gradient(ellipse at center, rgba(181,135,74,0.11) 0%, rgba(181,135,74,0.04) 40%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ marginBottom: '72px' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '52px', color: '#f0e8d8', lineHeight: 1, marginBottom: '10px' }}>Casa</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: '#b5874a' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.55em', textTransform: 'uppercase', color: '#b5874a', paddingRight: '2px' }}>Film</span>
              </div>
            </div>
            <h1 className="gp-name" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '52px', fontWeight: 400, color: '#f0e8d8', lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.01em' }}>
              {gallery.name}
            </h1>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#b5874a', marginBottom: 0 }}>
              A film for {gallery.client_name}
            </p>
            <div style={{ width: '100%', height: '1px', background: 'linear-gradient(to right, transparent, rgba(181,135,74,0.4), transparent)', margin: '44px 0' }} />
            <input
              className="gp-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              autoFocus
            />
            {error && (
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#c0523a', marginTop: '16px', marginBottom: 0 }}>
                {error}
              </p>
            )}
            <button className="gp-btn" onClick={handleUnlock} style={{ marginTop: error ? '20px' : '28px' }}>
              View My Film
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Unlocked — cinematic gallery view ────────────────────────────────────

  const legacyVideo = gallery.video_uid
    ? { id: 'legacy', title: 'Main Film', video_uid: gallery.video_uid, thumbnail_url: gallery.thumbnail_url || null }
    : null
  const allVideos = [
    ...(legacyVideo ? [legacyVideo] : []),
    ...videos.map(v => ({ id: v.id, title: v.title || 'Untitled Film', video_uid: v.video_uid, thumbnail_url: v.thumbnail_url || null })),
  ]
  const safeIndex = Math.min(activeVideoIndex, Math.max(0, allVideos.length - 1))
  const activeVideo = allVideos[safeIndex] ?? null

  return (
    <>
      {FONTS}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #1a1410; }
        h1, h2, h3, p, button { margin: 0; padding: 0; }

        /* ── Preview Banner ──────────────────────────────────────────────── */
        @keyframes gc-preview-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.82; }
        }
        .gc-preview-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          background: #d4a865;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          animation: gc-preview-pulse 2.8s ease-in-out infinite;
        }
        .gc-preview-text {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #1a1410;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .gc-preview-back {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(26,20,16,0.72);
          text-decoration: none;
          transition: color 0.15s;
          white-space: nowrap;
          font-weight: 500;
        }
        .gc-preview-back:hover { color: #1a1410; }

        /* ── Grain ───────────────────────────────────────────────────────── */
        .gc-grain {
          position: fixed;
          inset: 0;
          background-image: url("${GRAIN_SVG}");
          background-size: 220px 220px;
          opacity: 0.4;
          pointer-events: none;
          z-index: 999;
        }

        /* ── Hero ────────────────────────────────────────────────────────── */
        .gc-hero {
          position: relative;
          min-height: 60vh;
          background: #1a1410;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 80px 40px;
        }

        .gc-hero-glow {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 1000px; height: 700px;
          background: radial-gradient(ellipse at center, rgba(181,135,74,0.15) 0%, rgba(181,135,74,0.05) 40%, transparent 70%);
          pointer-events: none;
        }

        @keyframes gc-hero-zoom {
          from { transform: scale(1); }
          to   { transform: scale(1.06); }
        }

        .gc-hero-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          animation: gc-hero-zoom 18s ease-in-out infinite alternate;
        }

        .gc-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(26,20,16,0.72) 0%,
            rgba(26,20,16,0.42) 45%,
            rgba(26,20,16,0.55) 65%,
            rgba(26,20,16,0.80) 100%
          );
        }

        .gc-hero-logo {
          position: absolute;
          top: 32px; left: 40px;
          z-index: 1;
        }

        @keyframes gc-fadein {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .gc-hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 900px;
          animation: gc-fadein 1.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .gc-hero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-size: 80px;
          font-weight: 400;
          color: #f0e8d8;
          line-height: 1.06;
          letter-spacing: -0.025em;
          margin-bottom: 22px;
          text-shadow: 0 2px 40px rgba(0,0,0,0.4);
        }

        .gc-hero-tagline {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.45em;
          text-transform: uppercase;
          color: #b5874a;
        }

        /* ── Player ──────────────────────────────────────────────────────── */
        .gc-player-section {
          position: relative;
          background: #0d0b08;
          scroll-margin-top: 0px;
        }

        .gc-now-playing {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 40px 18px;
        }
        .gc-now-playing-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.36em;
          text-transform: uppercase;
          color: rgba(181,135,74,0.45);
          margin-bottom: 7px;
        }
        .gc-now-playing-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-size: 30px;
          font-weight: 400;
          color: #f0e8d8;
          line-height: 1.2;
        }

        .gc-player-wrapper {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          box-shadow: 0 0 140px rgba(0,0,0,0.95);
        }
        .gc-player-wrapper iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        .gc-player-glow {
          position: absolute;
          bottom: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 55%;
          height: 120px;
          background: radial-gradient(ellipse at 50% 0%, rgba(181,135,74,0.3) 0%, transparent 70%);
          filter: blur(24px);
          pointer-events: none;
        }

        .gc-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at center, #1e1710 0%, #0d0b08 100%);
        }

        /* ── Playlist ────────────────────────────────────────────────────── */
        .gc-playlist-section {
          background: #0d0b08;
          padding: 56px 0 64px;
        }
        .gc-playlist-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 40px;
        }
        .gc-playlist-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .gc-playlist-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: rgba(181,135,74,0.45);
          white-space: nowrap;
        }
        .gc-playlist-rule {
          flex: 1;
          height: 1px;
          background: rgba(181,135,74,0.1);
        }

        /* Horizontal scroll on desktop */
        .gc-playlist-row {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 6px;
          scrollbar-width: thin;
          scrollbar-color: rgba(181,135,74,0.25) transparent;
        }
        .gc-playlist-row::-webkit-scrollbar { height: 3px; }
        .gc-playlist-row::-webkit-scrollbar-track { background: transparent; }
        .gc-playlist-row::-webkit-scrollbar-thumb { background: rgba(181,135,74,0.25); border-radius: 2px; }

        .gc-card {
          flex-shrink: 0;
          width: 224px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .gc-card:hover { transform: translateY(-3px); }

        .gc-card-thumb {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
          background: #111;
          border: 1px solid rgba(255,255,255,0.06);
          overflow: hidden;
          transition: border-color 0.2s;
          margin-bottom: 10px;
        }
        .gc-card:hover .gc-card-thumb { border-color: rgba(181,135,74,0.45); }
        .gc-card.gc-active .gc-card-thumb { border-color: #b5874a; }

        .gc-card-img {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-color: #111;
          opacity: 0.65;
          transition: opacity 0.2s;
        }
        .gc-card:hover .gc-card-img { opacity: 0.85; }
        .gc-card.gc-active .gc-card-img { opacity: 0.85; }

        .gc-card-play {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gc-card-title {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(240,232,216,0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s;
        }
        .gc-card:hover .gc-card-title { color: rgba(240,232,216,0.75); }
        .gc-card.gc-active .gc-card-title { color: #b5874a; }

        /* ── Details Bar ─────────────────────────────────────────────────── */
        .gc-details-bar {
          background: #110e0b;
          border-top: 1px solid rgba(181,135,74,0.1);
        }
        .gc-details-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }
        .gc-detail-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(240,232,216,0.22);
          margin-bottom: 5px;
        }
        .gc-detail-value {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: rgba(240,232,216,0.5);
          margin-bottom: 20px;
        }
        .gc-detail-value:last-child { margin-bottom: 0; }

        .gc-approve-btn {
          padding: 20px 44px;
          background: #b5874a;
          color: #1a1410;
          border: none;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          font-weight: 500;
          transition: background 0.2s, color 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .gc-approve-btn:hover:not([disabled]) { background: #d4a865; }
        .gc-approve-btn:active:not([disabled]) { background: #a07840; }
        .gc-approve-btn.gc-approved { background: rgba(28,56,38,0.45); color: #78c496; cursor: default; }
        .gc-approve-btn.gc-approving { opacity: 0.6; cursor: default; }

        /* ── Footer ──────────────────────────────────────────────────────── */
        .gc-footer {
          text-align: center;
          padding: 24px 40px 32px;
          background: #0d0b08;
          border-top: 1px solid rgba(181,135,74,0.05);
        }
        .gc-footer a {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: rgba(240,232,216,0.14);
          text-decoration: none;
          transition: color 0.2s;
        }
        .gc-footer a:hover { color: rgba(181,135,74,0.4); }

        /* ── Mobile ──────────────────────────────────────────────────────── */
        @media (max-width: 640px) {
          .gc-preview-bar { padding: 0 20px; }
          .gc-preview-text { font-size: 11px; letter-spacing: 0.2em; }
          .gc-hero { padding: 60px 24px; min-height: 50vh; }
          .gc-hero-logo { top: 20px; left: 24px; }
          .gc-hero-title { font-size: 44px; }
          .gc-now-playing { padding: 24px 24px 14px; }
          .gc-now-playing-title { font-size: 22px; }
          .gc-playlist-inner { padding: 0 24px; }
          /* Vertical stack on mobile */
          .gc-playlist-row {
            flex-direction: column;
            overflow-x: visible;
            gap: 12px;
          }
          .gc-card { width: 100%; }
          .gc-details-inner {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
            padding: 24px;
          }
          .gc-approve-btn { width: 100%; text-align: center; padding: 20px; }
          .gc-footer { padding: 20px 24px 28px; }
        }
      `}</style>

      {/* ── Preview banner ─────────────────────────────────────────────────── */}
      {isPreview && (
        <div className="gc-preview-bar">
          <span className="gc-preview-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1410" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="2" y="2" width="20" height="20" rx="2.5" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="17" y1="7" x2="22" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
            </svg>
            Preview Mode — viewing as your client
          </span>
          <a href="/dashboard" className="gc-preview-back">← Back to Dashboard</a>
        </div>
      )}
      {/* Spacer so content clears the fixed preview bar */}
      {isPreview && <div style={{ height: '56px', background: '#1a1410' }} />}

      {/* ── Grain overlay ──────────────────────────────────────────────────── */}
      <div className="gc-grain" />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="gc-hero">
        {gallery.cover_image_url && (
          <div className="gc-hero-bg" style={{ backgroundImage: `url(${gallery.cover_image_url})` }} />
        )}
        {gallery.cover_image_url && <div className="gc-hero-overlay" />}
        <div className="gc-hero-glow" style={gallery.cover_image_url ? { opacity: 0.5 } : {}} />

        {/* Logo */}
        <div className="gc-hero-logo">
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '28px', color: '#f0e8d8', lineHeight: 1, marginBottom: '6px' }}>
            Casa
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ flex: 1, height: '1px', background: '#b5874a' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '7px', letterSpacing: '0.5em', color: '#b5874a', textTransform: 'uppercase' }}>Film</span>
          </div>
        </div>

        {/* Gallery title */}
        <div className="gc-hero-content">
          <h1 className="gc-hero-title">{gallery.name}</h1>
          <p className="gc-hero-tagline">A film for {gallery.client_name}</p>
        </div>
      </div>

      {/* ── Main player ────────────────────────────────────────────────────── */}
      <div className="gc-player-section" ref={playerRef}>
        {activeVideo && (
          <div className="gc-now-playing">
            <p className="gc-now-playing-label">Now playing</p>
            <p className="gc-now-playing-title">{activeVideo.title}</p>
          </div>
        )}

        <div className="gc-player-wrapper">
          {activeVideo ? (
            <iframe
              key={activeVideo.video_uid}
              src={`https://iframe.cloudflarestream.com/${activeVideo.video_uid}${activeVideo.thumbnail_url ? `?poster=${encodeURIComponent(activeVideo.thumbnail_url)}` : ''}`}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="gc-placeholder">
              {/* Film-frame corner brackets */}
              {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
                <div key={`${v}${h}`} style={{
                  position: 'absolute', width: '28px', height: '28px',
                  [v]: '28px', [h]: '28px',
                  borderTop:    v === 'top'    ? '1px solid rgba(181,135,74,0.35)' : 'none',
                  borderBottom: v === 'bottom' ? '1px solid rgba(181,135,74,0.35)' : 'none',
                  borderLeft:   h === 'left'   ? '1px solid rgba(181,135,74,0.35)' : 'none',
                  borderRight:  h === 'right'  ? '1px solid rgba(181,135,74,0.35)' : 'none',
                }} />
              ))}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(181,135,74,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', textAlign: 'center', padding: '0 40px' }}>
                <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '32px', fontWeight: 400, color: 'rgba(240,232,216,0.5)', lineHeight: 1.3, marginBottom: '18px' }}>
                  Your film is being prepared
                </p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(181,135,74,0.4)' }}>
                  We'll be in touch very soon
                </p>
              </div>
            </div>
          )}
        </div>

        {activeVideo && <div className="gc-player-glow" />}
      </div>

      {/* ── Playlist ───────────────────────────────────────────────────────── */}
      {allVideos.length > 0 && (
        <div className="gc-playlist-section">
          <div className="gc-playlist-inner">
            <div className="gc-playlist-header">
              <span className="gc-playlist-label">
                {allVideos.length === 1 ? 'Your film' : 'In this gallery'}
              </span>
              <div className="gc-playlist-rule" />
            </div>
            <div className="gc-playlist-row">
              {allVideos.map((v, i) => (
                <div
                  key={v.id}
                  className={`gc-card${i === safeIndex ? ' gc-active' : ''}`}
                  onClick={() => selectVideo(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && selectVideo(i)}
                >
                  <div className="gc-card-thumb">
                    <div
                      className="gc-card-img"
                      style={{
                        backgroundImage: `url(${
                          v.thumbnail_url ||
                          `https://videodelivery.net/${v.video_uid}/thumbnails/thumbnail.jpg?time=3s&width=320&height=180`
                        })`,
                      }}
                    />
                    <div className="gc-card-play">
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                        <circle cx="20" cy="20" r="19" stroke="rgba(181,135,74,0.55)" strokeWidth="1" fill="rgba(0,0,0,0.45)" />
                        <polygon points="16,12 30,20 16,28" fill={i === safeIndex ? '#b5874a' : 'rgba(181,135,74,0.8)'} />
                      </svg>
                    </div>
                  </div>
                  <p className="gc-card-title">{v.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Details + Approve bar ──────────────────────────────────────────── */}
      <div className="gc-details-bar">
        <div className="gc-details-inner">
          <div>
            <p className="gc-detail-label">Delivered by</p>
            <p className="gc-detail-value">{gallery.studio_name || 'Casa Film'}</p>
            <p className="gc-detail-label">Date delivered</p>
            <p className="gc-detail-value">{formatDate(gallery.created_at)}</p>
          </div>
          {!isPreview && (
            <button
              className={`gc-approve-btn${approved ? ' gc-approved' : approving ? ' gc-approving' : ''}`}
              onClick={handleApprove}
              disabled={approved || approving}
            >
              {approved ? 'Film Approved ✓' : approving ? 'Saving…' : 'Approve Film'}
            </button>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="gc-footer">
        <a href="https://casafilm.co" target="_blank" rel="noopener noreferrer">
          Delivered via Casa Film
        </a>
      </footer>
    </>
  )
}

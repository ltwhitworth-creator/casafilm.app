'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadCoverWithProgress } from '../lib/uploadCover'

function getGreeting(email) {
  const hour = new Date().getHours()
  const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const name = email?.split('@')[0] ?? ''
  return `Good ${period}, ${name}`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function StatusBadge({ tier }) {
  const label = tier === 'active' || !tier ? 'Active' : tier
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: '9px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#b5874a',
      background: 'rgba(181,135,74,0.12)',
      padding: '4px 10px',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [videos, setVideos] = useState([])
  const [deletingVideo, setDeletingVideo] = useState(null)
  const [updatingCoverFor, setUpdatingCoverFor] = useState(null)
  const coverInputRef = useRef(null)

  useEffect(() => {
    async function getData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      setUser(session.user)
      const { data } = await supabase
        .from('galleries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setGalleries(data || [])
      const galleryIds = (data || []).map(g => g.id)
      if (galleryIds.length > 0) {
        const { data: vData } = await supabase
          .from('videos')
          .select('*')
          .in('gallery_id', galleryIds)
          .order('order', { ascending: true })
        setVideos(vData || [])
      }
      setLoading(false)
    }
    getData()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleDeleteVideo(video) {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return
    setDeletingVideo(video.id)
    try {
      if (video.video_uid) {
        await fetch(`/api/stream/${video.video_uid}`, { method: 'DELETE' })
      }
      await supabase.from('videos').delete().eq('id', video.id)
      setVideos(prev => prev.filter(v => v.id !== video.id))
    } finally {
      setDeletingVideo(null)
    }
  }

  async function handleCoverChange(e) {
    const file = e.target.files[0]
    e.target.value = ''
    const galleryId = updatingCoverFor
    setUpdatingCoverFor(null)
    if (!file || !galleryId) return

    setGalleries(prev => prev.map(g =>
      g.id === galleryId ? { ...g, _coverUploading: true, _coverProgress: 0, _coverError: '' } : g
    ))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const path = await uploadCoverWithProgress(file, session.access_token, (pct) => {
        setGalleries(prev => prev.map(g =>
          g.id === galleryId ? { ...g, _coverProgress: pct } : g
        ))
      })

      const { data: { publicUrl } } = supabase.storage.from('gallery-covers').getPublicUrl(path)
      await supabase.from('galleries').update({ cover_image_url: publicUrl }).eq('id', galleryId)
      setGalleries(prev => prev.map(g =>
        g.id === galleryId
          ? { ...g, cover_image_url: publicUrl, _coverUploading: false, _coverProgress: 100, _coverError: '' }
          : g
      ))
    } catch (err) {
      setGalleries(prev => prev.map(g =>
        g.id === galleryId
          ? { ...g, _coverUploading: false, _coverProgress: 0, _coverError: err.message || 'Upload failed' }
          : g
      ))
    }
  }

  async function handleDeleteLegacyVideo(gallery) {
    if (!confirm(`Delete the main video for "${gallery.name}"? This cannot be undone.`)) return
    setDeletingVideo(`legacy-${gallery.id}`)
    try {
      await fetch(`/api/stream/${gallery.video_uid}`, { method: 'DELETE' })
      await supabase.from('galleries').update({ video_uid: null }).eq('id', gallery.id)
      setGalleries(prev => prev.map(g => g.id === gallery.id ? { ...g, video_uid: null } : g))
    } finally {
      setDeletingVideo(null)
    }
  }

  async function handleDelete(gallery) {
    if (!confirm(`Delete "${gallery.name}"? This cannot be undone.`)) return
    setDeleting(gallery.id)
    try {
      if (gallery.video_uid) {
        await fetch(`/api/stream/${gallery.video_uid}`, { method: 'DELETE' })
      }
      await supabase.from('galleries').delete().eq('id', gallery.id)
      setGalleries(prev => prev.filter(g => g.id !== gallery.id))
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Mono:wght@400;500&family=Jost:wght@300;400&display=swap" rel="stylesheet" />
        <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '40px', color: '#1a1410', lineHeight: 1, marginBottom: '8px' }}>Casa</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
              <div style={{ width: '36px', height: '1px', background: '#b5874a' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.5em', color: '#b5874a', textTransform: 'uppercase' }}>Film</span>
            </div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', color: '#9a8e82', textTransform: 'uppercase' }}>Loading…</p>
          </div>
        </div>
      </>
    )
  }

  const videoCount = galleries.filter(g => g.video_uid).length + videos.length

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Mono:wght@400;500&family=Jost:wght@300;400&display=swap" rel="stylesheet" />

      <style>{`
        /* ── Nav ── */
        .dash-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #ffffff;
          border-bottom: 1px solid #b5874a;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 64px;
        }

        /* ── Stat bar ── */
        .dash-statbar {
          background: #ffffff;
          border-bottom: 1px solid rgba(26,20,16,0.08);
          display: flex;
          align-items: stretch;
        }
        .dash-stat {
          flex: 1;
          padding: 16px 32px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-right: 1px solid rgba(26,20,16,0.08);
        }
        .dash-stat:last-child { border-right: none; }

        /* ── Gallery cards ── */
        .dash-card {
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(26,20,16,0.06), 0 4px 20px rgba(26,20,16,0.04);
          padding: 24px 28px;
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        /* ── Video list within card ── */
        .dash-video-list {
          width: 100%;
          flex-basis: 100%;
          border-top: 1px solid rgba(26,20,16,0.07);
          padding-top: 14px;
          margin-top: -8px;
        }
        .dash-video-list-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #c0b8ae;
          margin-bottom: 8px;
        }
        .dash-video-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(26,20,16,0.05);
        }
        .dash-video-row:last-child { border-bottom: none; }
        .dash-video-num {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #b5874a;
          letter-spacing: 0.06em;
          flex-shrink: 0;
          width: 18px;
        }
        .dash-video-name {
          flex: 1;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #5a4e42;
          letter-spacing: 0.05em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dash-video-del {
          background: none;
          border: 1px solid rgba(184,50,50,0.22);
          color: #b83232;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 5px 10px;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s;
        }
        .dash-video-del:hover:not(:disabled) {
          background: rgba(184,50,50,0.05);
          border-color: rgba(184,50,50,0.38);
        }
        .dash-video-del:disabled { opacity: 0.4; cursor: not-allowed; }
        .dash-card:hover {
          box-shadow: 0 2px 10px rgba(26,20,16,0.09), 0 8px 28px rgba(26,20,16,0.07);
          transform: translateY(-1px);
        }
        .dash-card.is-deleting {
          opacity: 0.45;
          pointer-events: none;
        }

        /* ── Buttons ── */
        .dash-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 9px 16px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s, opacity 0.15s;
        }
        .dash-btn-dark {
          background: #1a1410;
          color: #f0e8d8;
        }
        .dash-btn-dark:hover {
          background: #2e261d;
        }
        .dash-btn-outline {
          background: transparent;
          color: #1a1410;
          border: 1px solid rgba(26,20,16,0.18);
        }
        .dash-btn-outline:hover {
          border-color: rgba(26,20,16,0.4);
          background: rgba(26,20,16,0.03);
        }
        .dash-btn-muted {
          color: #c0b8ae;
          border-color: rgba(26,20,16,0.1);
          cursor: not-allowed;
        }
        .dash-btn-muted:hover {
          background: transparent;
          border-color: rgba(26,20,16,0.1);
        }
        .dash-btn-danger {
          background: transparent;
          color: #b83232;
          border: 1px solid rgba(184,50,50,0.25);
        }
        .dash-btn-danger:hover:not(:disabled) {
          background: rgba(184,50,50,0.05);
          border-color: rgba(184,50,50,0.4);
        }
        .dash-btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .dash-logout-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #9a8e82;
          padding: 4px 0;
          text-transform: uppercase;
          transition: color 0.15s;
        }
        .dash-logout-btn:hover { color: #1a1410; }

        /* ── Card actions ── */
        .dash-card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* ── New gallery CTA in empty state ── */
        .dash-empty-btn {
          display: inline-block;
          padding: 16px 48px;
          background: #1a1410;
          color: #f0e8d8;
          text-decoration: none;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          transition: background 0.2s;
        }
        .dash-empty-btn:hover { background: #2e261d; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .dash-nav { padding: 0 20px; }
          .dash-stat { padding: 12px 20px; }
          .dash-card { flex-direction: column; gap: 16px; }
          .dash-card-actions { flex-wrap: wrap; }
          .dash-content { padding: 32px 20px; }
        }
        @media (max-width: 480px) {
          .dash-statbar { flex-wrap: wrap; }
          .dash-stat { flex: 1 1 50%; border-right: none; border-bottom: 1px solid rgba(26,20,16,0.08); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f5f0e8' }}>

        {/* Hidden cover image input */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleCoverChange}
        />

        {/* ── Navigation ── */}
        <nav className="dash-nav">
          {/* Logo */}
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '26px', color: '#1a1410', lineHeight: 1, marginBottom: '3px' }}>
              Casa
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '24px', height: '1px', background: '#b5874a' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '7px', letterSpacing: '0.5em', color: '#b5874a', textTransform: 'uppercase' }}>Film</span>
            </div>
          </div>

          {/* User + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#9a8e82', letterSpacing: '0.05em' }}>
              {user?.email}
            </span>
            <button className="dash-logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </nav>

        {/* ── Stat bar ── */}
        <div className="dash-statbar">
          <div className="dash-stat">
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a8e82' }}>Galleries</span>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#1a1410', lineHeight: 1 }}>{galleries.length}</span>
          </div>
          <div className="dash-stat">
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a8e82' }}>Videos uploaded</span>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#1a1410', lineHeight: 1 }}>{videoCount}</span>
          </div>
          <div className="dash-stat">
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a8e82' }}>Storage used</span>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#c0b8ae', lineHeight: 1 }}>—</span>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="dash-content" style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 40px' }}>

          {/* Welcome */}
          <div style={{ marginBottom: '48px' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '36px', fontWeight: 400, color: '#1a1410', marginBottom: '6px', lineHeight: 1.2 }}>
              {getGreeting(user?.email)}
            </h1>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9a8e82' }}>
              Your galleries
            </p>
          </div>

          {/* Empty state */}
          {galleries.length === 0 ? (
            <div style={{ background: '#ffffff', boxShadow: '0 1px 4px rgba(26,20,16,0.05)', padding: '80px 40px', textAlign: 'center' }}>
              {/* Logo mark */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '52px', color: '#1a1410', lineHeight: 1, marginBottom: '8px' }}>
                  Casa
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                  <div style={{ width: '40px', height: '1px', background: '#b5874a' }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '8px', letterSpacing: '0.5em', color: '#b5874a', textTransform: 'uppercase' }}>Film</span>
                  <div style={{ width: '40px', height: '1px', background: '#b5874a' }} />
                </div>
              </div>

              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '28px', fontWeight: 400, color: '#1a1410', marginBottom: '12px' }}>
                No galleries yet
              </h2>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '15px', color: '#7a6e62', fontWeight: 300, marginBottom: '40px', maxWidth: '380px', margin: '0 auto 40px', lineHeight: 1.7 }}>
                Create your first gallery to start delivering films to your clients in a way they&apos;ll remember.
              </p>
              <a href="/galleries/new" className="dash-empty-btn">
                Create your first gallery
              </a>
            </div>
          ) : (
            <>
              {/* Gallery section header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9a8e82' }}>
                  {galleries.length} {galleries.length === 1 ? 'gallery' : 'galleries'}
                </p>
                <a href="/galleries/new" className="dash-btn dash-btn-dark">
                  New Gallery
                </a>
              </div>

              {/* Gallery cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {galleries.map(gallery => {
                  const isDeleting = deleting === gallery.id
                  const hasEmail = Boolean(gallery.client_email)
                  const galleryVideos = videos.filter(v => v.gallery_id === gallery.id)
                  return (
                    <div key={gallery.id} className={`dash-card${isDeleting ? ' is-deleting' : ''}`}>

                      {/* Gallery info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {gallery.cover_image_url && (
                          <div style={{ marginBottom: '10px', width: '80px', height: '50px', backgroundImage: `url(${gallery.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(181,135,74,0.2)' }} />
                        )}
                        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '21px', fontWeight: 400, color: '#1a1410', marginBottom: '6px', lineHeight: 1.3 }}>
                          {gallery.name}
                        </h3>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#9a8e82', letterSpacing: '0.08em', lineHeight: 1.6 }}>
                          {gallery.client_name}
                          {gallery.client_email && (
                            <span style={{ color: '#c0b8ae' }}> · {gallery.client_email}</span>
                          )}
                          <span style={{ color: '#c0b8ae' }}> · Created {formatDate(gallery.created_at)}</span>
                          {gallery.password
                            ? <span style={{ color: '#c0b8ae' }}> · Password protected</span>
                            : <span style={{ color: '#c0b8ae' }}> · Public</span>
                          }
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="dash-card-actions">
                        <StatusBadge tier={gallery.storage_tier} />

                        <a href={`/gallery/${gallery.id}`} className="dash-btn dash-btn-outline">
                          View
                        </a>

                        <a href={`/gallery/${gallery.id}?preview=true`} target="_blank" rel="noopener noreferrer" className="dash-btn dash-btn-outline">
                          Preview
                        </a>

                        <a href={`/galleries/${gallery.id}/add-video`} className="dash-btn dash-btn-outline">
                          Add Video
                        </a>

                        <button
                          className="dash-btn dash-btn-outline"
                          onClick={() => { setUpdatingCoverFor(gallery.id); coverInputRef.current?.click() }}
                          disabled={gallery._coverUploading}
                        >
                          {gallery._coverUploading ? 'Uploading…' : gallery.cover_image_url ? 'Change Cover' : 'Add Cover'}
                        </button>

                        <button
                          className={`dash-btn dash-btn-outline${!hasEmail ? ' dash-btn-muted' : ''}`}
                          disabled={!hasEmail}
                          title={hasEmail ? 'Notify client (coming soon)' : 'No client email set'}
                        >
                          Notify client
                        </button>

                        <button
                          className="dash-btn dash-btn-danger"
                          onClick={() => handleDelete(gallery)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? '…' : 'Delete'}
                        </button>
                      </div>

                      {/* Cover upload progress */}
                      {(gallery._coverUploading || gallery._coverError) && (
                        <div style={{ width: '100%', flexBasis: '100%', borderTop: '1px solid rgba(26,20,16,0.07)', paddingTop: '14px', marginTop: '-8px' }}>
                          {gallery._coverUploading ? (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#9a8e82', letterSpacing: '0.1em' }}>
                                  Uploading cover image…
                                </span>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#b5874a' }}>
                                  {gallery._coverProgress ?? 0}%
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '3px', background: 'rgba(26,20,16,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#b5874a', borderRadius: '2px', transition: 'width 0.25s ease', width: `${gallery._coverProgress ?? 0}%` }} />
                              </div>
                            </>
                          ) : gallery._coverError ? (
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#b83232', letterSpacing: '0.08em' }}>
                              Cover upload failed: {gallery._coverError}
                            </p>
                          ) : null}
                        </div>
                      )}

                      {/* Video list */}
                      {(gallery.video_uid || galleryVideos.length > 0) && (
                        <div className="dash-video-list">
                          <p className="dash-video-list-label">Films in this gallery</p>
                          {gallery.video_uid && (
                            <div className="dash-video-row">
                              <span className="dash-video-num">01</span>
                              <span className="dash-video-name">Main Film</span>
                              <button
                                className="dash-video-del"
                                onClick={() => handleDeleteLegacyVideo(gallery)}
                                disabled={deletingVideo === `legacy-${gallery.id}`}
                              >
                                {deletingVideo === `legacy-${gallery.id}` ? '…' : 'Delete'}
                              </button>
                            </div>
                          )}
                          {galleryVideos.map((v, i) => (
                            <div key={v.id} className="dash-video-row">
                              <span className="dash-video-num">{String(i + (gallery.video_uid ? 2 : 1)).padStart(2, '0')}</span>
                              <span className="dash-video-name">{v.title || 'Untitled'}</span>
                              <button
                                className="dash-video-del"
                                onClick={() => handleDeleteVideo(v)}
                                disabled={deletingVideo === v.id}
                              >
                                {deletingVideo === v.id ? '…' : 'Delete'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}

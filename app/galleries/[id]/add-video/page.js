'use client'
import { useState, useEffect, useRef } from 'react'
import { Upload } from 'tus-js-client'
import { supabase } from '../../../lib/supabase'

function formatFileSize(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`
}

export default function AddVideo(props) {
  const [user, setUser] = useState(null)
  const [gallery, setGallery] = useState(null)
  const [galleryId, setGalleryId] = useState(null)
  const [title, setTitle] = useState('')
  const [video, setVideo] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')
  const [message, setMessage] = useState('')
  const [existingVideos, setExistingVideos] = useState([])
  const [deletingVideo, setDeletingVideo] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function init() {
      const resolvedParams = await props.params
      const id = resolvedParams.id
      setGalleryId(id)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      const [{ data: galleryData }, { data: vData }] = await Promise.all([
        supabase.from('galleries').select('id, name, client_name').eq('id', id).single(),
        supabase.from('videos').select('*').eq('gallery_id', parseInt(id)).order('order', { ascending: true }),
      ])
      if (galleryData) setGallery(galleryData)
      setExistingVideos(vData || [])
    }
    init()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('video/')) setVideo(file)
  }

  async function handleDeleteVideo(video) {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return
    setDeletingVideo(video.id)
    try {
      if (video.video_uid) {
        await fetch(`/api/stream/${video.video_uid}`, { method: 'DELETE' })
      }
      await supabase.from('videos').delete().eq('id', video.id)
      setExistingVideos(prev => prev.filter(v => v.id !== video.id))
    } finally {
      setDeletingVideo(null)
    }
  }

  async function handleAdd() {
    if (!title.trim() || !video) {
      setMessage('Please enter a title and select a video file.')
      return
    }
    setLoading(true)
    setMessage('')

    let videoUid = null
    try {
      setUploadStage('Uploading video…')
      setProgress(0)
      videoUid = await new Promise((resolve, reject) => {
        let capturedUid = null
        const upload = new Upload(video, {
          endpoint: '/api/upload',
          chunkSize: 50 * 1024 * 1024,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          metadata: { filename: video.name, filetype: video.type },
          onAfterResponse(req, res) {
            const mediaId = res.getHeader('Stream-Media-Id')
            if (mediaId) capturedUid = mediaId
          },
          onProgress(bytesUploaded, bytesTotal) {
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100))
          },
          onSuccess() {
            setProgress(100)
            setUploadStage('Video uploaded!')
            resolve(capturedUid)
          },
          onError(err) { reject(err) },
        })
        upload.start()
      })
    } catch (err) {
      setMessage('Video upload failed — ' + err.message)
      setLoading(false)
      return
    }

    // Determine next order value
    const { data: existing } = await supabase
      .from('videos')
      .select('order')
      .eq('gallery_id', parseInt(galleryId))
      .order('order', { ascending: false })
      .limit(1)
    const nextOrder = existing?.[0]?.order != null ? existing[0].order + 1 : 1

    setUploadStage('Saving…')
    const { error } = await supabase.from('videos').insert({
      gallery_id: parseInt(galleryId),
      video_uid: videoUid,
      title: title.trim(),
      order: nextOrder,
    })

    if (error) {
      setMessage('Something went wrong — ' + error.message)
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Mono:wght@400;500&family=Jost:wght@300;400&display=swap" rel="stylesheet" />

      <style>{`
        .av-nav {
          position: sticky; top: 0; z-index: 50;
          background: #ffffff;
          border-bottom: 1px solid #b5874a;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 64px;
        }
        .av-logout {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 10px;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #9a8e82; transition: color 0.15s;
        }
        .av-logout:hover { color: #1a1410; }

        .av-content {
          max-width: 1080px; margin: 0 auto;
          padding: 48px 40px 100px;
        }
        .av-columns {
          display: flex; gap: 64px; align-items: flex-start;
        }
        .av-form-col { flex: 1; min-width: 0; }
        .av-tips-col {
          width: 260px; flex-shrink: 0;
          position: sticky; top: 88px;
        }

        .av-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #9a8e82; text-decoration: none;
          margin-bottom: 32px; transition: color 0.15s;
        }
        .av-back:hover { color: #1a1410; }

        .av-section { margin-bottom: 44px; }
        .av-section-head {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 24px;
        }
        .av-section-label {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: #b5874a; white-space: nowrap;
        }
        .av-section-rule {
          flex: 1; height: 1px; background: rgba(181,135,74,0.28);
        }

        .av-field { margin-bottom: 32px; }
        .av-field:last-child { margin-bottom: 0; }
        .av-label {
          display: block;
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #9a8e82; margin-bottom: 10px;
        }
        .av-input {
          width: 100%; background: transparent;
          border: none; border-bottom: 1px solid rgba(26,20,16,0.18);
          padding: 11px 0;
          font-family: 'Jost', sans-serif; font-size: 16px;
          color: #1a1410; outline: none;
          transition: border-color 0.2s; box-sizing: border-box;
        }
        .av-input::placeholder { color: rgba(26,20,16,0.28); font-weight: 300; }
        .av-input:focus { border-bottom-color: #b5874a; }

        .av-drop {
          border: 1.5px dashed rgba(181,135,74,0.45);
          padding: 44px 28px; text-align: center; cursor: pointer;
          background: rgba(181,135,74,0.03);
          transition: background 0.2s, border-color 0.2s;
          user-select: none;
        }
        .av-drop:hover, .av-drop.over {
          background: rgba(181,135,74,0.08);
          border-color: #b5874a;
        }

        .av-progress-track {
          width: 100%; height: 3px;
          background: rgba(26,20,16,0.1); border-radius: 2px;
          overflow: hidden;
        }
        .av-progress-bar {
          height: 100%; background: #b5874a; border-radius: 2px;
          transition: width 0.3s ease;
        }

        .av-submit {
          width: 100%; padding: 18px;
          background: #1a1410; color: #f0e8d8;
          border: none; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 0.22em; text-transform: uppercase;
          transition: background 0.2s; box-sizing: border-box;
        }
        .av-submit:hover:not(:disabled) { background: #2e261d; }
        .av-submit:disabled { background: #9a8e82; cursor: not-allowed; }

        .av-tip {
          padding-left: 14px;
          border-left: 2px solid rgba(181,135,74,0.3);
          margin-bottom: 28px;
        }
        .av-tip-label {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #b5874a; margin-bottom: 6px;
        }
        .av-tip-body {
          font-family: 'Jost', sans-serif; font-size: 13px;
          color: #7a6e62; font-weight: 300; line-height: 1.7;
        }

        /* ── Video list ── */
        .av-video-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid rgba(26,20,16,0.08);
        }
        .av-video-row:first-child { border-top: 1px solid rgba(26,20,16,0.08); }
        .av-video-num {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #b5874a;
          letter-spacing: 0.08em;
          flex-shrink: 0;
          width: 20px;
        }
        .av-video-name {
          flex: 1;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          color: #1a1410;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .av-video-del {
          background: none;
          border: 1px solid rgba(184,50,50,0.25);
          color: #b83232;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 6px 12px;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s;
        }
        .av-video-del:hover:not(:disabled) {
          background: rgba(184,50,50,0.06);
          border-color: rgba(184,50,50,0.4);
        }
        .av-video-del:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Gallery context pill */
        .av-context {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(181,135,74,0.1);
          padding: 8px 16px; margin-bottom: 40px;
        }
        .av-context-label {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #9a8e82;
        }
        .av-context-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic; font-size: 16px; color: #1a1410;
        }

        @media (max-width: 768px) {
          .av-nav { padding: 0 20px; }
          .av-content { padding: 32px 20px 64px; }
          .av-columns { flex-direction: column; gap: 0; }
          .av-tips-col { width: 100%; position: static; margin-top: 48px; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f5f0e8' }}>

        {/* ── Navigation ── */}
        <nav className="av-nav">
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '26px', color: '#1a1410', lineHeight: 1, marginBottom: '3px' }}>
              Casa
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '24px', height: '1px', background: '#b5874a' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '7px', letterSpacing: '0.5em', color: '#b5874a', textTransform: 'uppercase' }}>Film</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#9a8e82', letterSpacing: '0.05em' }}>
              {user?.email}
            </span>
            <button className="av-logout" onClick={handleLogout}>Log out</button>
          </div>
        </nav>

        <div className="av-content">

          <a href="/dashboard" className="av-back">← Dashboard</a>

          {/* Gallery context */}
          {gallery && (
            <div className="av-context">
              <span className="av-context-label">Adding to</span>
              <span className="av-context-name">{gallery.name}</span>
            </div>
          )}

          <div style={{ marginBottom: '48px' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '40px', fontWeight: 400, color: '#1a1410', lineHeight: 1.2, marginBottom: '8px' }}>
              Add a film
            </h1>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '15px', color: '#7a6e62', fontWeight: 300 }}>
              Upload an additional film to this gallery
            </p>
          </div>

          <div className="av-columns">

            {/* ── Form ── */}
            <div className="av-form-col">

              {/* Existing videos */}
              {existingVideos.length > 0 && (
                <div className="av-section">
                  <div className="av-section-head">
                    <span className="av-section-label">Films in this gallery</span>
                    <div className="av-section-rule" />
                  </div>
                  <div>
                    {existingVideos.map((v, i) => (
                      <div key={v.id} className="av-video-row">
                        <span className="av-video-num">{String(i + 1).padStart(2, '0')}</span>
                        <span className="av-video-name">{v.title || 'Untitled'}</span>
                        <button
                          className="av-video-del"
                          onClick={() => handleDeleteVideo(v)}
                          disabled={deletingVideo === v.id}
                        >
                          {deletingVideo === v.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Film title */}
              <div className="av-section">
                <div className="av-section-head">
                  <span className="av-section-label">Film Details</span>
                  <div className="av-section-rule" />
                </div>
                <div className="av-field">
                  <label className="av-label">Film title</label>
                  <input
                    className="av-input"
                    type="text"
                    placeholder="e.g. Ceremony Film, Highlights Reel"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Film upload */}
              <div className="av-section">
                <div className="av-section-head">
                  <span className="av-section-label">Film</span>
                  <div className="av-section-rule" />
                </div>

                <div
                  className={`av-drop${dragOver ? ' over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#b5874a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '14px', opacity: 0.75 }}>
                    <rect x="2" y="2" width="20" height="20" rx="2.5" />
                    <line x1="7" y1="2" x2="7" y2="22" />
                    <line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="2" y1="7" x2="7" y2="7" />
                    <line x1="17" y1="7" x2="22" y2="7" />
                    <line x1="2" y1="17" x2="7" y2="17" />
                    <line x1="17" y1="17" x2="22" y2="17" />
                  </svg>

                  {video ? (
                    <>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#b5874a', letterSpacing: '0.06em', marginBottom: '5px' }}>
                        {video.name}
                      </p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#9a8e82', fontWeight: 300 }}>
                        {formatFileSize(video.size)} · Click or drop to change
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#7a6e62', letterSpacing: '0.06em', marginBottom: '6px' }}>
                        Drop your video here or click to browse
                      </p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#b0a898', fontWeight: 300 }}>
                        MP4, MOV, MKV · up to 5 GB · resumable upload
                      </p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={e => setVideo(e.target.files[0] || null)}
                />

                {loading && video && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#9a8e82', letterSpacing: '0.1em' }}>
                        {uploadStage}
                      </span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#b5874a' }}>
                        {progress}%
                      </span>
                    </div>
                    <div className="av-progress-track">
                      <div className="av-progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {message && (
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#b83232', marginBottom: '24px', lineHeight: 1.5 }}>
                  {message}
                </p>
              )}

              <button
                className="av-submit"
                onClick={handleAdd}
                disabled={loading || !title.trim() || !video}
              >
                {loading ? (uploadStage || 'Please wait…') : 'Upload Film'}
              </button>

            </div>

            {/* ── Tips ── */}
            <div className="av-tips-col">
              <div style={{ marginBottom: '32px' }}>
                <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '20px', color: '#1a1410', marginBottom: '8px', lineHeight: 1.3 }}>
                  A few helpful notes
                </p>
                <div style={{ width: '28px', height: '1px', background: '#b5874a' }} />
              </div>

              <div className="av-tip">
                <div className="av-tip-label">Film title</div>
                <p className="av-tip-body">Give each film a clear name so your client knows what they're watching — "Ceremony Film", "Highlights", "Speeches". The title appears above the player in their gallery.</p>
              </div>

              <div className="av-tip">
                <div className="av-tip-label">Multiple films</div>
                <p className="av-tip-body">When a gallery contains more than one film, clients see a contents list at the top so they can jump to each one. Films are ordered by the sequence they were added.</p>
              </div>

              <div className="av-tip">
                <div className="av-tip-label">Uploading your film</div>
                <p className="av-tip-body">We use resumable chunked uploading, so large files are safe even on slower connections. If the upload is interrupted, simply come back to this page and try again.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

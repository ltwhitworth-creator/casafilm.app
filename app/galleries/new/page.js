'use client'
import { useState, useEffect, useRef } from 'react'
import { Upload } from 'tus-js-client'
import { supabase } from '../../lib/supabase'

function formatFileSize(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`
}

export default function NewGallery() {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [password, setPassword] = useState('')
  const [video, setVideo] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')
  const [message, setMessage] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user)
    })
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

  async function handleCreate() {
    if (!name || !clientName) {
      setMessage('Please enter a gallery name and client name.')
      return
    }
    setLoading(true)
    setMessage('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return }

    let videoUid = null
    if (video) {
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
    }

    setUploadStage('Creating gallery…')
    const { error } = await supabase.from('galleries').insert({
      name,
      client_name: clientName,
      client_email: clientEmail || null,
      password: password || null,
      user_id: session.user.id,
      video_uid: videoUid,
      owner_type: 'videographer',
      ownership_transferred: false,
      storage_tier: 'active',
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
        /* ── Nav ── */
        .ng-nav {
          position: sticky; top: 0; z-index: 50;
          background: #ffffff;
          border-bottom: 1px solid #b5874a;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 64px;
        }
        .ng-logout {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 10px;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #9a8e82; transition: color 0.15s;
        }
        .ng-logout:hover { color: #1a1410; }

        /* ── Layout ── */
        .ng-content {
          max-width: 1080px; margin: 0 auto;
          padding: 48px 40px 100px;
        }
        .ng-columns {
          display: flex; gap: 64px; align-items: flex-start;
        }
        .ng-form-col { flex: 1; min-width: 0; }
        .ng-tips-col {
          width: 260px; flex-shrink: 0;
          position: sticky; top: 88px;
        }

        /* ── Back link ── */
        .ng-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #9a8e82; text-decoration: none;
          margin-bottom: 32px; transition: color 0.15s;
        }
        .ng-back:hover { color: #1a1410; }

        /* ── Section headers ── */
        .ng-section { margin-bottom: 44px; }
        .ng-section-head {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 24px;
        }
        .ng-section-label {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.26em; text-transform: uppercase;
          color: #b5874a; white-space: nowrap;
        }
        .ng-section-rule {
          flex: 1; height: 1px; background: rgba(181,135,74,0.28);
        }

        /* ── Inputs ── */
        .ng-field { margin-bottom: 32px; }
        .ng-field:last-child { margin-bottom: 0; }
        .ng-label {
          display: block;
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #9a8e82; margin-bottom: 10px;
        }
        .ng-input {
          width: 100%; background: transparent;
          border: none; border-bottom: 1px solid rgba(26,20,16,0.18);
          padding: 11px 0;
          font-family: 'Jost', sans-serif; font-size: 16px;
          color: #1a1410; outline: none;
          transition: border-color 0.2s; box-sizing: border-box;
        }
        .ng-input::placeholder { color: rgba(26,20,16,0.28); font-weight: 300; }
        .ng-input:focus { border-bottom-color: #b5874a; }

        /* ── Drop zone ── */
        .ng-drop {
          border: 1.5px dashed rgba(181,135,74,0.45);
          padding: 44px 28px; text-align: center; cursor: pointer;
          background: rgba(181,135,74,0.03);
          transition: background 0.2s, border-color 0.2s;
          user-select: none;
        }
        .ng-drop:hover, .ng-drop.over {
          background: rgba(181,135,74,0.08);
          border-color: #b5874a;
        }

        /* ── Progress ── */
        .ng-progress-track {
          width: 100%; height: 3px;
          background: rgba(26,20,16,0.1); border-radius: 2px;
          overflow: hidden;
        }
        .ng-progress-bar {
          height: 100%; background: #b5874a; border-radius: 2px;
          transition: width 0.3s ease;
        }

        /* ── Submit button ── */
        .ng-submit {
          width: 100%; padding: 18px;
          background: #1a1410; color: #f0e8d8;
          border: none; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 11px;
          letter-spacing: 0.22em; text-transform: uppercase;
          transition: background 0.2s; box-sizing: border-box;
        }
        .ng-submit:hover:not(:disabled) { background: #2e261d; }
        .ng-submit:disabled { background: #9a8e82; cursor: not-allowed; }

        /* ── Tips ── */
        .ng-tip {
          padding-left: 14px;
          border-left: 2px solid rgba(181,135,74,0.3);
          margin-bottom: 28px;
        }
        .ng-tip-label {
          font-family: 'DM Mono', monospace; font-size: 9px;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #b5874a; margin-bottom: 6px;
        }
        .ng-tip-body {
          font-family: 'Jost', sans-serif; font-size: 13px;
          color: #7a6e62; font-weight: 300; line-height: 1.7;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .ng-nav { padding: 0 20px; }
          .ng-content { padding: 32px 20px 64px; }
          .ng-columns { flex-direction: column; gap: 0; }
          .ng-tips-col { width: 100%; position: static; margin-top: 48px; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f5f0e8' }}>

        {/* ── Navigation ── */}
        <nav className="ng-nav">
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
            <button className="ng-logout" onClick={handleLogout}>Log out</button>
          </div>
        </nav>

        <div className="ng-content">

          {/* ── Page header ── */}
          <a href="/dashboard" className="ng-back">← Dashboard</a>
          <div style={{ marginBottom: '48px' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '40px', fontWeight: 400, color: '#1a1410', lineHeight: 1.2, marginBottom: '8px' }}>
              Create a gallery
            </h1>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '15px', color: '#7a6e62', fontWeight: 300 }}>
              Set up a new delivery gallery for your client
            </p>
          </div>

          <div className="ng-columns">

            {/* ── Form ── */}
            <div className="ng-form-col">

              {/* Gallery details */}
              <div className="ng-section">
                <div className="ng-section-head">
                  <span className="ng-section-label">Gallery Details</span>
                  <div className="ng-section-rule" />
                </div>
                <div className="ng-field">
                  <label className="ng-label">Gallery name</label>
                  <input
                    className="ng-input"
                    type="text"
                    placeholder="e.g. Sarah and James Wedding Film"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Client details */}
              <div className="ng-section">
                <div className="ng-section-head">
                  <span className="ng-section-label">Client Details</span>
                  <div className="ng-section-rule" />
                </div>
                <div className="ng-field">
                  <label className="ng-label">Client name</label>
                  <input
                    className="ng-input"
                    type="text"
                    placeholder="e.g. Sarah and James"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                  />
                </div>
                <div className="ng-field">
                  <label className="ng-label">
                    Client email
                    <span style={{ color: '#b8ae9e', fontFamily: "'Jost', sans-serif", textTransform: 'none', letterSpacing: 0, fontSize: '11px', fontWeight: 300, marginLeft: '6px' }}>optional</span>
                  </label>
                  <input
                    className="ng-input"
                    type="email"
                    placeholder="e.g. sarah@example.com"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Access */}
              <div className="ng-section">
                <div className="ng-section-head">
                  <span className="ng-section-label">Access</span>
                  <div className="ng-section-rule" />
                </div>
                <div className="ng-field">
                  <label className="ng-label">
                    Password
                    <span style={{ color: '#b8ae9e', fontFamily: "'Jost', sans-serif", textTransform: 'none', letterSpacing: 0, fontSize: '11px', fontWeight: 300, marginLeft: '6px' }}>optional</span>
                  </label>
                  <input
                    className="ng-input"
                    type="text"
                    placeholder="Leave blank for public access"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Film upload */}
              <div className="ng-section">
                <div className="ng-section-head">
                  <span className="ng-section-label">Film</span>
                  <div className="ng-section-rule" />
                </div>

                {/* Drop zone */}
                <div
                  className={`ng-drop${dragOver ? ' over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {/* Film strip icon */}
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

                {/* Upload progress */}
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
                    <div className="ng-progress-track">
                      <div className="ng-progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {message && (
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#b83232', marginBottom: '24px', lineHeight: 1.5 }}>
                  {message}
                </p>
              )}

              {/* Submit */}
              <button
                className="ng-submit"
                onClick={handleCreate}
                disabled={loading || !name || !clientName}
              >
                {loading ? (uploadStage || 'Please wait…') : 'Create Gallery'}
              </button>

            </div>

            {/* ── Tips panel ── */}
            <div className="ng-tips-col">
              <div style={{ marginBottom: '32px' }}>
                <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '20px', color: '#1a1410', marginBottom: '8px', lineHeight: 1.3 }}>
                  A few helpful notes
                </p>
                <div style={{ width: '28px', height: '1px', background: '#b5874a' }} />
              </div>

              <div className="ng-tip">
                <div className="ng-tip-label">Gallery name</div>
                <p className="ng-tip-body">Choose something your client will instantly recognise — usually their names and the occasion. This is the title they'll see when they open their link.</p>
              </div>

              <div className="ng-tip">
                <div className="ng-tip-label">Client details</div>
                <p className="ng-tip-body">Their name personalises the gallery experience. Adding an email means you can notify them the moment their film is ready — no chasing required.</p>
              </div>

              <div className="ng-tip">
                <div className="ng-tip-label">Password access</div>
                <p className="ng-tip-body">A password keeps the gallery private — ideal for wedding films and personal work. Leave it blank for a public link you can share freely or embed anywhere.</p>
              </div>

              <div className="ng-tip">
                <div className="ng-tip-label">Uploading your film</div>
                <p className="ng-tip-body">We use resumable chunked uploading, so large files are safe even on slower connections. You can also skip this step and add the film after the gallery is created.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

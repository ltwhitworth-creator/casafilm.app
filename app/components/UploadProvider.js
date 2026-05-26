'use client'
import { createContext, useContext, useState, useRef, useCallback } from 'react'
import { Upload } from 'tus-js-client'
import { supabase } from '../lib/supabase'

const UploadContext = createContext(null)

export function useUpload() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used within UploadProvider')
  return ctx
}

export function UploadProvider({ children }) {
  const [jobs, setJobs] = useState([])
  const tusMapRef = useRef({})
  const timerMapRef = useRef({})
  const cancelledMapRef = useRef({})

  const startUpload = useCallback(({ file, galleryId, title, type, thumbnailPreview }) => {
    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    cancelledMapRef.current[jobId] = false

    setJobs(prev => [...prev, {
      id: jobId,
      filename: file.name,
      progress: 0,
      status: 'uploading',
      thumbnailPreview: thumbnailPreview || null,
    }])

    let capturedUid = null
    const upload = new Upload(file, {
      endpoint: '/api/upload',
      chunkSize: 50 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: { filename: file.name, filetype: file.type },
      onAfterResponse(req, res) {
        const mediaId = res.getHeader('Stream-Media-Id')
        if (mediaId) capturedUid = mediaId
      },
      onProgress(bytesUploaded, bytesTotal) {
        if (cancelledMapRef.current[jobId]) return
        setJobs(prev => prev.map(j =>
          j.id === jobId ? { ...j, progress: Math.round((bytesUploaded / bytesTotal) * 100) } : j
        ))
      },
      async onSuccess() {
        if (cancelledMapRef.current[jobId]) return
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'processing' } : j))
        try {
          if (!capturedUid) throw new Error('No media ID returned from upload')
          if (type === 'legacy') {
            const { error } = await supabase.from('galleries').update({ video_uid: capturedUid }).eq('id', galleryId)
            if (error) throw error
          } else {
            const { data: existing, error: fetchErr } = await supabase
              .from('videos')
              .select('order')
              .eq('gallery_id', parseInt(galleryId))
              .order('order', { ascending: false })
              .limit(1)
            if (fetchErr) throw fetchErr
            const nextOrder = existing?.[0]?.order != null ? existing[0].order + 1 : 1
            const { error: insertErr } = await supabase.from('videos').insert({
              gallery_id: parseInt(galleryId),
              video_uid: capturedUid,
              title: title || 'Untitled Film',
              order: nextOrder,
            })
            if (insertErr) throw insertErr
          }
          window.dispatchEvent(new CustomEvent('cf-upload-complete', { detail: { galleryId } }))
        } catch (err) {
          if (cancelledMapRef.current[jobId]) return
          setJobs(prev => prev.map(j =>
            j.id === jobId ? { ...j, status: 'error', error: 'Save failed: ' + (err?.message || 'Unknown error') } : j
          ))
          return
        }
        if (cancelledMapRef.current[jobId]) return
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, progress: 100, status: 'complete' } : j))
        timerMapRef.current[jobId] = setTimeout(() => {
          if (cancelledMapRef.current[jobId]) return
          setJobs(prev => prev.filter(j => j.id !== jobId))
          delete timerMapRef.current[jobId]
          delete cancelledMapRef.current[jobId]
        }, 5000)
      },
      onError(err) {
        if (cancelledMapRef.current[jobId]) return
        setJobs(prev => prev.map(j =>
          j.id === jobId ? { ...j, status: 'error', error: err?.message || 'Upload failed' } : j
        ))
      },
    })
    tusMapRef.current[jobId] = upload
    upload.start()
    return jobId
  }, [])

  const cancelUpload = useCallback((jobId) => {
    if (cancelledMapRef.current[jobId] !== undefined) {
      cancelledMapRef.current[jobId] = true
    }
    tusMapRef.current[jobId]?.abort()
    delete tusMapRef.current[jobId]
    if (timerMapRef.current[jobId]) {
      clearTimeout(timerMapRef.current[jobId])
      delete timerMapRef.current[jobId]
    }
    setJobs(prev => prev.filter(j => j.id !== jobId))
  }, [])

  return (
    <UploadContext.Provider value={{ jobs, startUpload, cancelUpload }}>
      {children}
      <UploadStack jobs={jobs} onCancel={cancelUpload} />
    </UploadContext.Provider>
  )
}

function UploadStack({ jobs, onCancel }) {
  if (jobs.length === 0) return null
  return (
    <>
      <style>{`
        @keyframes cf-slideup {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: 10,
        alignItems: 'flex-end', pointerEvents: 'none',
      }}>
        {jobs.map(job => (
          <UploadCard key={job.id} job={job} onCancel={() => onCancel(job.id)} />
        ))}
      </div>
    </>
  )
}

function UploadCard({ job, onCancel }) {
  const isComplete  = job.status === 'complete'
  const isError     = job.status === 'error'
  const isProcess   = job.status === 'processing'
  const accentColor = isComplete ? '#4caf76' : isError ? '#b83232' : '#d4a865'

  return (
    <div style={{
      width: 320,
      background: '#1a1410',
      border: '1px solid rgba(212,168,101,0.18)',
      borderTop: `2px solid ${accentColor}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.75), 0 2px 8px rgba(0,0,0,0.4)',
      padding: '14px 16px 12px',
      animation: 'cf-slideup 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
      pointerEvents: 'auto',
    }}>

      {/* Top row: thumbnail / icon · filename · X */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        {job.thumbnailPreview ? (
          <img
            src={job.thumbnailPreview} alt=""
            style={{ width: 40, height: 28, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(212,168,101,0.25)' }}
          />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, opacity: 0.85 }}>
            <rect x="2" y="2" width="20" height="20" rx="2.5" />
            <line x1="7"  y1="2"  x2="7"  y2="22" />
            <line x1="17" y1="2"  x2="17" y2="22" />
            <line x1="2"  y1="12" x2="22" y2="12" />
            <line x1="2"  y1="7"  x2="7"  y2="7"  />
            <line x1="17" y1="7"  x2="22" y2="7"  />
            <line x1="2"  y1="17" x2="7"  y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
          </svg>
        )}
        <span style={{
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.05em',
          color: 'rgba(240,232,216,0.65)',
        }}>{job.filename}</span>
        {!isComplete && (
          <button
            onClick={onCancel}
            title={isError ? 'Dismiss' : 'Cancel'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1,
              color: 'rgba(240,232,216,0.28)', fontSize: '13px', padding: '2px 2px', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(240,232,216,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,232,216,0.28)'}
          >✕</button>
        )}
      </div>

      {/* Progress bar */}
      {!isComplete && !isError && (
        <div style={{
          width: '100%', height: '3px',
          background: 'rgba(212,168,101,0.12)', borderRadius: '2px', overflow: 'hidden',
          marginBottom: 8,
        }}>
          <div style={{
            height: '100%', background: '#d4a865', borderRadius: '2px',
            width: `${job.progress}%`, transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Status + percentage */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: "'DM Mono', monospace", fontSize: '10px',
        letterSpacing: '0.14em', textTransform: 'uppercase',
      }}>
        <span style={{
          color: isComplete ? '#4caf76'
               : isError   ? '#b83232'
               : isProcess  ? 'rgba(212,168,101,0.6)'
               :               'rgba(212,168,101,0.45)',
        }}>
          {isComplete ? 'Complete ✓'
           : isError   ? (job.error?.slice(0, 32) || 'Upload failed')
           : isProcess  ? 'Processing…'
           :               'Uploading…'}
        </span>
        {!isComplete && !isError && !isProcess && (
          <span style={{ color: '#d4a865' }}>{job.progress}%</span>
        )}
      </div>
    </div>
  )
}

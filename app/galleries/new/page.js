'use client'
import { useState } from 'react'
import { Upload } from 'tus-js-client'
import { supabase } from '../../lib/supabase'

export default function NewGallery() {
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [password, setPassword] = useState('')
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')
  const [message, setMessage] = useState('')

  async function handleCreate() {
    if (!name || !clientName) {
      setMessage('Please fill in all fields')
      return
    }

    setLoading(true)
    setMessage('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/login'
      return
    }

    let videoUid = null

    if (video) {
      try {
        setUploadStage('Uploading video...')
        setProgress(0)

        videoUid = await new Promise((resolve, reject) => {
          let capturedUid = null

          const upload = new Upload(video, {
            // Point at our own API — tus-js-client never touches Cloudflare directly
            endpoint: '/api/upload',
            chunkSize: 50 * 1024 * 1024, // 50 MB chunks
            retryDelays: [0, 3000, 5000, 10000, 20000],
            metadata: {
              filename: video.name,
              filetype: video.type,
            },
            // Capture the video UID from the creation response header
            onAfterResponse(req, res) {
              const mediaId = res.getHeader('Stream-Media-Id')
              if (mediaId) capturedUid = mediaId
            },
            onProgress(bytesUploaded, bytesTotal) {
              const percent = Math.round((bytesUploaded / bytesTotal) * 100)
              setProgress(percent)
            },
            onSuccess() {
              setProgress(100)
              setUploadStage('Video uploaded!')
              resolve(capturedUid)
            },
            onError(error) {
              reject(error)
            },
          })

          upload.start()
        })

      } catch (err) {
        setMessage('Video upload failed — ' + err.message)
        setLoading(false)
        return
      }
    }

    setUploadStage('Creating gallery...')

    const { error } = await supabase
      .from('galleries')
      .insert({
        name,
        client_name: clientName,
        password: password || null,
        user_id: session.user.id,
        video_uid: videoUid
      })

    if (error) {
      setMessage('Something went wrong — ' + error.message)
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div style={{ maxWidth: '520px', margin: '100px auto', padding: '40px' }}>
      <a href="/dashboard" style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', textDecoration: 'none', letterSpacing: '0.1em' }}>
        Back to dashboard
      </a>

      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '400', margin: '32px 0 8px' }}>
        Create a gallery
      </h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '40px' }}>
        Set up a new delivery gallery for your client
      </p>

      <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
        Gallery name
      </label>
      <input
        type="text"
        placeholder="e.g. Sarah and James Wedding Film"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ width: '100%', padding: '14px', marginBottom: '24px', fontSize: '15px', border: '1px solid #ddd', outline: 'none', fontFamily: 'inherit' }}
      />

      <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
        Client name
      </label>
      <input
        type="text"
        placeholder="e.g. Sarah and James"
        value={clientName}
        onChange={e => setClientName(e.target.value)}
        style={{ width: '100%', padding: '14px', marginBottom: '24px', fontSize: '15px', border: '1px solid #ddd', outline: 'none', fontFamily: 'inherit' }}
      />

      <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
        Client password <span style={{ color: '#bbb', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
      </label>
      <input
        type="text"
        placeholder="e.g. sarah2024"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: '14px', marginBottom: '8px', fontSize: '15px', border: '1px solid #ddd', outline: 'none', fontFamily: 'inherit' }}
      />
      <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#aaa', marginBottom: '32px', letterSpacing: '0.05em' }}>
        Leave blank to make the gallery publicly accessible
      </p>

      <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
        Video file (optional)
      </label>
      <input
        type="file"
        accept="video/*"
        onChange={e => setVideo(e.target.files[0])}
        style={{ width: '100%', padding: '14px', marginBottom: '8px', fontSize: '14px', border: '1px solid #ddd', fontFamily: 'inherit', background: '#fafafa' }}
      />
      <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#aaa', marginBottom: '40px', letterSpacing: '0.05em' }}>
        You can also add videos after creating the gallery
      </p>

      {loading && video && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', letterSpacing: '0.1em' }}>
              {uploadStage}
            </span>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#b5874a', fontWeight: '500' }}>
              {progress}%
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', background: '#eee', borderRadius: '2px' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#b5874a', borderRadius: '2px', transition: 'width 0.3s ease' }}></div>
          </div>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={loading || !name || !clientName}
        style={{ width: '100%', padding: '16px', background: loading ? '#888' : '#1a1410', color: '#f0e8d8', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}
      >
        {loading ? 'Please wait...' : 'Create Gallery'}
      </button>

      {message && (
        <p style={{ marginTop: '20px', color: '#c0392b', fontFamily: 'monospace', fontSize: '12px' }}>
          {message}
        </p>
      )}
    </div>
  )
}

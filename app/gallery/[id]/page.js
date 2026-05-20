'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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

  if (loading) return <p style={{ padding: '40px' }}>Loading...</p>
  if (!gallery) return <p style={{ padding: '40px' }}>Gallery not found</p>

  if (!unlocked) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1410', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '42px', color: '#f0e8d8', lineHeight: '0.9', marginBottom: '8px' }}>Casa</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '1px', background: '#b5874a' }}></div>
              <div style={{ fontFamily: 'monospace', fontSize: '8px', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#b5874a' }}>Film</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: '400', color: '#f0e8d8', marginBottom: '8px' }}>
            {gallery.name}
          </h1>
          <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '48px' }}>
            A film for {gallery.client_name}
          </p>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            style={{ width: '100%', padding: '16px', marginBottom: '12px', fontSize: '15px', border: '1px solid #333', background: '#111', color: '#f0e8d8', outline: 'none', textAlign: 'center', letterSpacing: '0.1em', fontFamily: 'inherit' }}
          />
          {error && <p style={{ color: '#c0392b', fontFamily: 'monospace', fontSize: '11px', marginBottom: '12px' }}>{error}</p>}
          <button
            onClick={handleUnlock}
            style={{ width: '100%', padding: '16px', background: '#b5874a', color: '#1a1410', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: '500' }}
          >
            View My Film
          </button>
        </div>
      </div>
    )
  }

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

        <div style={{ background: '#111', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', border: '1.5px solid rgba(181,135,74,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#b5874a', fontSize: '20px', paddingLeft: '4px' }}>
              ▶
            </div>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: '#444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Video player coming soon
            </p>
          </div>
        </div>

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
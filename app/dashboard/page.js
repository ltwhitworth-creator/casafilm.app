'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    async function getData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      setUser(session.user)
      const { data: galleries } = await supabase
        .from('galleries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setGalleries(galleries || [])
      setLoading(false)
    }
    getData()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
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

  if (loading) return <p style={{ padding: '40px' }}>Loading...</p>

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '400' }}>Casa Film</h1>
          <p style={{ color: '#888', marginTop: '8px', fontSize: '14px' }}>{user?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="/galleries/new" style={{ padding: '12px 28px', background: '#1a1410', color: '#f0e8d8', textDecoration: 'none', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>New Gallery</a>
          <button onClick={handleLogout} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #ddd', cursor: 'pointer', fontSize: '13px' }}>Log out</button>
        </div>
      </div>

      {galleries.length === 0 ? (
        <div style={{ background: '#f5f0e8', padding: '60px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '400', marginBottom: '16px' }}>No galleries yet</h2>
          <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>Create your first gallery to start delivering films to clients</p>
          <a href="/galleries/new" style={{ padding: '16px 40px', background: '#1a1410', color: '#f0e8d8', textDecoration: 'none', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'inline-block' }}>Create your first gallery</a>
        </div>
      ) : (
        <div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#aaa', marginBottom: '20px' }}>
            {galleries.length} {galleries.length === 1 ? 'gallery' : 'galleries'}
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {galleries.map(gallery => {
              const isDeleting = deleting === gallery.id
              return (
                <div key={gallery.id} style={{ border: '1px solid #e8e0d0', padding: '28px 32px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isDeleting ? 0.5 : 1 }}>
                  <div>
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '400', marginBottom: '6px' }}>{gallery.name}</h3>
                    <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#aaa', letterSpacing: '0.1em' }}>
                      Client: {gallery.client_name} · {gallery.password ? `Password: ${gallery.password}` : 'Public'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <a href={`/gallery/${gallery.id}`} style={{ padding: '10px 20px', border: '1px solid #ddd', textDecoration: 'none', color: '#1a1410', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>View</a>
                    <button
                      onClick={() => handleDelete(gallery)}
                      disabled={isDeleting}
                      style={{ padding: '10px 20px', border: '1px solid #e8d0d0', background: 'transparent', color: '#c0392b', cursor: isDeleting ? 'not-allowed' : 'pointer', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

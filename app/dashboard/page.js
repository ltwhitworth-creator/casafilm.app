'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
      } else {
        setUser(session.user)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return <p style={{ padding: '40px' }}>Loading...</p>

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: '400' }}>
            Welcome to Casa Film
          </h1>
          <p style={{ color: '#888', marginTop: '8px' }}>{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #ddd', cursor: 'pointer', fontSize: '14px' }}
        >
          Log out
        </button>
      </div>

      <div style={{ background: '#f5f0e8', padding: '60px', textAlign: 'center', borderRadius: '2px' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '400', marginBottom: '16px' }}>
          You have no galleries yet
        </h2>
        <p style={{ color: '#888', marginBottom: '32px' }}>
          Create your first gallery to start delivering films to clients
        </p>
        <button
          style={{ padding: '16px 40px', background: '#1a1410', color: '#f0e8d8', border: 'none', cursor: 'pointer', fontSize: '14px', letterSpacing: '0.1em' }}
        >
          Create your first gallery
        </button>
      </div>
    </div>
  )
}
'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function NewGallery() {
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleCreate() {
    setLoading(true)
    setMessage('')

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/login'
      return
    }

    const { error } = await supabase
      .from('galleries')
      .insert({
        name,
        client_name: clientName,
        password,
        user_id: session.user.id
      })

    if (error) {
      setMessage('Something went wrong — ' + error.message)
    } else {
      window.location.href = '/dashboard'
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '520px', margin: '100px auto', padding: '40px' }}>
      <a href="/dashboard" style={{ fontFamily: 'monospace', fontSize: '12px', color: '#888', textDecoration: 'none', letterSpacing: '0.1em' }}>
        ← Back to dashboard
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
        placeholder="e.g. Sarah & James Wedding Film"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ width: '100%', padding: '14px', marginBottom: '24px', fontSize: '15px', border: '1px solid #ddd', outline: 'none', fontFamily: 'inherit' }}
      />

      <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
        Client name
      </label>
      <input
        type="text"
        placeholder="e.g. Sarah & James"
        value={clientName}
        onChange={e => setClientName(e.target.value)}
        style={{ width: '100%', padding: '14px', marginBottom: '24px', fontSize: '15px', border: '1px solid #ddd', outline: 'none', fontFamily: 'inherit' }}
      />

      <label style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
        Client password
      </label>
      <input
        type="text"
        placeholder="e.g. sarah2024"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: '14px', marginBottom: '8px', fontSize: '15px', border: '1px solid #ddd', outline: 'none', fontFamily: 'inherit' }}
      />
      <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#aaa', marginBottom: '40px', letterSpacing: '0.05em' }}>
        Your client will use this to access their gallery
      </p>

      <button
        onClick={handleCreate}
        disabled={loading || !name || !clientName || !password}
        style={{ width: '100%', padding: '16px', background: loading ? '#888' : '#1a1410', color: '#f0e8d8', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}
      >
        {loading ? 'Creating...' : 'Create Gallery'}
      </button>

      {message && <p style={{ marginTop: '20px', color: '#c0392b', fontFamily: 'monospace', fontSize: '12px' }}>{message}</p>}
    </div>
  )
}
'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
     setMessage('Logged in successfully! Redirecting...')
window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '40px' }}>
      <h1>Log in to Casa Film</h1>
      <br />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '12px', fontSize: '16px' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '12px', fontSize: '16px' }}
      />
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ width: '100%', padding: '12px', background: '#1a1410', color: '#f0e8d8', fontSize: '16px', border: 'none', cursor: 'pointer' }}
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
      {message && <p style={{ marginTop: '20px', color: '#b5874a' }}>{message}</p>}
    </div>
  )
}
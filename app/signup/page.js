'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignUp() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email to confirm your account!')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '40px' }}>
      <h1>Create your Casa Film account</h1>
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
        onClick={handleSignUp}
        disabled={loading}
        style={{ width: '100%', padding: '12px', background: '#1a1410', color: '#f0e8d8', fontSize: '16px', border: 'none', cursor: 'pointer' }}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
      {message && <p style={{ marginTop: '20px', color: '#b5874a' }}>{message}</p>}
    </div>
  )
}

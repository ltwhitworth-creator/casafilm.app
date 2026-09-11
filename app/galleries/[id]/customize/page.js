'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

// Placeholder route + page shell for gallery customisation (fonts, colours,
// themes). The actual customisation UI is a future-session build — this
// just wires up the page so the dashboard grid has somewhere to send you.
export default function CustomizeGallery(props) {
  const [gallery, setGallery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function init() {
      const resolvedParams = await props.params
      const id = resolvedParams.id

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }

      const { data } = await supabase
        .from('galleries')
        .select('id, name')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single()

      if (!data) setNotFound(true)
      setGallery(data)
      setLoading(false)
    }
    init()
  }, [])

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Italiana&family=Archivo:wght@500;600&family=Albert+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{
        minHeight: '100vh',
        background: '#f5f0e8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Archivo', sans-serif", fontWeight: 600,
          fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: '#b5874a', marginBottom: '20px',
        }}>
          Gallery customisation
        </div>

        <h1 style={{
          fontFamily: "'Italiana', serif", fontWeight: 400,
          fontSize: 'clamp(28px, 4vw, 44px)', color: '#1a1410',
          marginBottom: '16px', lineHeight: 1.2, maxWidth: '640px',
        }}>
          {loading
            ? 'Loading…'
            : notFound
              ? 'Gallery not found'
              : `Customise ${gallery?.name || 'this gallery'}`}
        </h1>

        <p style={{
          fontFamily: "'Albert Sans', sans-serif", fontSize: '15px', fontWeight: 400,
          color: '#7a6e62', maxWidth: '460px', lineHeight: 1.7, marginBottom: '44px',
        }}>
          {notFound
            ? 'This gallery doesn’t exist or isn’t yours to edit.'
            : 'Fonts, colours, layout themes and branding controls for this gallery will live here in a future update. For now, this page is just a placeholder.'}
        </p>

        <Link href="/dashboard" style={{
          fontFamily: "'Archivo', sans-serif", fontWeight: 600,
          fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#1a1410', textDecoration: 'none',
          borderBottom: '1px solid #b5874a', paddingBottom: '4px',
        }}>
          ← Back to dashboard
        </Link>
      </div>
    </>
  )
}

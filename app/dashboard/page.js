'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { uploadCoverWithProgress } from '../lib/uploadCover'

const PLAN_LIMIT_BYTES = 100 * 1024 ** 3 // hardcoded Starter plan — swap for real plan tracking once Stripe plans exist

function getGreeting(email) {
  const hour = new Date().getHours()
  const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const name = email?.split('@')[0] ?? ''
  return `Good ${period}, ${name}`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Human-readable size for the small corner badge on each card, e.g. "2.4GB"
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return null
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let val = bytes
  let i = 0
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++ }
  const decimals = val < 10 && i > 0 ? 1 : 0
  return `${val.toFixed(decimals)}${units[i]}`
}

// Whole/one-decimal GB for the top storage bar, e.g. "42GB" or "2.4GB"
function formatGB(bytes) {
  const gb = bytes / 1024 ** 3
  return gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)
}

function StatusBadge({ tier }) {
  const label = tier === 'active' || !tier ? 'Active' : tier
  return (
    <span style={{
      fontFamily: "'Archivo', sans-serif", fontWeight: 600,
      fontSize: '9px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#b5874a',
      background: 'rgba(181,135,74,0.12)',
      padding: '4px 10px',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [galleries, setGalleries] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [videos, setVideos] = useState([])
  const [deletingVideo, setDeletingVideo] = useState(null)
  const [updatingCoverFor, setUpdatingCoverFor] = useState(null)
  const [settingThumbnailFor, setSettingThumbnailFor] = useState(null)
  const [uploadingThumbnailFor, setUploadingThumbnailFor] = useState(null)
  const [renamingVideoId, setRenamingVideoId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [savingRename, setSavingRename] = useState(false)
  // dragState tracks the currently-hovered drop target for visual feedback
  const [dragOverId, setDragOverId] = useState(null)
  const draggedIdRef = useRef(null)
  const coverInputRef = useRef(null)
  const thumbnailInputRef = useRef(null)

  // Folders / categories
  const [folders, setFolders] = useState([])
  const [folderFilter, setFolderFilter] = useState('all')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Per-card quick folder-reassignment popover (gallery id currently open, or null)
  const [openFolderPickerId, setOpenFolderPickerId] = useState(null)

  // The folder-options ("⋯") menu currently open, keyed by folder id
  const [openFolderMenuId, setOpenFolderMenuId] = useState(null)

  // Gallery-card drag-to-reorder
  const [galleryDragOverId, setGalleryDragOverId] = useState(null)
  const draggedGalleryIdRef = useRef(null)

  // Which cards have their "films in this gallery" list expanded
  const [expandedIds, setExpandedIds] = useState({})

  // Guards against re-fetching a video's size from Cloudflare more than
  // once per page load if it comes back empty (still processing, etc.)
  const triedSizeRef = useRef(new Set())

  useEffect(() => {
    async function getData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }
      setUser(session.user)
      const [{ data, error: galleriesError }, { data: foldersData, error: foldersError }] = await Promise.all([
        supabase.from('galleries').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('folders').select('*').eq('user_id', session.user.id).order('name', { ascending: true }),
      ])
      if (galleriesError) console.error('[dashboard] failed to load galleries:', galleriesError)
      if (foldersError) console.error('[dashboard] failed to load folders:', foldersError)
      setGalleries(data || [])
      setFolders(foldersData || [])
      const galleryIds = (data || []).map(g => g.id)
      if (galleryIds.length > 0) {
        const { data: vData } = await supabase
          .from('videos')
          .select('*')
          .in('gallery_id', galleryIds)
          .order('order', { ascending: true })
        setVideos(vData || [])
      }
      setLoading(false)
    }
    getData()
  }, [])

  useEffect(() => {
    async function onUploadComplete(e) {
      const gId = e.detail?.galleryId
      if (!gId) return
      const galleryIdInt = parseInt(gId)
      const [{ data: galleryRow }, { data: videosData }] = await Promise.all([
        supabase.from('galleries').select('*').eq('id', galleryIdInt).single(),
        supabase.from('videos').select('*').eq('gallery_id', galleryIdInt).order('order', { ascending: true }),
      ])
      if (galleryRow) {
        setGalleries(prev => {
          const exists = prev.some(g => g.id === galleryIdInt)
          if (exists) return prev.map(g => g.id === galleryIdInt ? { ...g, ...galleryRow } : g)
          return [galleryRow, ...prev]
        })
      }
      if (videosData) {
        setVideos(prev => [...prev.filter(v => v.gallery_id !== galleryIdInt), ...videosData])
      }
    }
    window.addEventListener('cf-upload-complete', onUploadComplete)
    return () => window.removeEventListener('cf-upload-complete', onUploadComplete)
  }, [])

  // Lazily backfill storage size for any video/legacy-video Cloudflare
  // hasn't been asked about yet this session, then cache it on the row.
  useEffect(() => {
    if (loading) return
    const legacyTargets = galleries
      .filter(g => g.video_uid && g.video_size_bytes == null && !triedSizeRef.current.has(`legacy-${g.id}`))
      .map(g => ({ key: `legacy-${g.id}`, kind: 'legacy', id: g.id, uid: g.video_uid }))
    const videoTargets = videos
      .filter(v => v.video_uid && v.size_bytes == null && !triedSizeRef.current.has(`video-${v.id}`))
      .map(v => ({ key: `video-${v.id}`, kind: 'video', id: v.id, uid: v.video_uid }))
    const targets = [...legacyTargets, ...videoTargets]
    if (targets.length === 0) return

    let cancelled = false
    async function run() {
      const BATCH = 4
      for (let i = 0; i < targets.length; i += BATCH) {
        if (cancelled) return
        const batch = targets.slice(i, i + BATCH)
        await Promise.all(batch.map(async t => {
          triedSizeRef.current.add(t.key)
          try {
            const res = await fetch(`/api/stream/${t.uid}`)
            if (!res.ok) return
            const data = await res.json()
            if (data.size == null) return
            if (t.kind === 'legacy') {
              setGalleries(prev => prev.map(g => g.id === t.id ? { ...g, video_size_bytes: data.size } : g))
              supabase.from('galleries').update({ video_size_bytes: data.size }).eq('id', t.id).then(() => {}, () => {})
            } else {
              setVideos(prev => prev.map(v => v.id === t.id ? { ...v, size_bytes: data.size } : v))
              supabase.from('videos').update({ size_bytes: data.size }).eq('id', t.id).then(() => {}, () => {})
            }
          } catch {}
        }))
      }
    }
    run()
    return () => { cancelled = true }
  }, [loading, galleries, videos])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleDeleteVideo(video) {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return
    setDeletingVideo(video.id)
    try {
      if (video.video_uid) {
        await fetch(`/api/stream/${video.video_uid}`, { method: 'DELETE' })
      }
      await supabase.from('videos').delete().eq('id', video.id)
      setVideos(prev => prev.filter(v => v.id !== video.id))
    } finally {
      setDeletingVideo(null)
    }
  }

  async function handleCoverChange(e) {
    const file = e.target.files[0]
    e.target.value = ''
    const galleryId = updatingCoverFor
    setUpdatingCoverFor(null)
    if (!file || !galleryId) return

    setGalleries(prev => prev.map(g =>
      g.id === galleryId ? { ...g, _coverUploading: true, _coverProgress: 0, _coverError: '' } : g
    ))

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const path = await uploadCoverWithProgress(file, session.access_token, (pct) => {
        setGalleries(prev => prev.map(g =>
          g.id === galleryId ? { ...g, _coverProgress: pct } : g
        ))
      })

      const { data: { publicUrl } } = supabase.storage.from('gallery-covers').getPublicUrl(path)
      await supabase.from('galleries').update({ cover_image_url: publicUrl }).eq('id', galleryId)
      setGalleries(prev => prev.map(g =>
        g.id === galleryId
          ? { ...g, cover_image_url: publicUrl, _coverUploading: false, _coverProgress: 100, _coverError: '' }
          : g
      ))
    } catch (err) {
      setGalleries(prev => prev.map(g =>
        g.id === galleryId
          ? { ...g, _coverUploading: false, _coverProgress: 0, _coverError: err.message || 'Upload failed' }
          : g
      ))
    }
  }

  async function handleDeleteLegacyVideo(gallery) {
    if (!confirm(`Delete the main video for "${gallery.name}"? This cannot be undone.`)) return
    setDeletingVideo(`legacy-${gallery.id}`)
    try {
      await fetch(`/api/stream/${gallery.video_uid}`, { method: 'DELETE' })
      await supabase.from('galleries').update({ video_uid: null }).eq('id', gallery.id)
      setGalleries(prev => prev.map(g => g.id === gallery.id ? { ...g, video_uid: null } : g))
    } finally {
      setDeletingVideo(null)
    }
  }

  async function handleDrop(targetVideoId, galleryId, galleryVideos) {
    const draggedId = draggedIdRef.current
    draggedIdRef.current = null
    setDragOverId(null)
    if (!draggedId || draggedId === targetVideoId) return

    const sorted = [...galleryVideos].sort((a, b) => a.order - b.order)
    const fromIdx = sorted.findIndex(v => v.id === draggedId)
    const toIdx   = sorted.findIndex(v => v.id === targetVideoId)
    if (fromIdx === -1 || toIdx === -1) return

    const reordered = [...sorted]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    const base = Math.min(...sorted.map(v => v.order))
    const updates = reordered.map((v, i) => ({ id: v.id, order: base + i }))

    // Optimistic UI update
    setVideos(prev => {
      const map = {}
      updates.forEach(u => { map[u.id] = u.order })
      return prev.map(v => map[v.id] !== undefined ? { ...v, order: map[v.id] } : v)
    })

    // Persist
    try {
      for (const u of updates) {
        await supabase.from('videos').update({ order: u.order }).eq('id', u.id)
      }
    } catch {}
  }

  // Gallery-card reordering. currentList is the currently-visible (already
  // filtered/sorted) array — only enabled while viewing "All galleries" so
  // reordering never has to interleave with hidden, filtered-out rows.
  async function handleGalleryDrop(targetId, currentList) {
    const draggedId = draggedGalleryIdRef.current
    draggedGalleryIdRef.current = null
    setGalleryDragOverId(null)
    if (!draggedId || draggedId === targetId) return

    const fromIdx = currentList.findIndex(g => g.id === draggedId)
    const toIdx = currentList.findIndex(g => g.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return

    const reordered = [...currentList]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const updates = reordered.map((g, i) => ({ id: g.id, order: i }))

    setGalleries(prev => prev.map(g => {
      const u = updates.find(u => u.id === g.id)
      return u ? { ...g, order: u.order } : g
    }))

    try {
      for (const u of updates) {
        await supabase.from('galleries').update({ order: u.order }).eq('id', u.id)
      }
    } catch {}
  }

  // Turns a Postgres/PostgREST error into something a non-technical user (and
  // future-me reading the console) can actually act on, instead of a generic
  // "something went wrong".
  function explainFolderError(error) {
    const msg = error?.message || ''
    if (error?.code === '42P01' || /relation .*folders.* does not exist/i.test(msg)) {
      return 'The "folders" table doesn\'t exist yet in your database. Run supabase/migrations/0001_dashboard_upgrades.sql in the Supabase SQL editor, then try again.'
    }
    if (error?.code === '42501' || /row-level security/i.test(msg)) {
      return 'Row-level security blocked this — the folders table\'s policies don\'t recognise you as the owner of this row. Check the folders RLS policies in Supabase match your auth setup.'
    }
    if (error?.code === '23503') {
      return 'That folder no longer exists (it may have been deleted). Refresh the page and try again.'
    }
    return msg || 'Unknown error — check the browser console for details.'
  }

  // Core insert, shared by the sidebar's inline composer and the prompt-based
  // quick-create used from the per-card folder picker.
  async function createFolderRow(rawName) {
    const trimmed = (rawName || '').trim()
    if (!trimmed) return null

    if (!user?.id) {
      console.error('[folders] createFolderRow: no authenticated user in state')
      alert('You need to be signed in to create a folder.')
      return null
    }

    const payload = { name: trimmed, user_id: user.id }
    console.log('[folders] creating folder', payload)

    // .select() (not .select().single()) so a 0-row response is data:[] we
    // can check for, rather than an exception-shaped PGRST116 error.
    const { data, error } = await supabase
      .from('folders')
      .insert(payload)
      .select()

    if (error) {
      console.error('[folders] insert failed:', error)
      alert(`Could not create the folder:\n\n${explainFolderError(error)}`)
      return null
    }

    const created = data?.[0]
    if (!created) {
      console.error('[folders] insert reported success but returned no row', { data })
      alert('The folder insert didn\'t return a row — it may not have been saved. Check the console and try refreshing.')
      return null
    }

    console.log('[folders] created folder', created)
    setFolders(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }

  // Prompt-based creation — used by the per-card folder picker's "+ New folder"
  async function handleCreateFolder() {
    const name = typeof window !== 'undefined' ? window.prompt('New folder name (e.g. "2026 Weddings"):') : null
    if (!name) return null
    return createFolderRow(name)
  }

  // Inline-input creation — used by the sidebar / mobile pill row composer
  async function submitNewFolder() {
    const created = await createFolderRow(newFolderName)
    setNewFolderName('')
    setIsCreatingFolder(false)
    if (created) setFolderFilter(created.id)
  }

  function cancelNewFolder() {
    setNewFolderName('')
    setIsCreatingFolder(false)
  }

  async function handleAssignFolder(galleryId, value) {
    if (value === '__new__') {
      const created = await handleCreateFolder()
      if (!created) return
      value = String(created.id)
    }
    const folderId = value === '' ? null : parseInt(value)
    const previousFolderId = galleries.find(g => g.id === galleryId)?.folder_id ?? null

    setGalleries(prev => prev.map(g => g.id === galleryId ? { ...g, folder_id: folderId } : g))

    const { error } = await supabase.from('galleries').update({ folder_id: folderId }).eq('id', galleryId)
    if (error) {
      console.error('[folders] failed to assign gallery to folder:', error)
      alert(`Could not save the folder assignment:\n\n${explainFolderError(error)}`)
      // Revert the optimistic update since it didn't actually persist
      setGalleries(prev => prev.map(g => g.id === galleryId ? { ...g, folder_id: previousFolderId } : g))
    }
  }

  async function handleDeleteFolder(folder) {
    setOpenFolderMenuId(null)
    if (!confirm(`Delete the folder "${folder.name}"? Galleries inside it won't be deleted — they'll just no longer be in a folder.`)) return

    console.log('[folders] deleting folder', folder)
    const { error } = await supabase.from('folders').delete().eq('id', folder.id)
    if (error) {
      console.error('[folders] delete failed:', error)
      alert(`Could not delete the folder:\n\n${explainFolderError(error)}`)
      return
    }

    console.log('[folders] deleted folder', folder.id)
    setFolders(prev => prev.filter(f => f.id !== folder.id))
    // Mirror the DB's ON DELETE SET NULL — galleries in this folder become unfiled
    setGalleries(prev => prev.map(g => g.folder_id === folder.id ? { ...g, folder_id: null } : g))
    setFolderFilter(prev => prev === folder.id ? 'all' : prev)
  }

  function toggleExpand(galleryId) {
    setExpandedIds(prev => ({ ...prev, [galleryId]: !prev[galleryId] }))
  }

  async function handleThumbnailChange(e) {
    const file = e.target.files[0]
    e.target.value = ''
    const targetId = settingThumbnailFor  // video id OR 'legacy-{galleryId}'
    setSettingThumbnailFor(null)
    if (!file || !targetId) return

    setUploadingThumbnailFor(targetId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const ext = file.name.split('.').pop() || 'jpg'
      const storagePath = `thumbnails/${session.user.id}/${targetId}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('gallery-covers')
        .upload(storagePath, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('gallery-covers').getPublicUrl(storagePath)

      if (String(targetId).startsWith('legacy-')) {
        const galleryId = parseInt(String(targetId).replace('legacy-', ''))
        await supabase.from('galleries').update({ thumbnail_url: publicUrl }).eq('id', galleryId)
        setGalleries(prev => prev.map(g => g.id === galleryId ? { ...g, thumbnail_url: publicUrl } : g))
      } else {
        await supabase.from('videos').update({ thumbnail_url: publicUrl }).eq('id', targetId)
        setVideos(prev => prev.map(v => v.id === targetId ? { ...v, thumbnail_url: publicUrl } : v))
      }
    } catch (err) {
      alert('Thumbnail upload failed: ' + (err.message || 'Unknown error'))
    } finally {
      setUploadingThumbnailFor(null)
    }
  }

  function startRename(id, currentTitle) {
    setRenamingVideoId(id)
    setRenameValue(currentTitle)
  }

  function cancelRename() {
    setRenamingVideoId(null)
    setRenameValue('')
  }

  async function saveRename(id) {
    const trimmed = renameValue.trim()
    if (!trimmed) { cancelRename(); return }
    setSavingRename(true)
    try {
      if (String(id).startsWith('legacy-')) {
        const gId = parseInt(String(id).replace('legacy-', ''))
        await supabase.from('galleries').update({ video_title: trimmed }).eq('id', gId)
        setGalleries(prev => prev.map(g => g.id === gId ? { ...g, video_title: trimmed } : g))
      } else {
        await supabase.from('videos').update({ title: trimmed }).eq('id', id)
        setVideos(prev => prev.map(v => v.id === id ? { ...v, title: trimmed } : v))
      }
      setRenamingVideoId(null)
      setRenameValue('')
    } catch {
      // keep input open so user can retry
    } finally {
      setSavingRename(false)
    }
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

  // ── Derived data ──────────────────────────────────────────────────────
  const sortedGalleries = useMemo(() => {
    return [...galleries].sort((a, b) => {
      const ao = a.order, bo = b.order
      if (ao != null && bo != null) return ao - bo
      if (ao != null) return -1
      if (bo != null) return 1
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [galleries])

  const visibleGalleries = useMemo(() => {
    if (folderFilter === 'all') return sortedGalleries
    return sortedGalleries.filter(g => g.folder_id === folderFilter)
  }, [sortedGalleries, folderFilter])

  function galleryBytes(gallery) {
    const legacy = gallery.video_uid ? (gallery.video_size_bytes || 0) : 0
    const own = videos
      .filter(v => v.gallery_id === gallery.id)
      .reduce((sum, v) => sum + (v.size_bytes || 0), 0)
    return legacy + own
  }

  const totalBytes = useMemo(
    () => galleries.reduce((sum, g) => sum + galleryBytes(g), 0),
    [galleries, videos]
  )
  const storagePercent = Math.min(100, (totalBytes / PLAN_LIMIT_BYTES) * 100)
  const isNearLimit = storagePercent >= 80

  const videoCount = galleries.filter(g => g.video_uid).length + videos.length

  if (loading) {
    return (
      <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Italiana&family=Archivo:wght@500;600&family=Albert+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Italiana', serif", fontSize: '40px', color: '#1a1410', lineHeight: 1, marginBottom: '8px' }}>Casa</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
              <div style={{ width: '36px', height: '1px', background: '#b5874a' }} />
              <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '8px', letterSpacing: '0.5em', color: '#b5874a', textTransform: 'uppercase' }}>Film</span>
            </div>
            <p style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '10px', letterSpacing: '0.2em', color: '#9a8e82', textTransform: 'uppercase' }}>Loading…</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Italiana&family=Archivo:wght@500;600&family=Albert+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        /* ── Nav ── */
        .dash-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #ffffff;
          border-bottom: 1px solid #b5874a;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 64px;
        }

        /* ── Storage bar ── */
        .dash-storagebar {
          background: #ffffff;
          border-bottom: 1px solid rgba(26,20,16,0.08);
          padding: 18px 40px;
        }
        .dash-storagebar-inner { max-width: 1320px; margin: 0 auto; }
        .dash-storagebar-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .dash-storagebar-label {
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: #9a8e82;
        }
        .dash-storagebar-value {
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 11px; letter-spacing: 0.05em;
          color: #1a1410;
        }
        .dash-storagebar-value.is-warning { color: #b83232; }
        .dash-storagebar-track {
          width: 100%; height: 6px;
          background: rgba(26,20,16,0.08);
          border-radius: 3px; overflow: hidden;
        }
        .dash-storagebar-fill {
          height: 100%; border-radius: 3px;
          transition: width 0.3s ease, background 0.3s ease;
        }

        /* ── Stat bar ── */
        .dash-statbar {
          background: #ffffff;
          border-bottom: 1px solid rgba(26,20,16,0.08);
          display: flex;
          align-items: stretch;
        }
        .dash-stat {
          flex: 1;
          padding: 16px 32px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-right: 1px solid rgba(26,20,16,0.08);
        }
        .dash-stat:last-child { border-right: none; }

        /* ── Toolbar (gallery count + new gallery) ── */
        .dash-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        /* ── Sidebar + main split ── */
        .dash-body {
          max-width: 1360px;
          margin: 0 auto;
          padding: 48px 40px;
          display: flex;
          align-items: flex-start;
          gap: 32px;
        }
        .dash-main { flex: 1; min-width: 0; }

        .dash-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: #f0e8d8;
          border: 1px solid rgba(26,20,16,0.08);
          border-radius: 4px;
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          position: sticky;
          top: 82px;
        }
        .dash-sidebar-label {
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
          color: #9a8e82;
          padding: 4px 12px 10px;
        }
        .dash-sidebar-item {
          display: block;
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          border-left: 2px solid transparent;
          cursor: pointer;
          padding: 9px 12px;
          border-radius: 2px;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
          color: #7a6e62;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .dash-sidebar-item:hover { background: rgba(26,20,16,0.04); color: #1a1410; }
        .dash-sidebar-item.is-active {
          background: rgba(181,135,74,0.16);
          border-left-color: #b5874a;
          color: #1a1410;
        }

        /* Folder row — the item button plus its "⋯" options menu */
        .dash-sidebar-row { position: relative; display: flex; align-items: center; }
        .dash-sidebar-row .dash-sidebar-item { flex: 1; min-width: 0; }
        .dash-folder-menu-btn {
          flex-shrink: 0;
          background: none; border: none; cursor: pointer;
          padding: 6px 10px;
          font-size: 13px; line-height: 1;
          color: #b0a89c;
          opacity: 0;
          transition: opacity 0.15s, color 0.15s;
        }
        .dash-sidebar-row:hover .dash-folder-menu-btn,
        .dash-pill-group .dash-folder-menu-btn,
        .dash-folder-menu-btn.is-open { opacity: 1; }
        .dash-folder-menu-btn:hover { color: #1a1410; }
        .dash-folder-menu {
          position: absolute;
          top: 32px; right: 4px;
          z-index: 11;
          min-width: 150px;
          background: #ffffff;
          border: 1px solid rgba(26,20,16,0.12);
          box-shadow: 0 6px 20px rgba(26,20,16,0.18);
          padding: 4px;
        }
        .dash-folder-menu-item {
          display: block;
          width: 100%;
          text-align: left;
          background: none; border: none; cursor: pointer;
          padding: 8px 10px;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase;
          color: #b83232;
          transition: background 0.12s;
        }
        .dash-folder-menu-item:hover { background: rgba(184,50,50,0.08); }

        .dash-sidebar-new-btn {
          display: block;
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          border-top: 1px solid rgba(26,20,16,0.1);
          cursor: pointer;
          margin-top: 8px;
          padding: 12px 12px 4px;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
          color: #b5874a;
          transition: color 0.15s;
        }
        .dash-sidebar-new-btn:hover { color: #1a1410; }

        /* ── Folder create composer (sidebar + mobile pill row) ── */
        .dash-folder-composer {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(26,20,16,0.1);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dash-folder-composer-input {
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(26,20,16,0.18);
          padding: 8px 10px;
          font-family: 'Albert Sans', sans-serif;
          font-size: 12px;
          color: #1a1410;
          outline: none;
          box-sizing: border-box;
        }
        .dash-folder-composer-input:focus { border-color: #b5874a; }
        .dash-folder-composer-actions { display: flex; gap: 6px; }
        .dash-folder-composer-save,
        .dash-folder-composer-cancel {
          flex: 1;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 7px 0;
          cursor: pointer;
          border: 1px solid rgba(26,20,16,0.16);
          background: transparent;
          color: #1a1410;
          transition: background 0.15s;
        }
        .dash-folder-composer-save { background: #1a1410; color: #f0e8d8; border-color: #1a1410; }
        .dash-folder-composer-save:hover { background: #2e261d; }
        .dash-folder-composer-cancel:hover { background: rgba(26,20,16,0.05); }

        /* ── Mobile pill row (replaces sidebar below the breakpoint) ── */
        .dash-pill-row {
          display: none;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 14px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(26,20,16,0.08);
        }
        .dash-pill {
          flex-shrink: 0;
          white-space: nowrap;
          background: #ffffff;
          border: 1px solid rgba(26,20,16,0.14);
          border-radius: 20px;
          padding: 8px 16px;
          cursor: pointer;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
          color: #7a6e62;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .dash-pill.is-active {
          background: rgba(181,135,74,0.16);
          border-color: #b5874a;
          color: #1a1410;
        }
        .dash-pill-new { color: #b5874a; border-style: dashed; }

        /* Folder pill with its "⋯" options menu attached (mobile) */
        .dash-pill-group {
          position: relative;
          flex-shrink: 0;
          display: flex;
          align-items: stretch;
          background: #ffffff;
          border: 1px solid rgba(26,20,16,0.14);
          border-radius: 20px;
          transition: background 0.15s, border-color 0.15s;
        }
        .dash-pill-group.is-active { background: rgba(181,135,74,0.16); border-color: #b5874a; }
        .dash-pill-group .dash-pill {
          border: none;
          background: none;
          border-radius: 20px 0 0 20px;
          padding: 8px 4px 8px 16px;
        }
        .dash-pill-group .dash-folder-menu-btn { padding: 8px 14px 8px 2px; }

        .dash-folder-composer-pill {
          flex-shrink: 0;
          flex-direction: row;
          align-items: center;
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }
        .dash-folder-composer-pill .dash-folder-composer-input { width: 140px; }

        /* ── Per-card quick folder picker (hover icon on the tile) ── */
        .dash-tile-folder-btn {
          position: absolute;
          top: 10px; left: 10px;
          z-index: 5;
          width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(26,20,16,0.55);
          border: none;
          cursor: pointer;
          color: #f0e8d8;
          opacity: 0;
          transition: opacity 0.15s, background 0.15s;
        }
        .dash-gcard:hover .dash-tile-folder-btn,
        .dash-tile-folder-btn.is-open { opacity: 1; }
        .dash-tile-folder-btn:hover { background: rgba(26,20,16,0.85); }
        .dash-picker-overlay {
          position: fixed; inset: 0; z-index: 10; background: transparent;
        }
        .dash-folder-picker {
          position: absolute;
          top: 42px; left: 10px;
          z-index: 11;
          min-width: 170px;
          background: #ffffff;
          border: 1px solid rgba(26,20,16,0.12);
          box-shadow: 0 6px 20px rgba(26,20,16,0.18);
          padding: 6px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .dash-folder-picker-item {
          display: block;
          width: 100%;
          text-align: left;
          background: none; border: none; cursor: pointer;
          padding: 8px 10px;
          border-radius: 2px;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase;
          color: #5a4e42;
          transition: background 0.12s, color 0.12s;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .dash-folder-picker-item:hover { background: rgba(181,135,74,0.1); color: #1a1410; }
        .dash-folder-picker-item.is-active { background: rgba(181,135,74,0.16); color: #1a1410; }
        .dash-folder-picker-new {
          border-top: 1px solid rgba(26,20,16,0.08);
          margin-top: 4px; padding-top: 8px;
          color: #b5874a;
        }
        .dash-folder-picker-new:hover { color: #1a1410; }

        /* ── Gallery grid ── */
        .dash-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px;
        }
        @media (max-width: 1180px) { .dash-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 860px)  { .dash-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px)  { .dash-grid { grid-template-columns: 1fr; } }

        .dash-gcard {
          position: relative;
          background: #ffffff;
          box-shadow: 0 1px 4px rgba(26,20,16,0.06), 0 4px 20px rgba(26,20,16,0.04);
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .dash-gcard:hover {
          box-shadow: 0 2px 10px rgba(26,20,16,0.09), 0 8px 28px rgba(26,20,16,0.07);
        }
        .dash-gcard.is-deleting { opacity: 0.45; pointer-events: none; }

        /* ── Netflix-style square tile ── */
        .dash-tile {
          position: relative;
          aspect-ratio: 1;
          width: 100%;
          background-color: #1a1410;
          background-size: cover;
          background-position: center;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.15s;
        }
        .dash-tile:hover { transform: scale(1.015); }
        .dash-tile.is-dragging { opacity: 0.35; }
        .dash-tile.is-drag-over { box-shadow: inset 0 0 0 3px #b5874a; }
        .dash-tile-noimg {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #221a13, #1a1410 65%);
          display: flex; align-items: center; justify-content: center;
        }
        .dash-tile-noimg span {
          font-family: 'Italiana', serif; font-size: 16px;
          color: rgba(240,232,216,0.22); letter-spacing: 0.04em;
        }
        .dash-tile-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(26,20,16,0) 38%, rgba(26,20,16,0.9) 100%);
        }
        .dash-tile-storage {
          position: absolute; top: 10px; right: 10px;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 9px; letter-spacing: 0.06em;
          color: #f0e8d8; background: rgba(26,20,16,0.55);
          padding: 4px 7px;
        }
        .dash-tile-info { position: absolute; left: 14px; right: 14px; bottom: 12px; }
        .dash-tile-name {
          font-family: 'Italiana', serif; font-size: 18px; font-weight: 400;
          color: #f0e8d8; line-height: 1.2; margin-bottom: 3px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .dash-tile-client {
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(240,232,216,0.72);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ── Card footer (non-draggable, non-navigating) ── */
        .dash-gcard-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 10px; }
        .dash-gcard-meta-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .dash-gcard-folder-label {
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 9px; letter-spacing: 0.05em; text-transform: uppercase;
          color: #b0a89c;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;
        }
        .dash-gcard-sub {
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 9px; letter-spacing: 0.05em;
          color: #b0a89c; margin: 0;
        }

        /* ── Card actions ── */
        .dash-card-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .dash-btn-sm { padding: 6px 10px; font-size: 8px; }

        /* ── Video list within card ── */
        .dash-expand-btn {
          background: none; border: none; cursor: pointer; padding: 4px 0;
          text-align: left;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
          color: #9a8e82; transition: color 0.15s;
        }
        .dash-expand-btn:hover { color: #1a1410; }
        .dash-video-list {
          border-top: 1px solid rgba(26,20,16,0.07);
          padding-top: 12px;
        }
        .dash-video-list-label {
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 8px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #c0b8ae;
          margin-bottom: 8px;
        }
        .dash-video-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 0;
          border-bottom: 1px solid rgba(26,20,16,0.05);
          flex-wrap: wrap;
        }
        .dash-video-row:last-child { border-bottom: none; }
        .dash-video-num {
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 9px;
          color: #b5874a;
          letter-spacing: 0.06em;
          flex-shrink: 0;
          width: 18px;
        }
        .dash-video-name {
          flex: 1;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 10px;
          color: #5a4e42;
          letter-spacing: 0.05em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 60px;
        }
        .dash-video-size {
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 8px;
          color: #c0b8ae;
          flex-shrink: 0;
        }
        .dash-video-del {
          background: none;
          border: 1px solid rgba(184,50,50,0.22);
          color: #b83232;
          cursor: pointer;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 8px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 5px 10px;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s;
        }
        .dash-video-del:hover:not(:disabled) {
          background: rgba(184,50,50,0.05);
          border-color: rgba(184,50,50,0.38);
        }
        .dash-video-del:disabled { opacity: 0.4; cursor: not-allowed; }

        .dash-video-drag-handle {
          cursor: grab;
          color: #c0b8ae;
          padding: 2px 5px 2px 2px;
          flex-shrink: 0;
          user-select: none;
          display: flex;
          align-items: center;
          opacity: 0.5;
          transition: opacity 0.15s;
        }
        .dash-video-drag-handle:active { cursor: grabbing; }
        .dash-video-row:hover .dash-video-drag-handle { opacity: 1; }
        .dash-video-row.is-dragging {
          opacity: 0.32;
          background: rgba(181,135,74,0.03);
        }
        .dash-video-row.is-drag-over {
          box-shadow: 0 -2px 0 0 #b5874a;
        }

        .dash-video-main-badge {
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 8px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #b5874a;
          background: rgba(181,135,74,0.08);
          border: 1px solid rgba(181,135,74,0.22);
          padding: 4px 8px;
          flex-shrink: 0;
          pointer-events: none;
        }
        .dash-video-pencil-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 5px;
          color: #c0b8ae;
          flex-shrink: 0;
          transition: color 0.15s;
          line-height: 1;
        }
        .dash-video-pencil-btn:hover { color: #b5874a; }
        .dash-video-rename-input {
          flex: 1;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(181,135,74,0.4);
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 10px;
          color: #1a1410;
          letter-spacing: 0.05em;
          padding: 2px 0;
          outline: none;
          min-width: 60px;
          transition: border-color 0.15s;
        }
        .dash-video-rename-input:focus { border-bottom-color: #b5874a; }
        .dash-video-rename-input:disabled { opacity: 0.5; }

        .dash-video-thumb-btn {
          background: none;
          border: 1px solid rgba(26,20,16,0.16);
          color: #7a6e62;
          cursor: pointer;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 8px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 9px;
          flex-shrink: 0;
          transition: background 0.15s, border-color 0.15s;
        }
        .dash-video-thumb-btn:hover:not(:disabled) {
          background: rgba(26,20,16,0.04);
          border-color: rgba(26,20,16,0.28);
          color: #1a1410;
        }
        .dash-video-thumb-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Cover upload progress ── */
        .dash-cover-progress {
          border-top: 1px solid rgba(26,20,16,0.07);
          padding-top: 10px;
        }

        /* ── Buttons ── */
        .dash-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 9px 16px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s, opacity 0.15s;
        }
        .dash-btn-dark {
          background: #1a1410;
          color: #f0e8d8;
        }
        .dash-btn-dark:hover {
          background: #2e261d;
        }
        .dash-btn-outline {
          background: transparent;
          color: #1a1410;
          border: 1px solid rgba(26,20,16,0.18);
        }
        .dash-btn-outline:hover {
          border-color: rgba(26,20,16,0.4);
          background: rgba(26,20,16,0.03);
        }
        .dash-btn-muted {
          color: #c0b8ae;
          border-color: rgba(26,20,16,0.1);
          cursor: not-allowed;
        }
        .dash-btn-muted:hover {
          background: transparent;
          border-color: rgba(26,20,16,0.1);
        }
        .dash-btn-danger {
          background: transparent;
          color: #b83232;
          border: 1px solid rgba(184,50,50,0.25);
        }
        .dash-btn-danger:hover:not(:disabled) {
          background: rgba(184,50,50,0.05);
          border-color: rgba(184,50,50,0.4);
        }
        .dash-btn-danger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .dash-logout-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #9a8e82;
          padding: 4px 0;
          text-transform: uppercase;
          transition: color 0.15s;
        }
        .dash-logout-btn:hover { color: #1a1410; }

        /* ── New gallery CTA in empty state ── */
        .dash-empty-btn {
          display: inline-block;
          padding: 16px 48px;
          background: #1a1410;
          color: #f0e8d8;
          text-decoration: none;
          font-family: 'Archivo', sans-serif; font-weight: 600;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          transition: background 0.2s;
        }
        .dash-empty-btn:hover { background: #2e261d; }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .dash-sidebar { display: none; }
          .dash-pill-row { display: flex; }
        }
        @media (max-width: 768px) {
          .dash-nav { padding: 0 20px; }
          .dash-storagebar { padding: 14px 20px; }
          .dash-stat { padding: 12px 20px; }
          .dash-body { padding: 32px 20px; }
        }
        @media (max-width: 480px) {
          .dash-statbar { flex-wrap: wrap; }
          .dash-stat { flex: 1 1 50%; border-right: none; border-bottom: 1px solid rgba(26,20,16,0.08); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f5f0e8' }}>

        {/* Hidden cover image input */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleCoverChange}
        />

        {/* Hidden thumbnail input */}
        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleThumbnailChange}
        />

        {/* ── Navigation ── */}
        <nav className="dash-nav">
          {/* Logo — links home */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: "'Italiana', serif", fontSize: '26px', color: '#1a1410', lineHeight: 1, marginBottom: '3px' }}>
              Casa
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '24px', height: '1px', background: '#b5874a' }} />
              <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '7px', letterSpacing: '0.5em', color: '#b5874a', textTransform: 'uppercase' }}>Film</span>
            </div>
          </Link>

          {/* User + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '10px', color: '#9a8e82', letterSpacing: '0.05em' }}>
              {user?.email}
            </span>
            <button className="dash-logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </nav>

        {/* ── Total storage bar ── */}
        <div className="dash-storagebar">
          <div className="dash-storagebar-inner">
            <div className="dash-storagebar-row">
              <span className="dash-storagebar-label">Storage</span>
              <span className={`dash-storagebar-value${isNearLimit ? ' is-warning' : ''}`}>
                {formatGB(totalBytes)}GB of {formatGB(PLAN_LIMIT_BYTES)}GB used
              </span>
            </div>
            <div className="dash-storagebar-track">
              <div
                className="dash-storagebar-fill"
                style={{ width: `${storagePercent}%`, background: isNearLimit ? '#b83232' : '#b5874a' }}
              />
            </div>
          </div>
        </div>

        {/* ── Stat bar ── */}
        <div className="dash-statbar">
          <div className="dash-stat">
            <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a8e82' }}>Galleries</span>
            <span style={{ fontFamily: "'Italiana', serif", fontSize: '26px', color: '#1a1410', lineHeight: 1 }}>{galleries.length}</span>
          </div>
          <div className="dash-stat">
            <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a8e82' }}>Videos uploaded</span>
            <span style={{ fontFamily: "'Italiana', serif", fontSize: '26px', color: '#1a1410', lineHeight: 1 }}>{videoCount}</span>
          </div>
          <div className="dash-stat">
            <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9a8e82' }}>Storage used</span>
            <span style={{ fontFamily: "'Italiana', serif", fontSize: '26px', color: '#1a1410', lineHeight: 1 }}>{formatGB(totalBytes)}GB</span>
          </div>
        </div>

        {/* ── Sidebar + main content ── */}
        <div className="dash-body">

          {/* ── Folder sidebar (desktop/tablet) ── */}
          <aside className="dash-sidebar">
            <div className="dash-sidebar-label">Folders</div>
            <button
              className={`dash-sidebar-item${folderFilter === 'all' ? ' is-active' : ''}`}
              onClick={() => setFolderFilter('all')}
            >
              All Galleries
            </button>
            {folders.map(f => (
              <div className="dash-sidebar-row" key={f.id}>
                <button
                  className={`dash-sidebar-item${folderFilter === f.id ? ' is-active' : ''}`}
                  onClick={() => setFolderFilter(f.id)}
                  title={f.name}
                >
                  {f.name}
                </button>
                <button
                  className={`dash-folder-menu-btn${openFolderMenuId === f.id ? ' is-open' : ''}`}
                  onClick={() => setOpenFolderMenuId(prev => prev === f.id ? null : f.id)}
                  title="Folder options"
                >
                  ⋯
                </button>
                {openFolderMenuId === f.id && (
                  <>
                    <div className="dash-picker-overlay" onClick={() => setOpenFolderMenuId(null)} />
                    <div className="dash-folder-menu">
                      <button className="dash-folder-menu-item" onClick={() => handleDeleteFolder(f)}>
                        Delete folder
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {isCreatingFolder ? (
              <div className="dash-folder-composer">
                <input
                  autoFocus
                  className="dash-folder-composer-input"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submitNewFolder()
                    if (e.key === 'Escape') cancelNewFolder()
                  }}
                  placeholder="Folder name…"
                />
                <div className="dash-folder-composer-actions">
                  <button className="dash-folder-composer-save" onClick={submitNewFolder}>Add</button>
                  <button className="dash-folder-composer-cancel" onClick={cancelNewFolder}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="dash-sidebar-new-btn" onClick={() => setIsCreatingFolder(true)}>
                + New Folder
              </button>
            )}
          </aside>

          <div className="dash-main">

            {/* ── Folder pills (mobile — replaces sidebar) ── */}
            <div className="dash-pill-row">
              <button
                className={`dash-pill${folderFilter === 'all' ? ' is-active' : ''}`}
                onClick={() => setFolderFilter('all')}
              >
                All Galleries
              </button>
              {folders.map(f => (
                <div className={`dash-pill-group${folderFilter === f.id ? ' is-active' : ''}`} key={f.id}>
                  <button className="dash-pill" onClick={() => setFolderFilter(f.id)}>
                    {f.name}
                  </button>
                  <button
                    className={`dash-folder-menu-btn${openFolderMenuId === f.id ? ' is-open' : ''}`}
                    onClick={() => setOpenFolderMenuId(prev => prev === f.id ? null : f.id)}
                    title="Folder options"
                  >
                    ⋯
                  </button>
                  {openFolderMenuId === f.id && (
                    <>
                      <div className="dash-picker-overlay" onClick={() => setOpenFolderMenuId(null)} />
                      <div className="dash-folder-menu">
                        <button className="dash-folder-menu-item" onClick={() => handleDeleteFolder(f)}>
                          Delete folder
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {isCreatingFolder ? (
                <div className="dash-folder-composer dash-folder-composer-pill">
                  <input
                    autoFocus
                    className="dash-folder-composer-input"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') submitNewFolder()
                      if (e.key === 'Escape') cancelNewFolder()
                    }}
                    placeholder="Folder name…"
                  />
                  <button className="dash-folder-composer-save" onClick={submitNewFolder}>Add</button>
                  <button className="dash-folder-composer-cancel" onClick={cancelNewFolder}>✕</button>
                </div>
              ) : (
                <button className="dash-pill dash-pill-new" onClick={() => setIsCreatingFolder(true)}>
                  + New
                </button>
              )}
            </div>

            {/* Welcome */}
            <div style={{ marginBottom: '40px' }}>
              <h1 style={{ fontFamily: "'Italiana', serif", fontSize: '36px', fontWeight: 400, color: '#1a1410', marginBottom: '6px', lineHeight: 1.2 }}>
                {getGreeting(user?.email)}
              </h1>
              <p style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9a8e82' }}>
                Your galleries
              </p>
            </div>

            {/* Empty state */}
            {galleries.length === 0 ? (
              <div style={{ background: '#ffffff', boxShadow: '0 1px 4px rgba(26,20,16,0.05)', padding: '80px 40px', textAlign: 'center' }}>
                {/* Logo mark */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ fontFamily: "'Italiana', serif", fontSize: '52px', color: '#1a1410', lineHeight: 1, marginBottom: '8px' }}>
                    Casa
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                    <div style={{ width: '40px', height: '1px', background: '#b5874a' }} />
                    <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '8px', letterSpacing: '0.5em', color: '#b5874a', textTransform: 'uppercase' }}>Film</span>
                    <div style={{ width: '40px', height: '1px', background: '#b5874a' }} />
                  </div>
                </div>

                <h2 style={{ fontFamily: "'Italiana', serif", fontSize: '28px', fontWeight: 400, color: '#1a1410', marginBottom: '12px' }}>
                  No galleries yet
                </h2>
                <p style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: '15px', color: '#7a6e62', fontWeight: 400, marginBottom: '40px', maxWidth: '380px', margin: '0 auto 40px', lineHeight: 1.7 }}>
                  Create your first gallery to start delivering films to your clients in a way they&apos;ll remember.
                </p>
                <a href="/galleries/new" className="dash-empty-btn">
                  Create your first gallery
                </a>
              </div>
            ) : (
              <>
                {/* Toolbar: count + new gallery */}
                <div className="dash-toolbar">
                  <p style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9a8e82', margin: 0 }}>
                    {visibleGalleries.length} {visibleGalleries.length === 1 ? 'gallery' : 'galleries'}
                  </p>
                  <a href="/galleries/new" className="dash-btn dash-btn-dark">
                    New Gallery
                  </a>
                </div>

                {visibleGalleries.length === 0 ? (
                <div style={{ background: '#ffffff', boxShadow: '0 1px 4px rgba(26,20,16,0.05)', padding: '56px 40px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: '14px', color: '#7a6e62', marginBottom: '18px' }}>
                    No galleries in this folder yet.
                  </p>
                  <button className="dash-btn dash-btn-outline" onClick={() => setFolderFilter('all')}>
                    Show all galleries
                  </button>
                </div>
              ) : (
                <div className="dash-grid">
                  {visibleGalleries.map(gallery => {
                    const isDeleting  = deleting === gallery.id
                    const hasEmail    = Boolean(gallery.client_email)
                    const isExpanded  = Boolean(expandedIds[gallery.id])
                    const isDragging  = draggedGalleryIdRef.current === gallery.id
                    const isDragOver  = galleryDragOverId === gallery.id
                    const canDrag     = folderFilter === 'all'
                    const galleryVideos = videos.filter(v => v.gallery_id === gallery.id).sort((a, b) => a.order - b.order)
                    const filmCount = (gallery.video_uid ? 1 : 0) + galleryVideos.length
                    const bytes = galleryBytes(gallery)
                    const sizeLabel = formatBytes(bytes)

                    return (
                      <div key={gallery.id} className={`dash-gcard${isDeleting ? ' is-deleting' : ''}`}>

                        {/* ── Square tile: cover image, overlay, click → customise, drag → reorder ── */}
                        <div
                          className={`dash-tile${isDragging ? ' is-dragging' : ''}${isDragOver ? ' is-drag-over' : ''}`}
                          draggable={canDrag}
                          onClick={() => router.push(`/galleries/${gallery.id}/customize`)}
                          onDragStart={e => {
                            if (!canDrag) return
                            draggedGalleryIdRef.current = gallery.id
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragOver={e => {
                            if (!canDrag) return
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            if (draggedGalleryIdRef.current && draggedGalleryIdRef.current !== gallery.id) {
                              setGalleryDragOverId(gallery.id)
                            }
                          }}
                          onDragLeave={() => setGalleryDragOverId(prev => prev === gallery.id ? null : prev)}
                          onDrop={e => { e.preventDefault(); if (canDrag) handleGalleryDrop(gallery.id, visibleGalleries) }}
                          onDragEnd={() => { draggedGalleryIdRef.current = null; setGalleryDragOverId(null) }}
                          style={gallery.cover_image_url ? { backgroundImage: `url(${gallery.cover_image_url})` } : undefined}
                          title="Open customisation"
                        >
                          {!gallery.cover_image_url && (
                            <div className="dash-tile-noimg"><span>CASA FILM</span></div>
                          )}
                          <div className="dash-tile-overlay" />
                          {sizeLabel && <span className="dash-tile-storage">{sizeLabel}</span>}
                          <div className="dash-tile-info">
                            <div className="dash-tile-name">{gallery.name}</div>
                            <div className="dash-tile-client">{gallery.client_name}</div>
                          </div>
                        </div>

                        {/* Quick folder-reassignment icon — appears on card hover, lives
                            outside the tile so it's never caught by the tile's own
                            click-to-navigate or drag-to-reorder handlers. */}
                        <button
                          className={`dash-tile-folder-btn${openFolderPickerId === gallery.id ? ' is-open' : ''}`}
                          onClick={() => setOpenFolderPickerId(prev => prev === gallery.id ? null : gallery.id)}
                          title="Move to folder"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                          </svg>
                        </button>
                        {openFolderPickerId === gallery.id && (
                          <>
                            <div className="dash-picker-overlay" onClick={() => setOpenFolderPickerId(null)} />
                            <div className="dash-folder-picker">
                              <button
                                className={`dash-folder-picker-item${!gallery.folder_id ? ' is-active' : ''}`}
                                onClick={() => { handleAssignFolder(gallery.id, ''); setOpenFolderPickerId(null) }}
                              >
                                No folder
                              </button>
                              {folders.map(f => (
                                <button
                                  key={f.id}
                                  className={`dash-folder-picker-item${gallery.folder_id === f.id ? ' is-active' : ''}`}
                                  onClick={() => { handleAssignFolder(gallery.id, String(f.id)); setOpenFolderPickerId(null) }}
                                >
                                  {f.name}
                                </button>
                              ))}
                              <button
                                className="dash-folder-picker-item dash-folder-picker-new"
                                onClick={async () => { await handleAssignFolder(gallery.id, '__new__'); setOpenFolderPickerId(null) }}
                              >
                                + New folder…
                              </button>
                            </div>
                          </>
                        )}

                        {/* ── Footer: everything interactive lives here, separate from the tile ── */}
                        <div className="dash-gcard-body">
                          <div className="dash-gcard-meta-row">
                            <StatusBadge tier={gallery.storage_tier} />
                            <span className="dash-gcard-folder-label" title="Hover the cover image to change folder">
                              {gallery.folder_id ? (folders.find(f => f.id === gallery.folder_id)?.name || '—') : 'No folder'}
                            </span>
                          </div>

                          <p className="dash-gcard-sub">
                            Created {formatDate(gallery.created_at)}
                            {gallery.password ? ' · Password protected' : ' · Public'}
                          </p>

                          <div className="dash-card-actions">
                            <a href={`/gallery/${gallery.id}`} className="dash-btn dash-btn-outline dash-btn-sm">
                              View
                            </a>
                            <a href={`/gallery/${gallery.id}?preview=true`} target="_blank" rel="noopener noreferrer" className="dash-btn dash-btn-outline dash-btn-sm">
                              Preview
                            </a>
                            <a href={`/galleries/${gallery.id}/add-video`} className="dash-btn dash-btn-outline dash-btn-sm">
                              + Video
                            </a>
                            <button
                              className="dash-btn dash-btn-outline dash-btn-sm"
                              onClick={() => { setUpdatingCoverFor(gallery.id); coverInputRef.current?.click() }}
                              disabled={gallery._coverUploading}
                            >
                              {gallery._coverUploading ? 'Uploading…' : gallery.cover_image_url ? 'Change Cover' : 'Add Cover'}
                            </button>
                            <button
                              className={`dash-btn dash-btn-outline dash-btn-sm${!hasEmail ? ' dash-btn-muted' : ''}`}
                              disabled={!hasEmail}
                              title={hasEmail ? 'Notify client (coming soon)' : 'No client email set'}
                            >
                              Notify
                            </button>
                            <button
                              className="dash-btn dash-btn-danger dash-btn-sm"
                              onClick={() => handleDelete(gallery)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? '…' : 'Delete'}
                            </button>
                          </div>

                          {/* Cover upload progress */}
                          {(gallery._coverUploading || gallery._coverError) && (
                            <div className="dash-cover-progress">
                              {gallery._coverUploading ? (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '9px', color: '#9a8e82', letterSpacing: '0.1em' }}>
                                      Uploading cover…
                                    </span>
                                    <span style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '9px', color: '#b5874a' }}>
                                      {gallery._coverProgress ?? 0}%
                                    </span>
                                  </div>
                                  <div style={{ width: '100%', height: '3px', background: 'rgba(26,20,16,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: '#b5874a', borderRadius: '2px', transition: 'width 0.25s ease', width: `${gallery._coverProgress ?? 0}%` }} />
                                  </div>
                                </>
                              ) : gallery._coverError ? (
                                <p style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 600, fontSize: '9px', color: '#b83232', letterSpacing: '0.08em', margin: 0 }}>
                                  Cover upload failed: {gallery._coverError}
                                </p>
                              ) : null}
                            </div>
                          )}

                          {/* Films list — collapsed by default to keep the card compact */}
                          {filmCount > 0 && (
                            <>
                              <button className="dash-expand-btn" onClick={() => toggleExpand(gallery.id)}>
                                {isExpanded ? '▾' : '▸'} Films in this gallery ({filmCount})
                              </button>

                              {isExpanded && (
                                <div className="dash-video-list">
                                  {/* Legacy video (gallery.video_uid) — always position 0 */}
                                  {gallery.video_uid && (
                                    <div className="dash-video-row">
                                      <span className="dash-video-num">01</span>
                                      {renamingVideoId === `legacy-${gallery.id}` ? (
                                        <input
                                          autoFocus
                                          className="dash-video-rename-input"
                                          value={renameValue}
                                          onChange={e => setRenameValue(e.target.value)}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') saveRename(`legacy-${gallery.id}`)
                                            if (e.key === 'Escape') cancelRename()
                                          }}
                                          onBlur={cancelRename}
                                          disabled={savingRename}
                                        />
                                      ) : (
                                        <>
                                          <span className="dash-video-name">{gallery.video_title || 'Main Film'}</span>
                                          <button
                                            className="dash-video-pencil-btn"
                                            onClick={() => startRename(`legacy-${gallery.id}`, gallery.video_title || 'Main Film')}
                                            title="Rename"
                                          >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                            </svg>
                                          </button>
                                        </>
                                      )}
                                      {formatBytes(gallery.video_size_bytes) && (
                                        <span className="dash-video-size">{formatBytes(gallery.video_size_bytes)}</span>
                                      )}
                                      <button
                                        className="dash-video-thumb-btn"
                                        onClick={() => { setSettingThumbnailFor(`legacy-${gallery.id}`); thumbnailInputRef.current?.click() }}
                                        disabled={uploadingThumbnailFor === `legacy-${gallery.id}`}
                                      >
                                        {uploadingThumbnailFor === `legacy-${gallery.id}` ? '…' : gallery.thumbnail_url ? 'Thumb ✓' : 'Set thumb'}
                                      </button>
                                      <button
                                        className="dash-video-del"
                                        onClick={() => handleDeleteLegacyVideo(gallery)}
                                        disabled={deletingVideo === `legacy-${gallery.id}`}
                                      >
                                        {deletingVideo === `legacy-${gallery.id}` ? '…' : 'Delete'}
                                      </button>
                                    </div>
                                  )}

                                  {/* Videos table entries — draggable within this gallery */}
                                  {galleryVideos.map((v, i) => {
                                    const isThumbUploading = uploadingThumbnailFor === v.id
                                    const isVDragging      = draggedIdRef.current === v.id
                                    const isVDragOver      = dragOverId === v.id
                                    const isMain            = !gallery.video_uid && i === 0
                                    const isRenaming        = renamingVideoId === v.id
                                    return (
                                      <div
                                        key={v.id}
                                        className={`dash-video-row${isVDragging ? ' is-dragging' : ''}${isVDragOver ? ' is-drag-over' : ''}`}
                                        draggable={!isRenaming}
                                        onDragStart={e => {
                                          draggedIdRef.current = v.id
                                          e.dataTransfer.effectAllowed = 'move'
                                        }}
                                        onDragOver={e => {
                                          e.preventDefault()
                                          e.dataTransfer.dropEffect = 'move'
                                          if (draggedIdRef.current && draggedIdRef.current !== v.id) {
                                            setDragOverId(v.id)
                                          }
                                        }}
                                        onDragLeave={() => setDragOverId(prev => prev === v.id ? null : prev)}
                                        onDrop={e => { e.preventDefault(); handleDrop(v.id, gallery.id, galleryVideos) }}
                                        onDragEnd={() => { draggedIdRef.current = null; setDragOverId(null) }}
                                      >
                                        {/* Drag handle */}
                                        <span className="dash-video-drag-handle" title="Drag to reorder">
                                          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                                            <circle cx="3" cy="2.5" r="1.3"/>
                                            <circle cx="7" cy="2.5" r="1.3"/>
                                            <circle cx="3" cy="7"   r="1.3"/>
                                            <circle cx="7" cy="7"   r="1.3"/>
                                            <circle cx="3" cy="11.5" r="1.3"/>
                                            <circle cx="7" cy="11.5" r="1.3"/>
                                          </svg>
                                        </span>
                                        <span className="dash-video-num">{String(i + (gallery.video_uid ? 2 : 1)).padStart(2, '0')}</span>
                                        {isRenaming ? (
                                          <input
                                            autoFocus
                                            className="dash-video-rename-input"
                                            value={renameValue}
                                            onChange={e => setRenameValue(e.target.value)}
                                            onKeyDown={e => {
                                              if (e.key === 'Enter') saveRename(v.id)
                                              if (e.key === 'Escape') cancelRename()
                                            }}
                                            onBlur={cancelRename}
                                            disabled={savingRename}
                                          />
                                        ) : (
                                          <>
                                            <span className="dash-video-name">{v.title || 'Untitled'}</span>
                                            <button
                                              className="dash-video-pencil-btn"
                                              onClick={() => startRename(v.id, v.title || 'Untitled')}
                                              title="Rename"
                                            >
                                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                              </svg>
                                            </button>
                                          </>
                                        )}
                                        {isMain && <span className="dash-video-main-badge">Main</span>}
                                        {formatBytes(v.size_bytes) && (
                                          <span className="dash-video-size">{formatBytes(v.size_bytes)}</span>
                                        )}
                                        <button
                                          className="dash-video-thumb-btn"
                                          onClick={() => { setSettingThumbnailFor(v.id); thumbnailInputRef.current?.click() }}
                                          disabled={isThumbUploading}
                                        >
                                          {isThumbUploading ? '…' : v.thumbnail_url ? 'Thumb ✓' : 'Set thumb'}
                                        </button>
                                        <button
                                          className="dash-video-del"
                                          onClick={() => handleDeleteVideo(v)}
                                          disabled={deletingVideo === v.id}
                                        >
                                          {deletingVideo === v.id ? '…' : 'Delete'}
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          </div>
        </div>
      </div>
    </>
  )
}

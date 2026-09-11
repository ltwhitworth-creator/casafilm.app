// Returns cacheable metadata (size in bytes, duration, processing status)
// for a Cloudflare Stream video — used by the dashboard to display and
// total up per-gallery storage usage.
export async function GET(request, context) {
  try {
    const { uid } = await context.params
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
      { headers: { 'Authorization': `Bearer ${apiToken}` } }
    )

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await res.json()
    const result = data?.result || {}

    return new Response(JSON.stringify({
      size: result.size ?? null,
      duration: result.duration ?? null,
      readyToStream: result.readyToStream ?? false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function DELETE(request, context) {
  try {
    const { uid } = await context.params
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${apiToken}` },
      }
    )

    return new Response(null, { status: res.ok ? 200 : res.status })
  } catch (err) {
    return new Response(err.message, { status: 500 })
  }
}

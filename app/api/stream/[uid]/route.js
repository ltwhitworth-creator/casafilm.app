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

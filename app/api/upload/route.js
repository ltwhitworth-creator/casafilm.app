export async function POST(request) {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxDurationSeconds: 21600,
          expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          requireSignedURLs: false
        })
      }
    )

    const data = await response.json()

    if (!data.success) {
      return Response.json({ error: JSON.stringify(data.errors) }, { status: 500 })
    }

    return Response.json({
      uploadUrl: data.result.uploadURL,
      uid: data.result.uid
    })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
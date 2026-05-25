export async function POST(request) {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    const uploadLength = request.headers.get('Upload-Length')
    const uploadMetadata = request.headers.get('Upload-Metadata')

    if (!uploadLength) {
      return new Response('Upload-Length header required', { status: 400 })
    }

    const cfHeaders = {
      'Authorization': `Bearer ${apiToken}`,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': uploadLength,
    }
    if (uploadMetadata) cfHeaders['Upload-Metadata'] = uploadMetadata

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
      { method: 'POST', headers: cfHeaders }
    )

    if (!cfRes.ok) {
      const body = await cfRes.text()
      return new Response(`Cloudflare error: ${body}`, { status: cfRes.status })
    }

    const cfLocation = cfRes.headers.get('Location')
    if (!cfLocation) {
      return new Response('No Location header from Cloudflare', { status: 502 })
    }

    // Extract the video UID — last path segment, strip any query string
    const uid = cfLocation.split('/').pop().split('?')[0]

    // Encode the full Cloudflare TUS URL as a stateless, URL-safe token.
    // HEAD/PATCH requests decode this to know where to proxy without any server-side state.
    const token = Buffer.from(cfLocation).toString('base64url')

    return new Response(null, {
      status: 201,
      headers: {
        'Location': `/api/upload/${token}`,
        'Tus-Resumable': '1.0.0',
        'Stream-Media-Id': uid,
      },
    })
  } catch (err) {
    return new Response(err.message, { status: 500 })
  }
}

function decodeCfUrl(token) {
  return Buffer.from(token, 'base64url').toString()
}

export async function HEAD(request, context) {
  try {
    const { token } = await context.params
    const cfUrl = decodeCfUrl(token)

    const cfRes = await fetch(cfUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Tus-Resumable': '1.0.0',
      },
    })

    const headers = new Headers()
    headers.set('Tus-Resumable', '1.0.0')
    headers.set('Upload-Offset', cfRes.headers.get('Upload-Offset') ?? '0')
    headers.set('Cache-Control', 'no-store')

    const uploadLength = cfRes.headers.get('Upload-Length')
    if (uploadLength) headers.set('Upload-Length', uploadLength)

    return new Response(null, { status: 200, headers })
  } catch (err) {
    return new Response(err.message, { status: 500 })
  }
}

export async function PATCH(request, context) {
  try {
    const { token } = await context.params
    const cfUrl = decodeCfUrl(token)

    const uploadOffset = request.headers.get('Upload-Offset')
    const contentLength = request.headers.get('Content-Length')

    const cfHeaders = {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Tus-Resumable': '1.0.0',
      'Content-Type': 'application/offset+octet-stream',
    }
    if (uploadOffset !== null) cfHeaders['Upload-Offset'] = uploadOffset
    if (contentLength !== null) cfHeaders['Content-Length'] = contentLength

    const cfRes = await fetch(cfUrl, {
      method: 'PATCH',
      headers: cfHeaders,
      body: request.body,
      // Required in Node.js when streaming a request body via fetch
      duplex: 'half',
    })

    const headers = new Headers()
    headers.set('Tus-Resumable', '1.0.0')

    const newOffset = cfRes.headers.get('Upload-Offset')
    if (newOffset) headers.set('Upload-Offset', newOffset)

    return new Response(null, { status: cfRes.status, headers })
  } catch (err) {
    return new Response(err.message, { status: 500 })
  }
}

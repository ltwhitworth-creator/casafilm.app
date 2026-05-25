/**
 * Uploads a file to the Supabase Storage `gallery-covers` bucket using XHR
 * so that upload progress can be tracked.
 *
 * @param {File} file - the image File to upload
 * @param {string} accessToken - the authenticated user's JWT (session.access_token)
 * @param {function} onProgress - callback(percent: number)
 * @returns {Promise<string>} the storage path (use with supabase.storage.getPublicUrl)
 */
export function uploadCoverWithProgress(file, accessToken, onProgress) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const endpoint = `${supabaseUrl}/storage/v1/object/gallery-covers/${path}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint)
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.timeout = 30000

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(path)
      } else {
        let msg = `Upload failed (${xhr.status})`
        try {
          const body = JSON.parse(xhr.responseText)
          if (body.message) msg = body.message
          else if (body.error) msg = body.error
        } catch {}
        reject(new Error(msg))
      }
    }

    xhr.onerror = () => reject(new Error('Network error — check your connection and try again'))
    xhr.ontimeout = () => reject(new Error('Upload timed out — please try again'))

    xhr.send(file)
  })
}

// Simple KV store using Vercel's built-in Edge Config or a flat approach.
// We use Vercel Blob (free tier) to persist fingerprint usage server-side.
// Falls back gracefully if not configured — just trusts the client.

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

async function getRecord(fingerprint) {
  if (!BLOB_TOKEN) return null
  try {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: `hc-fp/${fingerprint}` })
    return blobs.length > 0 ? blobs[0] : null
  } catch {
    return null
  }
}

async function setRecord(fingerprint, data) {
  if (!BLOB_TOKEN) return
  try {
    const { put } = await import('@vercel/blob')
    await put(
      `hc-fp/${fingerprint}.json`,
      JSON.stringify(data),
      { access: 'public', addRandomSuffix: false, token: BLOB_TOKEN }
    )
  } catch (err) {
    console.error('Blob write error:', err)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { fingerprint, action } = req.body

  if (!fingerprint) {
    return res.status(400).json({ error: 'No fingerprint' })
  }

  // If Blob isn't configured, trust the client
  if (!BLOB_TOKEN) {
    return res.status(200).json({ ok: true, serverChecks: 0, trusted: false })
  }

  try {
    const record = await getRecord(fingerprint)
    let data = record
      ? await fetch(record.url).then(r => r.json()).catch(() => null)
      : null

    if (!data) {
      data = { checksUsed: 0, emailGiven: false, createdAt: new Date().toISOString() }
    }

    if (action === 'get') {
      return res.status(200).json({ ok: true, ...data, trusted: true })
    }

    if (action === 'increment') {
      data.checksUsed = (data.checksUsed || 0) + 1
      data.lastSeen = new Date().toISOString()
      await setRecord(fingerprint, data)
      return res.status(200).json({ ok: true, ...data, trusted: true })
    }

    if (action === 'email') {
      data.emailGiven = true
      data.lastSeen = new Date().toISOString()
      await setRecord(fingerprint, data)
      return res.status(200).json({ ok: true, ...data, trusted: true })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('Fingerprint error:', err)
    // Fall back to trusting client
    return res.status(200).json({ ok: true, serverChecks: 0, trusted: false })
  }
}

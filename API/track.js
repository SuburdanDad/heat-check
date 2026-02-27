export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { idea, fingerprint, event } = req.body

  // Airtable config from environment variables
  const baseId  = process.env.AIRTABLE_BASE_ID
  const tableId = process.env.AIRTABLE_TABLE_ID
  const token   = process.env.AIRTABLE_TOKEN

  // If Airtable isn't configured, silently succeed — don't break the app
  if (!baseId || !tableId || !token) {
    return res.status(200).json({ ok: true, skipped: true })
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Idea:        idea        || '',
            Event:       event       || 'check_run',
            Fingerprint: fingerprint || '',
            Date:        new Date().toISOString(),
            Source:      req.headers['referer'] || '',
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.json()
      console.error('Airtable error:', err)
      // Still return 200 — don't let tracking break the main flow
      return res.status(200).json({ ok: false, error: err })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Track error:', err)
    return res.status(200).json({ ok: false, error: err.message })
  }
}

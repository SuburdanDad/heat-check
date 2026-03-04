export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { idea, report, email } = req.body
  if (!idea || !report) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const apiKey = process.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  // Debug: log whether Blob token is present (visible in Vercel function logs)
  console.log('BLOB_READ_WRITE_TOKEN present:', !!process.env.BLOB_READ_WRITE_TOKEN)

  const scoresText = report.parsedScores
    ? Object.entries(report.parsedScores).map(([k, v]) => `${k}: ${v}/100`).join(', ')
    : ''

  const prompt = `You are an expert web designer and copywriter. Generate a complete, single-file HTML landing page for the following startup idea.

IDEA: ${idea}

REPORT CONTEXT:
Customer Profile: ${report.customer || ''}
Pricing Strategy: ${report.pricing || ''}
Acquisition Channels: ${report.acquisition || ''}
Competitors: ${report.competitors || ''}
Verdict: ${report.verdict || ''}
${scoresText ? `Scores: ${scoresText}` : ''}

Requirements:
1. Derive a compelling product name from the idea
2. Hero section with a bold headline and subheadline based on the customer profile
3. Three feature/benefit cards based on the acquisition and pricing sections
4. Social proof placeholder section (e.g., "Join 500+ early adopters")
5. Simple email signup CTA form (non-functional HTML only, with a styled submit button)
6. Clean modern dark design using ONLY inline styles — no <style> tags, no external CSS
7. Import Google Fonts at the top: Inter (300,400,500) and Bebas Neue
8. Fully self-contained single HTML file. No external dependencies except Google Fonts.
9. Use dark color scheme: #0a0a0a background, #ffffff text, #ff6b35 accent color
10. Mobile responsive using a centered container with max-width: 720px and padding: 0 20px

Return ONLY the complete HTML file starting with <!DOCTYPE html> and ending with </html>. No explanation, no markdown code blocks, just the raw HTML.`

  let html = ''

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await anthropicResponse.json()

    if (!anthropicResponse.ok) {
      return res.status(anthropicResponse.status).json({ error: data.error?.message || 'Anthropic error' })
    }

    html = data.content?.map(c => c.text || '').join('\n') || ''

    if (!html) {
      return res.status(500).json({ error: 'Empty response from AI' })
    }

    // Strip markdown code fences if Claude wrapped the HTML
    html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim()

  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate landing page: ' + err.message })
  }

  // Save to Vercel Blob — required for a real hosted URL
  let url = null

  try {
    const { put } = await import('@vercel/blob')
    const filename = `landing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.html`
    const blob = await put(filename, html, {
      access: 'public',
      contentType: 'text/html',
    })
    url = blob.url
    console.log('Blob upload succeeded:', url)
  } catch (blobErr) {
    console.error('Blob upload failed:', blobErr.message || blobErr)
    // Never fall back to a data URL — return a proper error so the user can be helped
    return res.status(500).json({
      error: 'Landing page storage failed. Please email us and we will generate your page manually.',
      detail: blobErr.message,
    })
  }

  // Send email via Resend if configured and email provided
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && email) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'Heat Check <onboarding@resend.dev>',
          to: [email],
          subject: 'Your landing page is live 🚀',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px;">
              <h1 style="color: #ff6b35; font-size: 32px; margin-bottom: 16px;">Your Landing Page Is Live! 🚀</h1>
              <p style="color: #aaa; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Congratulations on taking your first step to becoming an entrepreneur. Your custom landing page has been generated based on your startup idea.
              </p>
              <a href="${url}" style="display: inline-block; background: #ff6b35; color: #0a0a0a; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase;">
                View Your Landing Page →
              </a>
              <p style="color: #555; font-size: 12px; margin-top: 32px;">
                Powered by Heat Check — <a href="https://heat-check-alpha.vercel.app" style="color: #ff6b35;">heat-check-alpha.vercel.app</a>
              </p>
            </div>
          `,
        }),
      })
    } catch (emailErr) {
      console.error('Resend error:', emailErr)
      // Don't fail — email is a bonus, not required
    }
  }

  return res.status(200).json({ url })
}

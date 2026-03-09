export default async function handler(req, res) {
  console.log('generate-landing: handler called', { method: req.method })

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { idea, report, email } = req.body
  console.log('generate-landing: received data', {
    idea: idea ? idea.slice(0, 80) + '...' : null,
    hasReport: !!report,
    email: email || '(none)',
  })

  if (!idea || !report) {
    console.error('generate-landing: missing required fields', { hasIdea: !!idea, hasReport: !!report })
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('generate-landing: ANTHROPIC_API_KEY not set')
    return res.status(500).json({ error: 'API key not configured' })
  }

  console.log('resend key exists:', !!process.env.RESEND_API_KEY)

  const scoresText = report.parsedScores
    ? Object.entries(report.parsedScores).map(([k, v]) => `${k}: ${v}/100`).join(', ')
    : ''

  const prompt = `You are an expert web designer and copywriter. Generate a complete, single-file HTML landing page for the following startup idea. This should look like a real funded startup's marketing site — think Linear, Notion, Vercel, or Lemon Squeezy.

IDEA: ${idea}

REPORT CONTEXT:
Customer Profile: ${report.customer || ''}
Pricing Strategy: ${report.pricing || ''}
Acquisition Channels: ${report.acquisition || ''}
Competitors: ${report.competitors || ''}
Verdict: ${report.verdict || ''}
${scoresText ? `Scores: ${scoresText}` : ''}

Design Requirements:
1. COLOR SCHEME: Choose the best palette for this specific product. Good options: white/navy, white/emerald green, white/deep purple, cream/black, or a bold solid-color hero. DO NOT use a dark background with orange accents. The page should feel clean, professional, and trustworthy.
2. FONTS: Import Inter and Plus Jakarta Sans from Google Fonts. Use Plus Jakarta Sans for headlines (font-weight 700-800) and Inter for body copy (font-weight 400-500). Do NOT use Space Mono, Bebas Neue, or any monospace/display fonts.
3. LAYOUT: Modern SaaS landing page structure:
   - Full-width hero: large headline (derived from customer profile), subheadline, and a prominent CTA button (copy derived from acquisition channels)
   - 3-column feature grid: features/benefits derived from the pricing and acquisition sections
   - Social proof row: placeholder stats like "2,400+ teams", "98% satisfaction", "$2M saved" — make them relevant to the idea
   - Email signup section with a clear headline and input + button
   - Simple footer with the product name and a tagline
4. FEEL: Professional and polished. Generous whitespace, clean typography hierarchy, subtle shadows or borders for cards. Not a hacker tool — a real product website.
5. CONTENT: Derive everything from the report. Product name from the idea. Hero headline from the customer problem. CTA copy from acquisition channels. Feature cards from the product's differentiators vs competitors. Use confident, benefit-driven copy.

Technical Requirements:
- Single self-contained HTML file
- All styles in a <style> tag in the <head> (not inline styles)
- Google Fonts import link in the <head>
- No external JavaScript dependencies
- Mobile responsive with a meta viewport tag and responsive CSS (use max-width containers, flex/grid layouts that stack on mobile)
- Include placeholder content for all sections — no empty sections

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

    console.log('generate-landing: Anthropic response status:', anthropicResponse.status)
    const data = await anthropicResponse.json()

    if (!anthropicResponse.ok) {
      console.error('generate-landing: Anthropic error:', data.error)
      return res.status(anthropicResponse.status).json({ error: data.error?.message || 'Anthropic error' })
    }

    html = data.content?.map(c => c.text || '').join('\n') || ''

    if (!html) {
      console.error('generate-landing: Empty response from Anthropic')
      return res.status(500).json({ error: 'Empty response from AI' })
    }

    // Strip markdown code fences if Claude wrapped the HTML
    html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim()
    console.log('generate-landing: HTML generated, length:', html.length)

  } catch (err) {
    console.error('generate-landing: Anthropic fetch error:', err.message, err)
    return res.status(500).json({ error: 'Failed to generate landing page: ' + err.message })
  }

  // Send email via Resend if configured and email provided
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && email) {
    try {
      const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px;">
            <h1 style="color: #ff6b35; font-size: 32px; margin-bottom: 16px;">Your Landing Page Is Ready! 🚀</h1>
            <p style="color: #aaa; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Congratulations on taking your first step to becoming an entrepreneur. Your landing page has been generated based on your startup idea.
            </p>
            <p style="color: #aaa; font-size: 16px; line-height: 1.6;">
              Your landing page HTML is attached to this email. Open it in any browser to preview, or upload it to Netlify Drop (netlify.com/drop) for a free live URL in seconds.
            </p>
            <p style="color: #555; font-size: 12px; margin-top: 32px;">
              Powered by Heat Check — <a href="https://heat-check-alpha.vercel.app" style="color: #ff6b35;">heat-check-alpha.vercel.app</a>
            </p>
          </div>
        `

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'Heat Check <onboarding@resend.dev>',
          to: [email],
          subject: 'Your landing page is ready 🚀',
          html: emailHtml,
          attachments: [
            {
              filename: 'landing-page.html',
              content: Buffer.from(html).toString('base64'),
            },
          ],
        }),
      })

      const emailData = await emailRes.json()
      console.log('generate-landing: Resend response status:', emailRes.status, 'body:', JSON.stringify(emailData))

      if (!emailRes.ok) {
        console.error('generate-landing: Resend failed:', emailData)
      }
    } catch (emailErr) {
      console.error('generate-landing: Resend error:', emailErr)
      // Don't fail the request — HTML is still returned below
    }
  }

  // Return HTML directly — let the frontend handle it via download
  return res.status(200).json({ html })
}

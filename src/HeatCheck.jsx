import { useState, useEffect } from 'react'
import { usePaywall } from './usePaywall'
import PaywallModal from './PaywallModal'
import FeedbackWidget from './FeedbackWidget'
import ThankYou from './ThankYou'

const STRIPE_LANDING = import.meta.env.VITE_STRIPE_LANDING_LINK || 'https://buy.stripe.com/YOUR_LANDING_LINK'

const STAGES = [
  'Checking the temperature...',
  'Identifying target customers...',
  'Estimating pricing power...',
  'Scanning competitor landscape...',
  'Mapping acquisition channels...',
  'Building your heat report...',
]

const scoreColors = {
  'Market Demand':     '#ff6b35',
  'Monetization Ease': '#facc15',
  'Execution Speed':   '#fb923c',
  'Competition Level': '#f87171',
}

function TypingText({ text }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(iv)
    }, 16)
    return () => clearInterval(iv)
  }, [text])
  return <span>{displayed}</span>
}

function ScoreBar({ score, label, color }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 150)
    return () => clearTimeout(t)
  }, [score])
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', fontFamily: "'Space Mono', monospace", color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: '13px', fontFamily: "'Space Mono', monospace", color, fontWeight: '700' }}>{score}/100</span>
      </div>
      <div style={{ height: '5px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: width+'%', background: 'linear-gradient(90deg, '+color+'55, '+color+')', borderRadius: '3px', transition: 'width 1.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
      </div>
    </div>
  )
}

function Section({ title, children, accent }) {
  return (
    <div style={{ borderLeft: '3px solid '+accent, paddingLeft: '20px', marginBottom: '36px' }}>
      <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>{title}</div>
      <div style={{ color: '#bbb', fontSize: '15px', lineHeight: '1.85', fontFamily: "'Inter', sans-serif", fontWeight: '300', letterSpacing: '0.01em' }}>{children}</div>
    </div>
  )
}

function parseReport(text) {
  const patterns = {
    scores:      /SCORES:([\s\S]*?)(?=CUSTOMER:|$)/i,
    customer:    /CUSTOMER:([\s\S]*?)(?=PRICING:|$)/i,
    pricing:     /PRICING:([\s\S]*?)(?=ACQUISITION:|$)/i,
    acquisition: /ACQUISITION:([\s\S]*?)(?=COMPETITORS:|$)/i,
    competitors: /COMPETITORS:([\s\S]*?)(?=VERDICT:|$)/i,
    verdict:     /VERDICT:([\s\S]*?)$/i,
  }
  const sections = {}
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern)
    sections[key] = match ? match[1].trim() : ''
  }
  const scores = {}
  ;(sections.scores || '').split('\n').filter(Boolean).forEach(line => {
    const m = line.match(/([^:]+):\s*(\d+)/)
    if (m) scores[m[1].trim()] = parseInt(m[2])
  })
  sections.parsedScores = scores
  return sections
}

export default function HeatCheck() {
  const [idea, setIdea]             = useState('')
  const [email, setEmail]           = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading]       = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [report, setReport]         = useState(null)
  const [error, setError]           = useState(null)
  const [thankYouType, setThankYouType] = useState(null)
  const [buildingLanding, setBuildingLanding] = useState(false)
  const [landingUrl, setLandingUrl] = useState(null)
  const paywall = usePaywall()

  async function generateLandingPage(pendingIdea, pendingReport, emailAddr) {
    const res = await fetch('/api/generate-landing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: pendingIdea, report: pendingReport, email: emailAddr || '' })
    })
    const data = await res.json()
    return data.url
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    if (payment === 'single' || payment === 'pack') setThankYouType(payment)

    const landing = params.get('landing')
    if (landing === 'paid') {
      const pendingIdea = localStorage.getItem('hc_pending_idea')
      const pendingReportStr = localStorage.getItem('hc_pending_report')
      const pendingEmail = localStorage.getItem('hc_pending_email') || ''
      if (pendingIdea && pendingReportStr) {
        try {
          const pendingReport = JSON.parse(pendingReportStr)
          setBuildingLanding(true)
          window.history.replaceState({}, '', window.location.pathname)
          generateLandingPage(pendingIdea, pendingReport, pendingEmail)
            .then(url => {
              setBuildingLanding(false)
              setLandingUrl(url || '')
              localStorage.removeItem('hc_pending_idea')
              localStorage.removeItem('hc_pending_report')
              localStorage.removeItem('hc_pending_email')
            })
            .catch(() => {
              setBuildingLanding(false)
              localStorage.removeItem('hc_pending_idea')
              localStorage.removeItem('hc_pending_report')
              localStorage.removeItem('hc_pending_email')
            })
        } catch {}
      } else {
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  useEffect(() => {
    if (!loading) return
    const iv = setInterval(() => setStageIndex(i => (i + 1) % STAGES.length), 2200)
    return () => clearInterval(iv)
  }, [loading])

  async function handleSubmit() {
    if (!idea.trim()) return

    // If out of checks, show paywall immediately
    if (paywall.emailGiven && !paywall.canCheck) {
      paywall.setShowPaywall(true)
      return
    }

    // Capture email if not yet given
    if (!paywall.emailGiven) {
      if (!email.includes('@')) {
        setEmailError('Enter a valid email to get your free check.')
        return
      }
      setEmailError('')
      paywall.grantEmailBonus(email)
      await new Promise(r => setTimeout(r, 80))
    }

    setLoading(true)
    setReport(null)
    setError(null)
    setStageIndex(0)

    const prompt = `You are an experienced startup advisor who has seen thousands of ideas succeed and fail. You believe most ideas have a real kernel of potential — your job is to help founders find it and understand what it will take to unlock it. You're honest about risks but you lead with what could work. Analyze this app/business idea and return ONLY the structured report below — no preamble, no markdown, no asterisks. Plain text only.

IDEA: ${idea}

Return exactly in this format:

SCORES:
Market Demand: [0-100]
Monetization Ease: [0-100]
Execution Speed: [0-100]
Competition Level: [0-100]

CUSTOMER:
[2-3 sentences. Describe the specific person most likely to pay for this first — their role, frustration, what they currently use instead. Be specific: not "small businesses" but "solo designers charging $75-150/hr who hate writing proposals".]

PRICING:
[2-3 sentences. Suggest realistic price points with the reasoning behind them. What model fits this idea best and why would the customer accept it?]

ACQUISITION:
[3 specific, actionable tactics to land the first 10 paying customers. Number them 1, 2, 3.]

COMPETITORS:
[2-3 real competitors. For each: name, what they do well, and the gap this idea could fill that they don't.]

VERDICT:
[3-4 sentences. Start with what genuinely excites you about this idea. Then name the single biggest risk honestly. End with the one thing the founder needs to get right to make this work.]`

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      if (!data.text) throw new Error('Empty response')
      setReport(parseReport(data.text))
      paywall.incrementChecks()
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, email, fingerprint: paywall.fingerprint, event: 'check_run' }),
      }).catch(() => {})
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const outOfChecks = paywall.emailGiven && !paywall.canCheck
  const btnText = loading ? 'Running...' : outOfChecks ? 'Get More Checks →' : 'Shoot Your Shot! 🔥'

  if (thankYouType) {
    return <ThankYou type={thankYouType} onComplete={() => { setThankYouType(null); window.history.replaceState({}, '', window.location.pathname) }} />
  }

  if (buildingLanding) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <style>{`@keyframes spin { to{transform:rotate(360deg)} } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
        <div style={{ fontSize: '48px', animation: 'spin 1.5s linear infinite', marginBottom: '32px' }}>🔥</div>
        <div className="pulse" style={{ fontFamily: "'Space Mono', monospace", fontSize: '13px', color: '#ff6b35', letterSpacing: '0.18em', textTransform: 'uppercase', animation: 'pulse 2s ease-in-out infinite' }}>Building your landing page...</div>
      </div>
    )
  }

  if (landingUrl !== null && landingUrl !== undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 80px' }}>
        <style>{`
          @keyframes glow { 0%,100%{text-shadow:0 0 40px #ff6b3550} 50%{text-shadow:0 0 80px #ff6b3580,0 0 120px #ff6b3525} }
          @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .landing-btn { background: #ff6b35; color: #0a0a0a; border: none; padding: 15px 40px; font-family: 'Space Mono', monospace; font-weight: 700; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
          .landing-btn:hover { background: #ff8c5a; transform: translateY(-1px); }
          .landing-outline-btn { background: transparent; color: #ff6b35; border: 1px solid #ff6b3533; padding: 13px 32px; font-family: 'Space Mono', monospace; font-weight: 700; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
          .landing-outline-btn:hover { border-color: #ff6b35; }
          .url-block { background: #0d0d0d; border: 1px solid #ff6b3530; padding: 16px 20px; font-family: 'Space Mono', monospace; font-size: 12px; color: #ff6b35; word-break: break-all; cursor: pointer; transition: background 0.2s; }
          .url-block:hover { background: #111; }
        `}</style>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '700px', height: '400px', background: 'radial-gradient(ellipse at top, #ff6b3518 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ width: '100%', maxWidth: '720px', paddingTop: '72px', position: 'relative', zIndex: 1, animation: 'slideUp 0.7s ease forwards' }}>
          <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: '#ff6b35', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '20px' }}>🚀 Landing page ready</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(52px, 11vw, 88px)', letterSpacing: '0.04em', lineHeight: '0.9', color: '#fff', marginBottom: '28px' }}>
            YOUR LANDING PAGE<br />
            <span style={{ color: '#ff6b35', animation: 'glow 3s ease-in-out infinite' }}>IS LIVE.</span>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: '300', color: '#aaa', fontSize: '17px', maxWidth: '520px', lineHeight: '1.75', marginBottom: '36px' }}>
            Congratulations on taking your first step to becoming an entrepreneur.
          </p>
          {landingUrl && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: '#555', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px' }}>Your landing page URL</div>
              <div
                className="url-block"
                onClick={() => { navigator.clipboard.writeText(landingUrl).catch(() => {}) }}
                title="Click to copy"
              >{landingUrl}</div>
              <div style={{ fontSize: '11px', fontFamily: "'Space Mono', monospace", color: '#444', marginTop: '8px' }}>Click to copy</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {landingUrl && (
              <button className="landing-btn" onClick={() => window.open(landingUrl, '_blank')}>View My Landing Page →</button>
            )}
            <button className="landing-outline-btn" onClick={() => { setLandingUrl(null); setReport(null); setIdea('') }}>← Back to Heat Check</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        textarea:focus, input:focus { outline: none; }
        textarea::placeholder, input::placeholder { color: #444; }
        .submit-btn { background: #ff6b35; color: #0a0a0a; border: none; padding: 15px 40px; font-family: 'Space Mono', monospace; font-weight: 700; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .submit-btn:hover:not(:disabled) { background: #ff8c5a; transform: translateY(-1px); box-shadow: 0 4px 28px #ff6b3544; }
        .submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .outline-btn { background: transparent; color: #ff6b35; border: 1px solid #ff6b3533; padding: 13px 32px; font-family: 'Space Mono', monospace; font-weight: 700; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .outline-btn:hover { border-color: #ff6b35; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes flicker { 0%,100%{opacity:1} 48%{opacity:.8} 50%{opacity:.5} 52%{opacity:.9} }
        @keyframes glow { 0%,100%{text-shadow:0 0 40px #ff6b3550} 50%{text-shadow:0 0 80px #ff6b3580,0 0 120px #ff6b3525} }
      `}</style>

      {paywall.showPaywall && <PaywallModal onDismiss={() => paywall.setShowPaywall(false)} />}
      <FeedbackWidget />

      <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '0 20px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '700px', height: '300px', background: 'radial-gradient(ellipse at top, #ff6b3514 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Header */}
        <div style={{ width: '100%', maxWidth: '720px', paddingTop: '64px', paddingBottom: '48px', borderBottom: '1px solid #181818', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: '#ff6b35', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '18px', animation: 'flicker 5s ease-in-out infinite' }}>🔥 Startup Intelligence</div>

          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(60px, 13vw, 100px)', letterSpacing: '0.04em', lineHeight: '0.88', color: '#fff', marginBottom: '24px' }}>
            HEAT<br />
            <span style={{ color: '#ff6b35', animation: 'glow 3.5s ease-in-out infinite' }}>CHECK</span>
          </h1>

          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: '300', color: '#ffffff', fontSize: '18px', maxWidth: '480px', lineHeight: '1.7', letterSpacing: '0.01em', marginBottom: '32px' }}>
            Know if your idea is worth building — before you spend months finding out the hard way.
          </p>

          <div>
            <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: '#888', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '14px' }}>Every report includes</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { icon: '💰', text: 'Monetization score & pricing strategy' },
                { icon: '🎯', text: 'Hyper-specific ideal customer profile' },
                { icon: '📈', text: 'Top acquisition channels to get first 10 customers' },
                { icon: '⚡', text: 'Execution difficulty & time-to-revenue estimate' },
                { icon: '🔍', text: 'Real competitors & the gaps you can exploit' },
                { icon: '🏆', text: 'Honest build / no-build verdict' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', border: '1px solid #1c1c1c', background: '#0d0d0d' }}>
                  <span style={{ fontSize: '13px' }}>{icon}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: '300', fontSize: '12px', color: '#888', letterSpacing: '0.02em' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div style={{ width: '100%', maxWidth: '720px', paddingTop: '40px', zIndex: 1 }}>
          <div style={{ fontSize: '11px', fontFamily: "'Space Mono', monospace", color: '#e5e5e5', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Drop your idea</div>
          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder="e.g. An AI tool that writes cold emails personalized to each prospect's LinkedIn profile and recent posts, with one-click sending from Gmail..."
            rows={5}
            style={{ width: '100%', background: '#0d0d0d', border: '1px solid #ffffff', color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: '300', fontSize: '15px', lineHeight: '1.75', padding: '20px', resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = '#ff6b3555'}
            onBlur={e => e.target.style.borderColor = '#ffffff'}
          />

          {/* Email field — only shown before email is given */}
          {!paywall.emailGiven && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', fontFamily: "'Space Mono', monospace", color: '#e5e5e5', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>Your email</div>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailError('') }}
                placeholder="you@example.com"
                style={{ width: '100%', background: '#0d0d0d', border: '1px solid '+(emailError ? '#f87171' : '#ffffff'), color: '#ffffff', fontFamily: "'Inter', sans-serif", fontWeight: '300', fontSize: '15px', padding: '16px 20px' }}
                onFocus={e => e.target.style.borderColor = '#ff6b3555'}
                onBlur={e => e.target.style.borderColor = emailError ? '#f87171' : '#ffffff'}
              />
              {emailError && <div style={{ marginTop: '8px', fontSize: '12px', fontFamily: "'Space Mono', monospace", color: '#f87171' }}>{emailError}</div>}
              <div style={{ marginTop: '8px', fontSize: '11px', fontFamily: "'Space Mono', monospace", color: '#666' }}>1 free report. No spam. Unsubscribe anytime.</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#666' }}>{idea.length > 0 && idea.length+' chars'}</span>
            <button className="submit-btn" onClick={handleSubmit} disabled={loading || !idea.trim()}>{btnText}</button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ width: '100%', maxWidth: '720px', paddingTop: '64px', textAlign: 'center', zIndex: 1 }}>
            <div style={{ width: '44px', height: '44px', border: '2px solid #1a1a1a', borderTop: '2px solid #ff6b35', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 28px' }} />
            <div className="pulse" style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#ff6b35', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{STAGES[stageIndex]}</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ width: '100%', maxWidth: '720px', marginTop: '28px', zIndex: 1, padding: '14px 18px', border: '1px solid #f8717133', background: '#f8717108', color: '#f87171', fontFamily: "'Space Mono', monospace", fontSize: '12px' }}>{error}</div>
        )}

        {/* Report */}
        {report && !loading && (
          <div className="fade-in" style={{ width: '100%', maxWidth: '720px', paddingTop: '64px', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '52px' }}>
              <div style={{ flex: 1, height: '1px', background: '#181818' }} />
              <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: '#ff6b35', letterSpacing: '0.22em', textTransform: 'uppercase' }}>🔥 Heat Report</div>
              <div style={{ flex: 1, height: '1px', background: '#181818' }} />
            </div>

            {Object.keys(report.parsedScores).length > 0 && (
              <div style={{ marginBottom: '52px' }}>
                <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: '#333', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '20px' }}>Signal Scores</div>
                {Object.entries(report.parsedScores).map(([label, score]) => (
                  <ScoreBar key={label} label={label} score={score} color={scoreColors[label] || '#ff6b35'} />
                ))}
              </div>
            )}

            {report.customer    && <Section     accent="#ff6b35"><TypingText text={report.customer} /></Section>}
            {report.pricing     && <Section    accent="#facc15">{report.pricing}</Section>}
            {report.acquisition && <Section  accent="#fb923c">{report.acquisition}</Section>}
            {report.competitors && <Section accent="#f87171">{report.competitors}</Section>}

            {report.verdict && (
              <div style={{ background: '#0d0d0d', border: '1px solid #ff6b3518', boxShadow: '0 0 60px #ff6b3510', padding: '32px' }}>
                <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", color: '#ff6b35', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '16px' }}>🔥 Final Verdict</div>
                <div style={{ color: '#ccc', fontFamily: "'Inter', sans-serif", fontSize: '15px', lineHeight: '1.9', fontWeight: '300', letterSpacing: '0.01em' }}>{report.verdict}</div>
              </div>
            )}

            {/* Upsell: Landing Page Generator */}
            <div style={{ marginTop: '40px', background: '#0d0d0d', border: '1px solid #ff6b3530', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(28px, 5vw, 36px)', letterSpacing: '0.06em', color: '#fff', marginBottom: '10px', lineHeight: 1 }}>WANT TO LAUNCH THIS?</h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: '300', color: '#888', fontSize: '14px', lineHeight: '1.75', marginBottom: '0' }}>
                    We'll build you a landing page based on your idea in under 60 seconds. Share it. Test it. See if people sign up.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', flexShrink: 0 }}>
                  <div style={{ background: '#ff6b35', color: '#0a0a0a', fontFamily: "'Space Mono', monospace", fontWeight: '700', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', padding: '6px 14px' }}>$5 ONE-TIME</div>
                  <button
                    className="submit-btn"
                    onClick={() => {
                      localStorage.setItem('hc_pending_idea', idea)
                      localStorage.setItem('hc_pending_report', JSON.stringify(report))
                      if (email) localStorage.setItem('hc_pending_email', email)
                      const successUrl = 'https://heat-check-alpha.vercel.app?landing=paid'
                      window.location.href = `${STRIPE_LANDING}?success_url=${encodeURIComponent(successUrl)}`
                    }}
                  >Build My Landing Page 🚀</button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '48px', display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="outline-btn" onClick={() => { setReport(null); setIdea(''); setError(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>← Check Another Idea</button>
              <button className="submit-btn" onClick={() => paywall.setShowPaywall(true)}>Get More Checks 🔥</button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '80px', paddingTop: '24px', borderTop: '1px solid #141414', width: '100%', maxWidth: '720px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#222' }}>HEAT CHECK v1.1</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: '#222' }}>Powered by Claude AI</span>
        </div>
      </div>
    </>
  )
}

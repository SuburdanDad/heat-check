import { useState, useEffect } from 'react'

const REDIRECT_SECS = 10

const TIPS = [
  {
    number: '01',
    headline: 'Talk to 5 strangers before writing a single line of code.',
    body: 'Find people who fit your target customer profile — Reddit, Facebook groups, LinkedIn, cold DMs. Ask them: "Do you currently have this problem? How are you solving it today? What would you pay to fix it?" Their exact words become your marketing copy.',
    action: 'Where to find them',
    detail: 'Search Reddit for your problem keyword. Post in 3 relevant subreddits asking for a 10-minute call. Offer nothing in return — curiosity is enough.',
    color: '#ff6b35',
  },
  {
    number: '02',
    headline: 'Sell it before you build it.',
    body: 'Create a simple landing page with a waitlist or a "Pay now, get access first" button. If nobody signs up or pays, you have your answer before wasting months building. A Stripe payment link and a Google Form can be your entire MVP.',
    action: 'The 48-hour test',
    detail: 'Spend 2 days max building a one-page site. Run $50 of Facebook or Reddit ads to it. If you get zero signups, the idea needs rethinking. If you get 10+, you have proof.',
    color: '#facc15',
  },
  {
    number: '03',
    headline: 'Your first customer is hiding in plain sight.',
    body: 'You already know someone who has this problem. A former colleague, a friend, someone in a community you\'re in. Reach out personally — not with a mass email, but a single message: "I\'m building something that solves X. You\'re exactly who I built it for. Can I show you?"',
    action: 'The warm intro script',
    detail: '"Hey [name] — I\'m building a tool for [specific person] who struggles with [specific problem]. I think that\'s you. Would you be open to 20 minutes this week? I\'ll show you what I have and you tell me if it\'s useful."',
    color: '#fb923c',
  },
  {
    number: '04',
    headline: 'Post your progress publicly from day one.',
    body: 'Building in public on X/Twitter or LinkedIn is one of the highest-ROI things a solo founder can do. Share what you\'re building, who it\'s for, and what you\'re learning. Your future customers are watching. Your first 10 customers often come from this alone.',
    action: 'What to post today',
    detail: '"I\'m building [thing] for [person] because [reason]. Here\'s my biggest challenge right now: [challenge]. If this sounds like something you need, reply or DM me." Post this today.',
    color: '#4ade80',
  },
  {
    number: '05',
    headline: 'Find where your customers already gather.',
    body: 'There is a community, subreddit, Slack group, Discord, or newsletter where your exact customer spends time. Become a genuine member — answer questions, add value, be helpful. When you eventually mention what you\'re building, they already trust you.',
    action: 'Do this now',
    detail: 'Search "[your customer type] community", "[your customer type] forum", "[your problem] reddit". Find 3 places. Spend 30 minutes reading. Start participating today.',
    color: '#a78bfa',
  },
]

export default function ThankYou({ type, onComplete }) {
  const [countdown, setCountdown] = useState(REDIRECT_SECS)
  const [expanded, setExpanded] = useState(null)
  const [visible, setVisible] = useState(false)

  const isPack = type === 'pack'
  const checksAdded = isPack ? 10 : 1

  useEffect(() => {
    // Fade in
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(iv)
          onComplete()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [onComplete])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 20px 80px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.6s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{text-shadow:0 0 40px #ff6b3550} 50%{text-shadow:0 0 80px #ff6b3580,0 0 120px #ff6b3525} }
        @keyframes countPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        .tip-card {
          border: 1px solid #1a1a1a;
          background: #0d0d0d;
          padding: 24px 28px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .tip-card:hover { border-color: #2a2a2a; background: #111; }
        .tip-card.open { border-color: #ff6b3530; background: #0f0f0f; }
        .redirect-btn {
          background: #ff6b35; color: #0a0a0a;
          border: none; padding: 14px 40px;
          font-family: 'Space Mono', monospace; font-weight: 700;
          font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s;
        }
        .redirect-btn:hover { background: #ff8c5a; transform: translateY(-1px); }
        .skip-btn {
          background: transparent; color: #444;
          border: 1px solid #1e1e1e; padding: 14px 28px;
          font-family: 'Space Mono', monospace;
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s;
        }
        .skip-btn:hover { color: #888; border-color: #333; }
      `}</style>

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '400px',
        background: 'radial-gradient(ellipse at top, #ff6b3518 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: '720px', position: 'relative', zIndex: 1 }}>

        {/* Hero */}
        <div style={{
          paddingTop: '72px', paddingBottom: '52px',
          borderBottom: '1px solid #181818',
          animation: 'slideUp 0.7s ease forwards',
        }}>
          <div style={{
            fontSize: '10px', fontFamily: "'Space Mono', monospace",
            color: '#ff6b35', letterSpacing: '0.28em', textTransform: 'uppercase',
            marginBottom: '20px',
          }}>🔥 Payment confirmed</div>

          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(52px, 11vw, 88px)',
            letterSpacing: '0.04em', lineHeight: '0.9',
            color: '#fff', marginBottom: '28px',
          }}>
            YOU'RE IN.<br />
            <span style={{ color: '#ff6b35', animation: 'glow 3s ease-in-out infinite' }}>
              NOW GO BUILD.
            </span>
          </h1>

          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: '300',
            color: '#aaa', fontSize: '17px', maxWidth: '520px',
            lineHeight: '1.75', marginBottom: '32px',
          }}>
            {isPack
              ? `10 Heat Checks loaded and ready. That's 10 ideas you can validate before your competitors even pick one.`
              : `Your Heat Check is loaded. One idea, one honest verdict. Make it count.`
            }
          </p>

          {/* Checks added badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '12px',
            padding: '12px 20px',
            border: '1px solid #ff6b3330',
            background: '#ff6b3308',
          }}>
            <span style={{ fontSize: '20px', letterSpacing: '3px' }}>
              {'🔥'.repeat(Math.min(checksAdded, 10))}
            </span>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: '12px',
              color: '#ff6b35', letterSpacing: '0.08em',
            }}>
              +{checksAdded} check{checksAdded > 1 ? 's' : ''} added to your account
            </span>
          </div>
        </div>

        {/* Tips section */}
        <div style={{ paddingTop: '52px' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: '16px',
            marginBottom: '8px',
          }}>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(28px, 5vw, 40px)',
              color: '#fff', letterSpacing: '0.06em',
            }}>HOW TO FIND YOUR FIRST CUSTOMERS</h2>
          </div>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontWeight: '300',
            color: '#555', fontSize: '14px', lineHeight: '1.7',
            marginBottom: '36px',
          }}>
            The gap between "great idea" and "paying customers" is shorter than you think.
            These five moves get you there faster than anything else.
          </p>

          {TIPS.map((tip, i) => (
            <div
              key={tip.number}
              className={`tip-card${expanded === i ? ' open' : ''}`}
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                {/* Number */}
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '32px', color: tip.color,
                  lineHeight: 1, flexShrink: 0, opacity: 0.7,
                }}>{tip.number}</div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: '500',
                    fontSize: '15px', color: '#e5e5e5',
                    lineHeight: '1.5', marginBottom: expanded === i ? '14px' : '0',
                    transition: 'margin 0.2s',
                  }}>{tip.headline}</div>

                  {expanded === i && (
                    <div style={{ animation: 'slideUp 0.25s ease forwards' }}>
                      <p style={{
                        fontFamily: "'Inter', sans-serif", fontWeight: '300',
                        fontSize: '14px', color: '#888', lineHeight: '1.8',
                        marginBottom: '20px',
                      }}>{tip.body}</p>

                      <div style={{
                        borderLeft: `3px solid ${tip.color}`,
                        paddingLeft: '16px',
                      }}>
                        <div style={{
                          fontSize: '10px', fontFamily: "'Space Mono', monospace",
                          color: tip.color, letterSpacing: '0.18em',
                          textTransform: 'uppercase', marginBottom: '8px',
                        }}>{tip.action}</div>
                        <p style={{
                          fontFamily: "'Inter', sans-serif", fontWeight: '300',
                          fontSize: '13px', color: '#777', lineHeight: '1.75',
                          fontStyle: 'italic',
                        }}>{tip.detail}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chevron */}
                <div style={{
                  color: '#333', fontSize: '18px', flexShrink: 0,
                  transform: expanded === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  marginTop: '4px',
                }}>▾</div>
              </div>
            </div>
          ))}
        </div>

        {/* Redirect section */}
        <div style={{
          marginTop: '60px', paddingTop: '40px',
          borderTop: '1px solid #141414',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '20px', textAlign: 'center',
        }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '11px',
            color: '#333', letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            Your checks are ready
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="redirect-btn" onClick={onComplete}>
              Run Heat Check Now 🔥
            </button>
            <button className="skip-btn" onClick={onComplete}>
              Skip ({countdown}s)
            </button>
          </div>

          <div style={{
            fontFamily: "'Inter', sans-serif", fontWeight: '300',
            fontSize: '12px', color: '#2a2a2a',
          }}>
            Redirecting automatically in {countdown} second{countdown !== 1 ? 's' : ''}
          </div>
        </div>

      </div>
    </div>
  )
}

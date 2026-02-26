import { useState } from 'react'

const CATEGORIES = [
  { id: 'feature', label: '✨ Feature idea' },
  { id: 'bug',     label: '🐛 Something broken' },
  { id: 'report',  label: '📊 Report quality' },
  { id: 'other',   label: '💬 General feedback' },
]

export default function FeedbackWidget() {
  const [open, setOpen]         = useState(false)
  const [category, setCategory] = useState('feature')
  const [text, setText]         = useState('')
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  async function handleSubmit() {
    if (!text.trim()) return
    setLoading(true)
    try {
      // Store feedback in localStorage as a simple log
      // In production, POST this to a Formspree/Airtable/Notion endpoint
      const existing = JSON.parse(localStorage.getItem('hc_feedback') || '[]')
      existing.push({
        category,
        text,
        email: email || null,
        ts: new Date().toISOString(),
      })
      localStorage.setItem('hc_feedback', JSON.stringify(existing))

      // If a Formspree endpoint is configured, also post there
      const endpoint = import.meta.env.VITE_FORMSPREE_URL
      if (endpoint) {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, text, email }),
        })
      }

      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); setText(''); setEmail(''); setCategory('feature') }, 2200)
    } catch {
      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); setText(''); setEmail('') }, 2200)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .fb-tab {
          position: fixed; bottom: 80px; right: 0;
          background: #ff6b35; color: #0a0a0a;
          font-family: 'Space Mono', monospace; font-weight: 700;
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          padding: 10px 14px; cursor: pointer; border: none;
          writing-mode: vertical-rl; text-orientation: mixed;
          transform: rotate(180deg);
          border-radius: 4px 0 0 4px;
          transition: background 0.2s, padding 0.2s;
          z-index: 900;
        }
        .fb-tab:hover { background: #ff8c5a; padding-left: 18px; }
        .fb-panel {
          position: fixed; bottom: 40px; right: 20px;
          width: 340px; background: #111; border: 1px solid #2a2a2a;
          box-shadow: 0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px #ff6b3510;
          z-index: 901; animation: slideInRight 0.25s ease;
          border-radius: 4px;
        }
        .fb-close {
          background: none; border: none; color: #444; cursor: pointer;
          font-size: 18px; line-height: 1; padding: 4px; transition: color 0.2s;
        }
        .fb-close:hover { color: #888; }
        .cat-pill {
          font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 0.08em; padding: 6px 10px; cursor: pointer;
          border: 1px solid #222; background: transparent; color: #555;
          transition: all 0.15s; border-radius: 2px;
        }
        .cat-pill.active { border-color: #ff6b3566; color: #ff6b35; background: #ff6b3508; }
        .cat-pill:hover { border-color: #333; color: #888; }
        .fb-textarea {
          width: 100%; background: #0a0a0a; border: 1px solid #222;
          color: #e5e5e5; font-family: 'Lora', serif; font-size: 14px;
          line-height: 1.6; padding: 12px 14px; resize: none;
          transition: border-color 0.2s; border-radius: 2px;
        }
        .fb-textarea:focus { outline: none; border-color: #ff6b3566; }
        .fb-textarea::placeholder { color: #333; }
        .fb-email {
          width: 100%; background: #0a0a0a; border: 1px solid #222;
          color: #e5e5e5; font-family: 'Space Mono', monospace; font-size: 12px;
          padding: 10px 14px; letter-spacing: 0.04em; border-radius: 2px;
          transition: border-color 0.2s;
        }
        .fb-email:focus { outline: none; border-color: #ff6b3566; }
        .fb-email::placeholder { color: #333; }
        .fb-submit {
          width: 100%; background: #ff6b35; color: #0a0a0a; border: none;
          padding: 12px; font-family: 'Space Mono', monospace; font-weight: 700;
          font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s; border-radius: 2px;
        }
        .fb-submit:hover:not(:disabled) { background: #ff8c5a; }
        .fb-submit:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {/* Tab trigger */}
      {!open && (
        <button className="fb-tab" onClick={() => setOpen(true)}>
          Feedback
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fb-panel">
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderBottom: '1px solid #1a1a1a'
          }}>
            <div>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: '10px',
                color: '#ff6b35', letterSpacing: '0.2em', textTransform: 'uppercase'
              }}>Make Heat Check Better</div>
            </div>
            <button className="fb-close" onClick={() => setOpen(false)}>×</button>
          </div>

          {done ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>🔥</div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px',
                color: '#ff6b35', letterSpacing: '0.04em', marginBottom: '8px'
              }}>Thanks!</div>
              <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', color: '#666', fontSize: '13px' }}>
                Your feedback shapes what we build next.
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Category pills */}
              <div>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '9px',
                  color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px'
                }}>Category</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      className={`cat-pill${category === c.id ? ' active' : ''}`}
                      onClick={() => setCategory(c.id)}
                    >{c.label}</button>
                  ))}
                </div>
              </div>

              {/* Feedback text */}
              <div>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '9px',
                  color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px'
                }}>Your feedback</div>
                <textarea
                  className="fb-textarea"
                  rows={4}
                  placeholder={
                    category === 'feature' ? "What would make this more useful for you?" :
                    category === 'bug'     ? "What went wrong? What did you expect?" :
                    category === 'report'  ? "Was the analysis accurate? What was off?" :
                    "Tell us anything on your mind..."
                  }
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
              </div>

              {/* Optional email */}
              <div>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '9px',
                  color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px'
                }}>Email (optional — we'll reply)</div>
                <input
                  className="fb-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <button
                className="fb-submit"
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
              >
                {loading ? 'Sending...' : 'Send Feedback →'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

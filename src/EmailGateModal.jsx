import { useState } from 'react'

export default function EmailGateModal({ onSuccess, onDismiss }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email.includes('@')) { setError('Enter a valid email address.'); return }
    setLoading(true)
    setError('')
    try {
      await fetch('https://docs.google.com/forms/d/13vr511HgpXJIOUu24ySYOh11WL4w_1L2K7PpiGl9S44/formResponse', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `entry.45752686=${encodeURIComponent(email)}`
      })
    } catch {
      // Ignore errors — don't punish users for network issues
    } finally {
      setLoading(false)
    }
    // Always grant the bonus regardless of response
    setDone(true)
    setTimeout(() => onSuccess(email), 1400)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
      animation: 'fadeIn 0.2s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes checkPop { 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }
        .email-input { 
          width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a;
          color: #e5e5e5; font-family: 'Space Mono', monospace; font-size: 13px;
          padding: 14px 16px; letter-spacing: 0.04em; transition: border-color 0.2s;
        }
        .email-input:focus { outline: none; border-color: #ff6b3566; }
        .email-input::placeholder { color: #3a3a3a; }
        .email-btn {
          width: 100%; background: #ff6b35; color: #0a0a0a; border: none;
          padding: 14px; font-family: 'Space Mono', monospace; font-weight: 700;
          font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s; margin-top: 10px;
        }
        .email-btn:hover:not(:disabled) { background: #ff8c5a; }
        .email-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .skip-btn {
          background: none; border: none; color: #444; font-family: 'Space Mono', monospace;
          font-size: 11px; cursor: pointer; letter-spacing: 0.08em; padding: 10px;
          width: 100%; transition: color 0.2s; margin-top: 4px;
        }
        .skip-btn:hover { color: #666; }
      `}</style>

      <div style={{
        background: '#111', border: '1px solid #222',
        maxWidth: '420px', width: '100%', padding: '44px 36px',
        animation: 'slideUp 0.28s ease', textAlign: 'center'
      }}>
        {done ? (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'checkPop 0.4s ease' }}>🔥</div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px',
              color: '#ff6b35', letterSpacing: '0.04em', marginBottom: '10px'
            }}>Bonus Check Unlocked</div>
            <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', color: '#666', fontSize: '14px' }}>
              Taking you back in...
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>📬</div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: '10px',
              color: '#ff6b35', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '14px'
            }}>You've used your free checks</div>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '38px',
              color: '#fff', letterSpacing: '0.04em', lineHeight: 0.95, marginBottom: '18px'
            }}>
              GET ONE<br /><span style={{ color: '#ff6b35' }}>MORE FREE</span>
            </h2>
            <p style={{
              fontFamily: "'Lora', serif", fontStyle: 'italic',
              color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px'
            }}>
              Drop your email and we'll send you founder tips, new features, and early access deals. Plus one bonus Heat Check on us.
            </p>

            <input
              className="email-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {error && (
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: '11px',
                color: '#f87171', marginTop: '8px', textAlign: 'left', letterSpacing: '0.04em'
              }}>{error}</div>
            )}
            <button className="email-btn" onClick={handleSubmit} disabled={loading || !email}>
              {loading ? 'Saving...' : 'Unlock Bonus Check →'}
            </button>
            <button className="skip-btn" onClick={onDismiss}>
              No thanks, I'll pay instead
            </button>
          </>
        )}
      </div>
    </div>
  )
}

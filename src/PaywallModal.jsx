import React from 'react'

const STRIPE_SINGLE = import.meta.env.VITE_STRIPE_SINGLE_LINK || 'https://buy.stripe.com/YOUR_SINGLE_LINK'
const STRIPE_PACK   = import.meta.env.VITE_STRIPE_PACK_LINK   || 'https://buy.stripe.com/YOUR_PACK_LINK'

export default function PaywallModal({ onDismiss }) {
  function go(type) {
    const base = window.location.origin + `?payment=${type}`
    const url = type === 'pack' ? STRIPE_PACK : STRIPE_SINGLE
    window.location.href = `${url}?success_url=${encodeURIComponent(base)}`
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
        .plan-card {
          flex: 1; background: #0a0a0a; border: 1px solid #222;
          padding: 24px 20px; cursor: pointer; transition: all 0.2s; text-align: center;
        }
        .plan-card:hover { border-color: #ff6b3566; transform: translateY(-2px); }
        .plan-card.featured { border-color: #ff6b3544; background: #0f0f0f; position: relative; }
        .plan-card.featured:hover { border-color: #ff6b35; }
        .buy-btn {
          width: 100%; border: none; padding: 13px;
          font-family: 'Space Mono', monospace; font-weight: 700;
          font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s; margin-top: 16px;
        }
        .buy-btn.primary { background: #ff6b35; color: #0a0a0a; }
        .buy-btn.primary:hover { background: #ff8c5a; }
        .buy-btn.secondary { background: transparent; color: #888; border: 1px solid #333; }
        .buy-btn.secondary:hover { border-color: #555; color: #aaa; }
        .dismiss-btn {
          background: none; border: none; color: #333; font-family: 'Space Mono', monospace;
          font-size: 11px; cursor: pointer; letter-spacing: 0.08em;
          padding: 12px; width: 100%; transition: color 0.2s; margin-top: 8px;
        }
        .dismiss-btn:hover { color: #555; }
      `}</style>

      <div style={{
        background: '#111', border: '1px solid #1e1e1e',
        maxWidth: '500px', width: '100%', padding: '44px 36px',
        animation: 'slideUp 0.28s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔥</div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: '10px',
            color: '#ff6b35', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '12px'
          }}>Out of Free Checks</div>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px',
            color: '#fff', letterSpacing: '0.04em', lineHeight: 0.95
          }}>
            KEEP THE<br /><span style={{ color: '#ff6b35' }}>HEAT ON</span>
          </h2>
        </div>

        {/* Plans side by side */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
          {/* Single check */}
          <div className="plan-card" onClick={() => go('single')}>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: '10px',
              color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px'
            }}>One-time</div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '44px',
              color: '#e5e5e5', lineHeight: 1
            }}>$7</div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: '10px',
              color: '#444', letterSpacing: '0.1em', marginTop: '4px', marginBottom: '12px'
            }}>1 check</div>
            <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', color: '#555', fontSize: '13px' }}>
              Try it once, no commitment.
            </div>
            <button className="buy-btn secondary" onClick={e => { e.stopPropagation(); go('single') }}>
              Buy One Check
            </button>
          </div>

          {/* Founder pack */}
          <div className="plan-card featured" onClick={() => go('pack')}>
            <div style={{
              position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)',
              background: '#ff6b35', color: '#0a0a0a',
              fontFamily: "'Space Mono', monospace", fontWeight: '700',
              fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '4px 12px', whiteSpace: 'nowrap'
            }}>Best Value</div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: '10px',
              color: '#ff6b35', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px'
            }}>Founder Pack</div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '44px',
              color: '#ff6b35', lineHeight: 1
            }}>$49</div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: '10px',
              color: '#666', letterSpacing: '0.1em', marginTop: '4px', marginBottom: '12px'
            }}>10 checks · $4.90 each</div>
            <div style={{ fontFamily: "'Lora', serif", fontStyle: 'italic', color: '#777', fontSize: '13px' }}>
              For serial idea machines. 30% off per check.
            </div>
            <button className="buy-btn primary" onClick={e => { e.stopPropagation(); go('pack') }}>
              Get Founder Pack 🔥
            </button>
          </div>
        </div>

        <button className="dismiss-btn" onClick={onDismiss}>
          ← Go back
        </button>
      </div>
    </div>
  )
}

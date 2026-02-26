# 🔥 Heat Check v1.1

> Think you have the hottest idea to build an app or new business? Let us check it for you.

AI-powered startup idea validator. Brutal, honest revenue reports — target customer,
pricing strategy, acquisition tactics, competitors, and a final verdict.

---

## What's New in v1.1

- **Revised monetization** — pay-per-report ($7 single / $49 Founder Pack of 10) instead of $29/mo subscription
- **Email gate** — 2 free checks → email unlock (+1 bonus check) → paywall
- **Feedback widget** — slide-in tab lets users submit categorized feedback
- **Checks counter** — live flame indicators showing remaining checks

---

## Deploy in 15 Minutes

### 1. Anthropic API Key
→ [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

### 2. Stripe Payment Links (create two)
→ [dashboard.stripe.com](https://dashboard.stripe.com) → Payment Links

| Link | Price | Type | Success Redirect |
|------|-------|------|-----------------|
| Single check | $7 | One-time | `https://YOURDOMAIN.com?payment=single` |
| Founder Pack | $49 | One-time | `https://YOURDOMAIN.com?payment=pack` |

### 3. Email capture (optional but recommended)
→ [beehiiv.com](https://beehiiv.com) → Create free newsletter → Settings → Embed → copy form URL

### 4. Feedback collection (optional)
→ [formspree.io](https://formspree.io) → New form → copy endpoint URL

### 5. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → Add New Project
2. Drag this folder in OR connect your GitHub repo
3. Add environment variables:
   ```
   VITE_ANTHROPIC_API_KEY      = sk-ant-...
   VITE_STRIPE_SINGLE_LINK     = https://buy.stripe.com/...
   VITE_STRIPE_PACK_LINK       = https://buy.stripe.com/...
   VITE_BEEHIIV_FORM_URL       = https://embeds.beehiiv.com/...  (optional)
   VITE_FORMSPREE_URL          = https://formspree.io/f/...       (optional)
   ```
4. Click Deploy — you're live 🔥

---

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                   # → http://localhost:5173
```

---

## How the Monetization Flow Works

```
Visit site
  └─ 2 FREE checks (no friction)
       └─ Out of checks?
            └─ No email yet? → EMAIL GATE → +1 bonus check
                 └─ Still out? → PAYWALL
                      ├─ $7 Single check (Stripe one-time)
                      └─ $49 Founder Pack — 10 checks (Stripe one-time)
```

Payment redirects back with `?payment=single` or `?payment=pack`,
which the app detects and credits the user immediately.

---

## Revenue Math

| Sales | Revenue |
|-------|---------|
| 10 single checks | $70 |
| 10 Founder Packs | $490 |
| 100 Founder Packs | $4,900 |
| 100 singles + 50 packs | $3,150 |

No subscriptions means less churn anxiety. Focus on acquisition.

---

## Stack

- **React 18 + Vite** — frontend
- **Claude Sonnet** via Anthropic API — AI analysis  
- **Stripe Payment Links** — monetization (no backend required)
- **Beehiiv** — email list (optional)
- **Formspree** — feedback collection (optional)
- **Vercel** — hosting

---

## Next Steps

1. Share in Greg Isenberg / McKay Wrigley / Riley Brown communities
2. Post on Product Hunt under "AI Tools" and "No-Code"
3. Add report history (requires Supabase + Clerk auth)
4. Build team/agency plan: $199 for 50 checks/month
5. Use your email list to announce new features and drive repeat purchases

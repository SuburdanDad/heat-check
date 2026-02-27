import { useState, useEffect, useRef } from 'react'

export const FREE_LIMIT   = 1   // 1 free check
export const EMAIL_BONUS  = 1   // +1 for email = 2 total free
export const PRICE_SINGLE = 7
export const PRICE_PACK   = 49
export const PACK_SIZE    = 10

const KEYS = {
  checksUsed:   'hc_checks_used',
  emailGiven:   'hc_email_given',
  packChecks:   'hc_pack_checks',
  singleChecks: 'hc_single_checks',
  fingerprint:  'hc_fingerprint',
}

function getNum(key) {
  return parseInt(localStorage.getItem(key) || '0', 10)
}

function buildFingerprint() {
  const parts = [
    navigator.language,
    navigator.platform,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || '',
    navigator.maxTouchPoints || '',
  ]
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('heatcheck🔥', 2, 2)
    parts.push(canvas.toDataURL().slice(-32))
  } catch {}
  const str = parts.join('|')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return 'fp_' + Math.abs(hash).toString(36)
}

function getOrCreateFingerprint() {
  let fp = localStorage.getItem(KEYS.fingerprint)
  if (!fp) {
    fp = buildFingerprint()
    localStorage.setItem(KEYS.fingerprint, fp)
  }
  return fp
}

async function serverGet(fingerprint) {
  try {
    const res = await fetch('/api/check-fingerprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint, action: 'get' }),
    })
    return await res.json()
  } catch {
    return { trusted: false }
  }
}

async function serverIncrement(fingerprint) {
  try {
    await fetch('/api/check-fingerprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint, action: 'increment' }),
    })
  } catch {}
}

async function serverEmail(fingerprint) {
  try {
    await fetch('/api/check-fingerprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint, action: 'email' }),
    })
  } catch {}
}

export function usePaywall() {
  const [checksUsed,   setChecksUsed]  = useState(0)
  const [emailGiven,   setEmailGiven]  = useState(false)
  const [packChecks,   setPackChecks]  = useState(0)
  const [singleChecks, setSingleChecks] = useState(0)
  const [showPaywall,  setShowPaywall] = useState(false)
  const [showEmail,    setShowEmail]   = useState(false)
  const [serverSynced, setServerSynced] = useState(false)
  const fingerprintRef = useRef(null)

  useEffect(() => {
    setChecksUsed(getNum(KEYS.checksUsed))
    setEmailGiven(localStorage.getItem(KEYS.emailGiven) === 'true')
    setPackChecks(getNum(KEYS.packChecks))
    setSingleChecks(getNum(KEYS.singleChecks))
    fingerprintRef.current = getOrCreateFingerprint()
  }, [])

  useEffect(() => {
    if (!fingerprintRef.current) return
    serverGet(fingerprintRef.current).then(data => {
      if (!data.trusted) { setServerSynced(true); return }
      const serverUsed  = data.checksUsed || 0
      const serverEmail = data.emailGiven || false
      const localUsed   = getNum(KEYS.checksUsed)
      const localEmail  = localStorage.getItem(KEYS.emailGiven) === 'true'
      if (serverUsed > localUsed) {
        localStorage.setItem(KEYS.checksUsed, String(serverUsed))
        setChecksUsed(serverUsed)
      }
      if (serverEmail && !localEmail) {
        localStorage.setItem(KEYS.emailGiven, 'true')
        setEmailGiven(true)
      }
      setServerSynced(true)
    })
  }, [])

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    if (payment === 'pack') {
      const next = getNum(KEYS.packChecks) + PACK_SIZE
      localStorage.setItem(KEYS.packChecks, String(next))
      setPackChecks(next)
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (payment === 'single') {
      const next = getNum(KEYS.singleChecks) + 1
      localStorage.setItem(KEYS.singleChecks, String(next))
      setSingleChecks(next)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const freeChecksEarned = FREE_LIMIT + (emailGiven ? EMAIL_BONUS : 0)
  const hasPaidChecks    = packChecks > 0 || singleChecks > 0
  const freeRemaining    = Math.max(0, freeChecksEarned - checksUsed)
  const canCheck         = freeRemaining > 0 || hasPaidChecks

  function checksRemaining() {
    if (hasPaidChecks) return packChecks + singleChecks
    return freeRemaining
  }

  function incrementChecks() {
    if (packChecks > 0) {
      const next = packChecks - 1
      localStorage.setItem(KEYS.packChecks, String(next))
      setPackChecks(next)
    } else if (singleChecks > 0) {
      const next = singleChecks - 1
      localStorage.setItem(KEYS.singleChecks, String(next))
      setSingleChecks(next)
    } else {
      const next = checksUsed + 1
      localStorage.setItem(KEYS.checksUsed, String(next))
      setChecksUsed(next)
      if (fingerprintRef.current) serverIncrement(fingerprintRef.current)
    }
  }

  function grantEmailBonus() {
    localStorage.setItem(KEYS.emailGiven, 'true')
    setEmailGiven(true)
    setShowEmail(false)
    if (fingerprintRef.current) serverEmail(fingerprintRef.current)
  }

  function requestCheck() {
    if (canCheck) return true
    if (!emailGiven) { setShowEmail(true); return false }
    setShowPaywall(true)
    return false
  }

  return {
    canCheck,
    checksRemaining: checksRemaining(),
    freeRemaining,
    emailGiven,
    hasPaidChecks,
    packChecks,
    singleChecks,
    showPaywall,
    showEmail,
    serverSynced,
    fingerprint: fingerprintRef.current,
    setShowPaywall,
    setShowEmail,
    grantEmailBonus,
    incrementChecks,
    requestCheck,
    FREE_LIMIT,
    EMAIL_BONUS,
    freeChecksEarned,
  }
}

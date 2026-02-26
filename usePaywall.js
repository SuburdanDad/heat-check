import { useState, useEffect } from 'react'

export const FREE_LIMIT = 2
export const EMAIL_BONUS = 1
export const PRICE_SINGLE = 7
export const PRICE_PACK = 49
export const PACK_SIZE = 10

const KEYS = {
  checksUsed:    'hc_checks_used',
  emailGiven:    'hc_email_given',
  packChecks:    'hc_pack_checks',
  singleChecks:  'hc_single_checks',
}

function getNum(key) {
  return parseInt(localStorage.getItem(key) || '0', 10)
}

export function usePaywall() {
  const [checksUsed,   setChecksUsed]   = useState(0)
  const [emailGiven,   setEmailGiven]   = useState(false)
  const [packChecks,   setPackChecks]   = useState(0)
  const [singleChecks, setSingleChecks] = useState(0)
  const [showPaywall,  setShowPaywall]  = useState(false)
  const [showEmail,    setShowEmail]    = useState(false)

  useEffect(() => {
    setChecksUsed(getNum(KEYS.checksUsed))
    setEmailGiven(localStorage.getItem(KEYS.emailGiven) === 'true')
    setPackChecks(getNum(KEYS.packChecks))
    setSingleChecks(getNum(KEYS.singleChecks))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
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
  const hasPaidChecks = packChecks > 0 || singleChecks > 0
  const freeRemaining = Math.max(0, freeChecksEarned - checksUsed)
  const canCheck = freeRemaining > 0 || hasPaidChecks

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
    }
  }

  function grantEmailBonus() {
    localStorage.setItem(KEYS.emailGiven, 'true')
    setEmailGiven(true)
    setShowEmail(false)
  }

  function requestCheck() {
    if (canCheck) return true
    if (!emailGiven) {
      setShowEmail(true)
      return false
    }
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

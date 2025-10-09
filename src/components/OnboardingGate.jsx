import React, { useEffect, useMemo, useState } from 'react'
import { getOnboardingSlides } from '../services/publicService'
import { useAuth } from '../context/AuthContext.jsx'

export default function OnboardingGate() {
  const { user } = useAuth()
  const [slides, setSlides] = useState([])
  const [visible, setVisible] = useState(false)
  const [idx, setIdx] = useState(0)
  const [ackKey, setAckKey] = useState('')

  const uid = user?._id || user?.id || 'anon'

  const canShow = useMemo(() => {
    // Only for approved users
    return !!user && user.status === 'approved'
  }, [user])

  useEffect(() => {
    if (!canShow) return
    let mounted = true
    ;(async () => {
      try {
        const data = await getOnboardingSlides()
        const enabled = !!data?.enabled && Array.isArray(data?.images) && data.images.length > 0
        if (!mounted || !enabled) return
        const updatedAt = data.updatedAt ? String(data.updatedAt) : ''
        const key = `onboarding_ack_${uid}_${updatedAt}`
        setAckKey(key)
        const seenKey = `onboarding_seen_at_${uid}`
        const lastSeen = Number(localStorage.getItem(seenKey) || '0')
        const now = Date.now()
        const oneDayMs = 24 * 60 * 60 * 1000
        const within24h = lastSeen && (now - lastSeen) < oneDayMs
        const alreadyAck = localStorage.getItem(key) === '1'
        // If content updated, ignore prior ack to force show once even within 24h
        const shouldShow = !within24h || !alreadyAck
        setSlides(data.images.slice(0, 6))
        setIdx(0)
        setVisible(shouldShow)
      } catch (_) {}
    })()
    return () => { mounted = false }
  }, [canShow, uid])

  if (!visible || !slides.length) return null

  const onDismiss = () => {
    if (ackKey) localStorage.setItem(ackKey, '1')
    localStorage.setItem(`onboarding_seen_at_${uid}`, String(Date.now()))
    setVisible(false)
  }

  const onNext = () => {
    if (idx < slides.length - 1) setIdx(idx + 1)
    else onDismiss()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-[92%] max-w-3xl overflow-hidden border" style={{ borderColor: '#D4AF37' }}>
        <div className="w-full max-h-[70vh] overflow-auto bg-black flex items-center justify-center">
          {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
          <img src={slides[idx]} alt={`Slide ${idx+1}`} className="w-full h-auto object-contain" />
        </div>
        <div className="p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg font-semibold"
            style={{ backgroundColor: '#F5F5DC', color: '#B8860B', border: '1px solid #D4AF37' }}
          >
            Skip
          </button>
          <div className="text-sm text-gray-500">{idx + 1} / {slides.length}</div>
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-2 text-white rounded-lg font-semibold"
            style={{ backgroundColor: '#B8860B' }}
          >
            {idx < slides.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  )
}

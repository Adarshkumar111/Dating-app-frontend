import React, { useEffect, useState } from 'react'
import { getPreAuthBanner } from '../services/publicService'

export default function PreAuthGate() {
  const [banner, setBanner] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getPreAuthBanner()
        if (!mounted) return
        const enabled = !!data?.enabled && !!data?.imageUrl
        if (!enabled) {
          setVisible(false)
          setBanner(null)
          return
        }
        const updatedAt = data.updatedAt ? String(data.updatedAt) : ''
        const ackKey = `preauth_ack_${updatedAt}`
        const alreadyOk = localStorage.getItem(ackKey) === '1'
        // Clear old keys if any
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('preauth_ack_') && k !== ackKey) localStorage.removeItem(k)
        })
        setBanner({ imageUrl: data.imageUrl, ackKey })
        setVisible(!alreadyOk)
      } catch (_) {
        // ignore fetch errors, do not block auth
      }
    })()

    const onRequire = async () => {
      // If we already have banner and not acknowledged, show it
      if (banner && banner.imageUrl) {
        const alreadyOk = localStorage.getItem(banner.ackKey) === '1'
        if (!alreadyOk) setVisible(true)
        return
      }
      // Else fetch latest
      try {
        const data = await getPreAuthBanner()
        const enabled = !!data?.enabled && !!data?.imageUrl
        if (!enabled) return
        const updatedAt = data.updatedAt ? String(data.updatedAt) : ''
        const ackKey = `preauth_ack_${updatedAt}`
        const alreadyOk = localStorage.getItem(ackKey) === '1'
        setBanner({ imageUrl: data.imageUrl, ackKey })
        if (!alreadyOk) setVisible(true)
      } catch (_) {}
    }
    window.addEventListener('preauth:require', onRequire)
    return () => { mounted = false }
  }, [])

  if (!visible || !banner) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-[90%] overflow-hidden border" style={{ borderColor: '#D4AF37' }}>
        <div className="w-full max-h-[70vh] overflow-auto bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.imageUrl} alt="Notice" className="w-full h-auto object-contain" />
        </div>
        <div className="p-4 flex justify-center">
          <button
            onClick={() => { localStorage.setItem(banner.ackKey, '1'); setVisible(false); }}
            className="px-6 py-3 text-white font-semibold rounded-lg"
            style={{ backgroundColor: '#B8860B' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

import { getPreAuthBanner } from '../services/publicService'

// Returns true if acknowledged or not required. If not acknowledged, triggers overlay and returns false.
export async function ensurePreAuthAcknowledged() {
  try {
    const data = await getPreAuthBanner()
    const enabled = !!data?.enabled && !!data?.imageUrl
    if (!enabled) return true
    const updatedAt = data.updatedAt ? String(data.updatedAt) : ''
    const ackKey = `preauth_ack_${updatedAt}`
    const alreadyOk = localStorage.getItem(ackKey) === '1'
    if (alreadyOk) return true
    // Ask overlay to show
    window.dispatchEvent(new CustomEvent('preauth:require'))
    return false
  } catch (_) {
    // If fetch fails, do not block auth
    return true
  }
}

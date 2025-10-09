import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getAppSettings, updateAppSettings, uploadPreAuthBanner } from '../../services/adminService'

export default function AdminPreAuthScreen() {
  const [loading, setLoading] = useState(false)
  const [preAuthBanner, setPreAuthBanner] = useState({ enabled: false, imageUrl: '' })

  const load = async () => {
    try {
      setLoading(true)
      const settings = await getAppSettings()
      setPreAuthBanner(settings?.preAuthBanner || { enabled: false, imageUrl: '' })
    } catch (e) {
      toast.error(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { imageUrl } = await uploadPreAuthBanner(file)
      setPreAuthBanner(prev => ({ ...prev, imageUrl }))
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      e.target.value = ''
    }
  }

  const onSave = async () => {
    try {
      await updateAppSettings({ preAuthBanner })
      toast.success('Saved')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || e.message)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-2xl font-bold mb-2 text-gray-800">Signup/Login Screen</h3>
      <p className="text-sm text-gray-500 mb-6">Set an image to show users before Login and Signup. Users must click Next to proceed.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <label className="flex items-center gap-2 p-3 border rounded-lg md:col-span-1">
          <input
            type="checkbox"
            checked={!!preAuthBanner.enabled}
            onChange={(e) => setPreAuthBanner({ ...preAuthBanner, enabled: e.target.checked })}
          />
          <span>Enable</span>
        </label>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={onFileSelected}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {!!preAuthBanner.imageUrl && (
            <div className="mt-3">
              <img src={preAuthBanner.imageUrl} alt="Preview" className="max-h-56 rounded border" />
            </div>
          )}
        </div>
      </div>

      <button
        disabled={loading}
        onClick={onSave}
        className={`mt-6 px-6 py-3 text-white rounded-lg font-semibold ${loading ? 'opacity-60' : ''}`}
        style={{ backgroundColor: '#B8860B' }}
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}

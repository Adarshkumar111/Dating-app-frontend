import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getAppSettings, updateAppSettings, uploadOnboardingSlides } from '../../services/adminService'

export default function AdminOnboardingSlides() {
  const [loading, setLoading] = useState(false)
  const [slides, setSlides] = useState({ enabled: false, images: [] })
  const [selectedFiles, setSelectedFiles] = useState([null, null, null, null, null, null])

  const load = async () => {
    try {
      setLoading(true)
      const settings = await getAppSettings()
      setSlides(settings?.onboardingSlides || { enabled: false, images: [] })
    } catch (e) {
      toast.error(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onSelectAt = (index) => (e) => {
    const file = e.target.files?.[0] || null
    setSelectedFiles(prev => {
      const next = [...prev]
      next[index] = file
      return next
    })
  }

  const onUploadSelected = async () => {
    const files = selectedFiles.filter(Boolean)
    if (files.length === 0) {
      toast.info('Please choose up to 6 images')
      return
    }
    try {
      setLoading(true)
      const { images } = await uploadOnboardingSlides(files)
      setSlides(prev => ({ ...prev, images: images || [] }))
      setSelectedFiles([null, null, null, null, null, null])
      toast.success('Images uploaded')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const onRemoveImage = (idx) => {
    setSlides(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
  }

  const onSave = async () => {
    try {
      await updateAppSettings({ onboardingSlides: { enabled: !!slides.enabled, images: slides.images || [] } })
      toast.success('Saved')
      await load()
    } catch (e) {
      toast.error(e.response?.data?.message || e.message)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-2xl font-bold mb-2 text-gray-800">Onboarding Slides (after Login/Signup)</h3>
      <p className="text-sm text-gray-500 mb-6">Upload up to 6 images. Users will see them after logging in, with Skip/Next/Get Started.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <label className="flex items-center gap-2 p-3 border rounded-lg md:col-span-1">
          <input
            type="checkbox"
            checked={!!slides.enabled}
            onChange={(e) => setSlides({ ...slides, enabled: e.target.checked })}
          />
          <span>Enable</span>
        </label>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Images (max 6)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="text-sm font-medium mb-1">Slide {i+1}</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onSelectAt(i)}
                  className="w-full px-3 py-2 border rounded"
                />
                {selectedFiles[i] && (
                  <div className="mt-1 text-xs text-gray-500 truncate">{selectedFiles[i].name}</div>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onUploadSelected}
            disabled={loading}
            className={`mt-3 px-4 py-2 text-white rounded-lg ${loading ? 'opacity-60' : ''}`}
            style={{ backgroundColor: '#B8860B' }}
          >
            {loading ? 'Uploading...' : 'Upload Selected'}
          </button>
          {slides.images && slides.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
              {slides.images.map((url, idx) => (
                <div key={idx} className="relative border rounded-lg overflow-hidden">
                  <img src={url} alt={`Slide ${idx+1}`} className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    className="absolute top-1 right-1 px-2 py-1 text-xs bg-red-600 text-white rounded"
                  >Remove</button>
                </div>
              ))}
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

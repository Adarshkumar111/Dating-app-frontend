import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signupStep4, getSignupStatus } from '../../services/authService'
import { toast } from 'react-toastify'

export default function Step4Photos(){
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState(Array(8).fill(null))

  useEffect(()=>{
    const token = localStorage.getItem('signupToken')
    if (!token) { nav('/signup/step-1'); return }
    getSignupStatus(token).catch(()=>{})
  },[nav])

  const handleFile = (idx, file) => {
    const next = [...slots]
    next[idx] = file || null
    setSlots(next)
  }

  const onNext = async (e)=>{
    e.preventDefault()
    const token = localStorage.getItem('signupToken')
    if (!token){ toast.error('Session expired. Start again.'); nav('/signup/step-1'); return }
    const any = slots.some(f => !!f)
    if (!any){ toast.error('Upload at least 1 photo'); return }
    try{
      setLoading(true)
      const fd = new FormData()
      slots.forEach(f => { if (f) fd.append('galleryImages', f) })
      await signupStep4(fd, token)
      toast.success('Saved. Continue to Step 5')
      nav('/signup/step-5')
    } catch(e){
      toast.error(e.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border" style={{borderColor:'#D4AF37'}}>
          <div className="px-6 py-6">
            <h2 className="text-lg font-bold mb-4" style={{color:'#B8860B'}}>Step 4: Photos Upload</h2>
            <p className="text-sm text-gray-600 mb-3">Upload up to 8 images (minimum 1 required).</p>
            <form onSubmit={onNext}>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({length:8}).map((_,i)=>{
                  const file = slots[i]
                  return (
                    <label key={i} className="block aspect-square rounded-lg overflow-hidden border border-yellow-300 bg-yellow-50 cursor-pointer">
                      {file ? (
                        <img src={URL.createObjectURL(file)} alt={`slot-${i+1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Upload</div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e)=> handleFile(i, e.target.files?.[0]||null)} />
                    </label>
                  )
                })}
              </div>
              <button disabled={loading} type='submit' className={`w-full py-3 text-white font-semibold rounded-xl mt-4 ${loading?'opacity-50':''}`} style={{backgroundColor:'#B8860B'}}>
                {loading ? 'Saving...' : 'Next'}
              </button>
            </form>
            <div className="flex items-center justify-between mt-4 text-sm">
              <Link to='/signup/step-1' className="text-gray-600">New Register</Link>
              <Link to='/login' className="font-semibold" style={{color:'#B8860B'}}>Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

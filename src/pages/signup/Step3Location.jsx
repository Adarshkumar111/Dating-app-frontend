import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signupStep3, getSignupStatus } from '../../services/authService'
import { toast } from 'react-toastify'

export default function Step3Location(){
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [area, setArea] = useState('')

  // Manual inputs only
  const [country, setCountry] = useState('')
  const [stateName, setStateName] = useState('')
  const [district, setDistrict] = useState('')
  const [city, setCity] = useState('')

  useEffect(()=>{
    const token = localStorage.getItem('signupToken')
    if (!token) { nav('/signup/step-1'); return }
    getSignupStatus(token).catch(()=>{})
  },[nav])

  // No dropdowns to preload; manual entry only

  const onNext = async (e)=>{
    e.preventDefault()
    const token = localStorage.getItem('signupToken')
    if (!token){ toast.error('Session expired. Start again.'); nav('/signup/step-1'); return }
    try {
      setLoading(true)
      await signupStep3({ countryOfOrigin: country, state: stateName, district, city, area }, token)
      toast.success('Saved. Continue to Step 4')
      nav('/signup/step-4')
    } catch (e) {
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
            <h2 className="text-lg font-bold mb-4" style={{color:'#B8860B'}}>Step 3: Location</h2>
            <form onSubmit={onNext} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Country of Origin</label>
                <input value={country} onChange={(e)=> setCountry(e.target.value)} placeholder='Enter country' required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input value={stateName} onChange={(e)=> setStateName(e.target.value)} placeholder='Enter state' required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">District</label>
                <input value={district} onChange={(e)=> setDistrict(e.target.value)} placeholder='Enter district' required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Location / City You Live In</label>
                <input value={city} onChange={(e)=> setCity(e.target.value)} placeholder='Enter city' required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <input placeholder='Area (optional)' value={area} onChange={(e)=> setArea(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <button disabled={loading} type='submit' className={`w-full py-3 text-white font-semibold rounded-xl mt-2 ${loading?'opacity-50':''}`} style={{backgroundColor:'#B8860B'}}>
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

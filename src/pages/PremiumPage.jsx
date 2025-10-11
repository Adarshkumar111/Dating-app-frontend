import React, { useEffect, useMemo, useState } from 'react'
import api from '../services/http.js'
import { MdStar, MdCheck, MdFlashOn, MdPayment } from 'react-icons/md'
import { getMe } from '../services/userService.js'

export default function PremiumPage(){
  const [plans, setPlans] = useState([])
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [me, setMe] = useState(null)

  useEffect(() => {
    loadPlans()
    loadMe()
  }, [])

  const loadPlans = async () => {
    try {
      // Use public endpoint so regular users can see plans
      const { data } = await api.get('/public/premium-plans')
      setPlans(data)
      setLoading(false)
    } catch (e) {
      setInfo('Failed to load premium plans')
      setLoading(false)
    }
  }

  const loadMe = async () => {
    try {
      const data = await getMe()
      setMe(data)
    } catch (e) {
      // ignore if unauthenticated, page still loads
    }
  }

  const initiatePayment = async (plan) => {
    try {
      setProcessingPayment(true)
      setInfo('')

      // Create order
      const { data: orderData } = await api.post('/payment/create-order', {
        planId: plan._id
      })

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'M Nikah Premium',
        description: `${plan.name} - ${plan.duration} day${plan.duration > 1 ? 's' : ''}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const { data: verifyData } = await api.post('/payment/verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planId: plan._id
            })

            setInfo(`🎉 Premium activated successfully! Expires: ${new Date(verifyData.premiumExpiresAt).toLocaleDateString()}`)
            setProcessingPayment(false)

            // Refresh plans (optional)
            setTimeout(() => {
              window.location.reload()
            }, 2000)

          } catch (error) {
            setInfo('Payment verification failed. Please contact support.')
            setProcessingPayment(false)
          }
        },
        prefill: {
          // Can add user details if available
        },
        theme: {
          color: '#1E3A8A'
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(false)
          }
        }
      }

      // Avoid external app prompts (xdg-open/upi intents) on desktop by hiding UPI
      try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        if (!isMobile) {
          options.config = {
            ...(options.config || {}),
            display: { ...(options.config?.display || {}), hide: ['upi'] }
          }
        }
      } catch {}

      // Check if Razorpay is available (fallback for development)
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        // Fallback for development without Razorpay script
        console.log('Razorpay not loaded, using mock payment')
        // Simulate successful payment for development
        await new Promise(resolve => setTimeout(resolve, 1000))
        setInfo(`🎉 Mock payment successful! Premium activated for ${plan.name}`)
        setProcessingPayment(false)
      }

    } catch (error) {
      console.error('Payment initiation failed:', error)
      setInfo(error.response?.data?.message || 'Payment initiation failed')
      setProcessingPayment(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
        <p className="text-blue-800 font-medium">Loading premium plans...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FFF8E7] py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <MdStar className="text-yellow-500" /> Premium Plans
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upgrade to premium and unlock unlimited connections! Send more follow requests and find your perfect match faster.
          </p>
        </div>

        {info && (
          <div className={`mb-6 p-4 rounded-xl border ${
            info.includes('🎉')
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {info}
          </div>
        )}

        {me?.isPremium && (
          <div className="mb-10 bg-white rounded-2xl shadow-md p-6 border">
            {(() => {
              const now = new Date()
              const exp = me.premiumExpiresAt ? new Date(me.premiumExpiresAt) : null
              const remainDays = exp ? Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24))) : 0
              const tier = String(me.premiumTier || '').toLowerCase()
              const bg = tier === 'diamond' ? '#E0F7FF' : tier === 'gold' ? '#FCE7A2' : tier === 'silver' ? '#E5E7EB' : '#EFD6C2'
              const fg = tier === 'diamond' ? '#0EA5E9' : tier === 'gold' ? '#8B6B00' : tier === 'silver' ? '#4B5563' : '#7C4A21'
              const br = tier === 'diamond' ? '#38BDF8' : tier === 'gold' ? '#D4AF37' : tier === 'silver' ? '#C0C0C0' : '#CD7F32'
              const plan = plans.find(p => String(p._id) === String(me.premiumPlan)) || plans.find(p => String(p.tier).toLowerCase() === tier)
              const totalDays = plan?.duration ? Number(plan.duration) : null
              const usedDays = totalDays != null && exp ? Math.max(0, totalDays - remainDays) : null
              const progress = totalDays ? Math.min(100, Math.max(0, Math.round(((usedDays || 0) / totalDays) * 100))) : null
              return (
                <div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      {`Your ${tier ? tier.toUpperCase() : 'PREMIUM'}`}
                    </div>
                    <div className="text-sm text-gray-600">Remaining: <span className="font-semibold">{remainDays} day(s)</span></div>
                  </div>
                  {totalDays != null && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Used {usedDays} / {totalDays} days</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-2 bg-purple-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                  {plan?.features?.length > 0 && (
                    <div className="mt-4">
                      <p className="font-semibold text-gray-700 mb-2">Your Plan Features:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {plan.features.map((f, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        const el = document.getElementById('plans-grid')
                        if (el) el.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      Renew / Upgrade
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {plans.length === 0 ? (
          <div className="text-center py-20">
            <MdStar className="text-6xl mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Premium Plans Available</h3>
            <p className="text-gray-500">Premium plans are being configured. Please check back later!</p>
          </div>
        ) : (
          <div id="plans-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {(() => {
              // pick first plan per tier in fixed order to avoid duplicates
              const order = ['diamond','gold','silver','bronze']
              const firstPerTier = {}
              const deduped = []
              for (const p of plans) {
                const t = String(p.tier || '').toLowerCase()
                if (!firstPerTier[t]) {
                  firstPerTier[t] = p
                }
              }
              for (const t of order) {
                if (firstPerTier[t]) deduped.push(firstPerTier[t])
              }
              return deduped
            })().map((plan, index) => {
              const finalPrice = plan.price - (plan.price * plan.discount / 100)
              const isPopular = index === 1 // Middle plan is popular
              const tier = (plan.tier || '').toLowerCase()
              const tierBg = tier === 'diamond' ? '#E0F7FF' : tier === 'gold' ? '#FCE7A2' : tier === 'silver' ? '#E5E7EB' : tier === 'bronze' ? '#EFD6C2' : 'transparent'
              const tierFg = tier === 'diamond' ? '#0EA5E9' : tier === 'gold' ? '#8B6B00' : tier === 'silver' ? '#4B5563' : tier === 'bronze' ? '#7C4A21' : '#374151'
              const tierBr = tier === 'diamond' ? '#38BDF8' : tier === 'gold' ? '#D4AF37' : tier === 'silver' ? '#C0C0C0' : tier === 'bronze' ? '#CD7F32' : 'rgba(0,0,0,0.06)'

              return (
                <div
                  key={plan._id}
                  className={`relative bg-white rounded-2xl shadow-xl overflow-visible transform hover:scale-105 transition-all duration-300 ${
                    isPopular ? 'border-4 border-purple-500 ring-4 ring-purple-100' : 'border border-gray-200'
                  } flex flex-col h-full`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                        <MdFlashOn /> MOST POPULAR
                      </div>
                    </div>
                  )}

                  <div className={`p-8 ${isPopular ? 'bg-gradient-to-br from-purple-50 to-pink-50' : ''} flex flex-col h-full`}> 
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                        {plan.name}
                        {tier && (
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full border" style={{ backgroundColor: tierBg, color: tierFg, borderColor: tierBr }}>
                            {tier.toUpperCase()}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {plan.discount > 0 && (
                          <span className="text-lg text-gray-500 line-through">₹{plan.price}</span>
                        )}
                        <span className="text-4xl font-bold text-purple-600">₹{finalPrice}</span>
                      </div>
                      <p className="text-gray-600">{plan.duration} day{plan.duration > 1 ? 's' : ''}</p>
                      {plan.discount > 0 && (
                        <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold mt-2">
                          {plan.discount}% OFF
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mb-8 flex-1">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <MdCheck className="text-green-600 text-xl" />
                        <span className="font-semibold text-gray-800">
                          {plan.requestLimit} follow requests per day
                        </span>
                      </div>

                      {plan.features && plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <MdCheck className="text-green-600 text-xl flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => initiatePayment(plan)}
                      disabled={processingPayment}
                      className={`mt-auto w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                        isPopular
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-blue-900 hover:from-amber-500 hover:to-yellow-600 shadow-lg disabled:opacity-50'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      } ${processingPayment ? 'animate-pulse' : ''}`}
                    >
                      {processingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <MdPayment />
                          Buy {plan.name}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Why Choose Premium?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl mb-3">🚀</div>
              <h4 className="font-semibold text-gray-800 mb-2">More Connections</h4>
              <p className="text-gray-600">Send unlimited follow requests and connect with more people</p>
            </div>
            <div>
              <div className="text-4xl mb-3">⭐</div>
              <h4 className="font-semibold text-gray-800 mb-2">Priority Support</h4>
              <p className="text-gray-600">Get faster response times and dedicated customer support</p>
            </div>
            <div>
              <div className="text-4xl mb-3">💎</div>
              <h4 className="font-semibold text-gray-800 mb-2">Exclusive Features</h4>
              <p className="text-gray-600">Access premium-only features and advanced search filters</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

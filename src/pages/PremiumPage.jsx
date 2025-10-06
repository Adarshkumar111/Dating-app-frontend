import React, { useEffect, useState } from 'react'
import api from '../services/http.js'
import { MdStar, MdCheck, MdFlashOn, MdPayment } from 'react-icons/md'

export default function PremiumPage(){
  const [plans, setPlans] = useState([])
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    loadPlans()
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
        description: `${plan.name} - ${plan.duration} month${plan.duration > 1 ? 's' : ''}`,
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
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

        {plans.length === 0 ? (
          <div className="text-center py-20">
            <MdStar className="text-6xl mx-auto mb-4 text-gray-300" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Premium Plans Available</h3>
            <p className="text-gray-500">Premium plans are being configured. Please check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const finalPrice = plan.price - (plan.price * plan.discount / 100)
              const isPopular = index === 1 // Middle plan is popular

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
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {plan.discount > 0 && (
                          <span className="text-lg text-gray-500 line-through">₹{plan.price}</span>
                        )}
                        <span className="text-4xl font-bold text-purple-600">₹{finalPrice}</span>
                      </div>
                      <p className="text-gray-600">{plan.duration} month{plan.duration > 1 ? 's' : ''}</p>
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

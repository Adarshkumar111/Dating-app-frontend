import React, { useEffect, useState } from 'react'
import { getPremiumPlans } from '../services/adminService.js'
import { MdStar, MdCheck, MdFlashOn } from 'react-icons/md'

export default function PremiumPage(){
  const [plans, setPlans] = useState([])
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const data = await getPremiumPlans()
      setPlans(data)
      setLoading(false)
    } catch (e) {
      setInfo('Failed to load premium plans')
      setLoading(false)
    }
  }

  const onSubscribe = async (planId) => {
    try {
      // Mock payment - in real app, integrate with payment gateway
      setInfo('Payment integration coming soon! Contact admin for premium access.')
    } catch (e) {
      setInfo(e.response?.data?.message || 'Payment failed')
    }
  }

  if (loading) return <div className="text-center mt-20">Loading premium plans...</div>

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
          <MdStar className="text-yellow-500" /> Premium Plans
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upgrade to premium and unlock unlimited connections! Send more follow requests and find your perfect match faster.
        </p>
      </div>

      {info && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-center">
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
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 ${
                  isPopular ? 'border-4 border-purple-500 ring-4 ring-purple-100' : 'border border-gray-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-purple-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      <MdFlashOn /> MOST POPULAR
                    </div>
                  </div>
                )}

                <div className={`p-8 ${isPopular ? 'bg-gradient-to-br from-purple-50 to-pink-50' : ''}`}>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {plan.discount > 0 && (
                        <span className="text-lg text-gray-500 line-through">${plan.price}</span>
                      )}
                      <span className="text-4xl font-bold text-purple-600">${finalPrice}</span>
                    </div>
                    <p className="text-gray-600">{plan.duration} month{plan.duration > 1 ? 's' : ''}</p>
                    {plan.discount > 0 && (
                      <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold mt-2">
                        {plan.discount}% OFF
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
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
                    onClick={() => onSubscribe(plan._id)}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                      isPopular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                  >
                    Choose {plan.name}
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
  )
}

import React, { useEffect, useState } from 'react'
import { listPlans } from '../services/adminService.js'
import { subscribe } from '../services/paymentService.js'

export default function PremiumPage(){
  const [plans, setPlans] = useState([])
  const [info, setInfo] = useState('')
  useEffect(()=>{ (async()=> setPlans(await listPlans()))() },[])
  const onSubscribe = async (planId)=>{
    try{
      await subscribe({ planId, paymentDetails: { mock: true } })
      setInfo('Subscription activated!')
    }catch(e){ setInfo(e.response?.data?.message || 'Payment failed') }
  }
  return (
    <div style={{maxWidth:700, margin:'20px auto'}}>
      <h2>Premium Plans</h2>
      {plans.map(p=> (
        <div key={p._id} style={{border:'1px solid #ddd',padding:12,margin:'8px 0',borderRadius:8}}>
          <strong>{p.name}</strong> - Rs {p.price} for {p.durationDays} days • {p.requestLimitPerDay} requests/day
          <div>
            <button onClick={()=> onSubscribe(p._id)}>Subscribe</button>
          </div>
        </div>
      ))}
      {info && <p>{info}</p>}
    </div>
  )
}

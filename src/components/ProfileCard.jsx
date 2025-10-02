import React from 'react'
import { Link } from 'react-router-dom'

export default function ProfileCard({ user, onRequest }){
  return (
    <div style={{background:'#f7f7fb',margin:'8px 0',padding:'12px',borderRadius:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <strong>{user.name}</strong> <span>• {user.age || 'N/A'} • {user.location || ''}</span>
          <div style={{fontSize:12,color:'#666'}}>{user.about?.slice(0,80)}</div>
        </div>
        <div>
          <Link to={`/profile/${user._id}`} style={{marginRight:8}}>View</Link>
          <button onClick={()=>onRequest(user._id)}>Request</button>
        </div>
      </div>
    </div>
  )
}

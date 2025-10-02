import React from 'react'

export default function RequestModal({ requests, onAccept, onReject, onClose }){
  if (!requests || requests.length === 0) return null
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'grid',placeItems:'center'}}>
      <div style={{background:'#fff',padding:20,borderRadius:8,maxWidth:500,width:'90%'}}>
        <h3>Incoming Requests</h3>
        {requests.map(r=> (
          <div key={r._id} style={{border:'1px solid #ddd',padding:12,margin:'8px 0',borderRadius:8}}>
            <strong>{r.from?.name}</strong> wants to connect
            <div style={{marginTop:8}}>
              <button onClick={()=>onAccept(r._id)} style={{marginRight:8}}>Accept</button>
              <button onClick={()=>onReject(r._id)}>Reject</button>
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{marginTop:12}}>Close</button>
      </div>
    </div>
  )
}

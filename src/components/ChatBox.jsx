import React, { useState } from 'react'

export default function ChatBox({ messages, onSend }){
  const [text, setText] = useState('')
  const handleSubmit = (e)=>{
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }
  return (
    <div>
      <div style={{border:'1px solid #ddd',padding:12,height:400,overflowY:'auto',background:'#fafafa'}}>
        {messages.map((m,i)=> (
          <div key={i} style={{margin:'6px 0',padding:'6px 10px',background:'#fff',borderRadius:6}}>
            {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{display:'flex',gap:8,marginTop:8}}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder='Type message' style={{flex:1,padding:8}} />
        <button type='submit'>Send</button>
      </form>
    </div>
  )
}

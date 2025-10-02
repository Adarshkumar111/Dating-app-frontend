import React from 'react'

export default function AdminUserList({ users, onApprove, onDelete }){
  return (
    <table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead>
        <tr style={{background:'#eef'}}>
          <th style={{padding:8,textAlign:'left'}}>Name</th>
          <th>Status</th>
          <th>Gender</th>
          <th>Contact</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map(u=> (
          <tr key={u._id} style={{borderBottom:'1px solid #ddd'}}>
            <td style={{padding:8}}>{u.name}</td>
            <td>{u.status}</td>
            <td>{u.gender}</td>
            <td>{u.contact}</td>
            <td>
              {u.status === 'pending' && <button onClick={()=>onApprove(u._id)}>Approve</button>}
              <button onClick={()=>onDelete(u._id)} style={{marginLeft:4}}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

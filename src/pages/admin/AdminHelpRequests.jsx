import React, { useEffect, useState } from 'react'
import { listHelpRequests, getHelpRequestById, respondHelpRequest, deleteHelpRequest } from '../../services/helpService.js'
import { MdSearch, MdCheck, MdClose, MdChat, MdDelete } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

export default function AdminHelpRequests() {
  const [status, setStatus] = useState('pending')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const nav = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const data = await listHelpRequests(status)
      setItems(Array.isArray(data) ? data : [])
      if (selectedId) {
        const fresh = await getHelpRequestById(selectedId)
        setSelected(fresh)
      }
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  const openDetail = async (id) => {
    setSelectedId(id)
    try { setSelected(await getHelpRequestById(id)) } catch(_) {}
  }

  const act = async (action) => {
    if (!selectedId) return
    setLoading(true)
    try {
      await respondHelpRequest({ helpRequestId: selectedId, action })
      toast.success(`Help request ${action}d successfully`)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} help request`)
    }
    setLoading(false)
  }

  const handleDelete = () => {
    if (!selectedId) return
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setShowDeleteConfirm(false)
    setLoading(true)
    try {
      await deleteHelpRequest(selectedId)
      toast.success('Help request deleted successfully')
      setSelectedId(null)
      setSelected(null)
      await load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete help request')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl shadow p-3 md:p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter:</label>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="resolved">Resolved</option>
            <option value="">All</option>
          </select>
        </div>
        <button onClick={load} className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white" style={{backgroundColor:'#B8860B'}}>
          <MdSearch/> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* List */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 border-b font-semibold" style={{color:'#B8860B'}}>Help Requests</div>
          <div className="max-h-[60vh] overflow-y-auto divide-y">
            {loading && items.length===0 && (
              <div className="p-4 text-sm text-gray-500">Loading...</div>
            )}
            {items.length===0 && !loading && (
              <div className="p-4 text-sm text-gray-500">No items</div>
            )}
            {items.map(it => (
              <button key={it._id} onClick={()=>openDetail(it._id)} className={`w-full text-left p-3 hover:bg-gray-50 ${selectedId===it._id?'bg-gray-50':''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                    {it.from?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate" style={{color:'#2C2C2C'}}>{it.from?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{new Date(it.createdAt).toLocaleString()}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${it.type==='help' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>Help</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 border-b font-semibold" style={{color:'#B8860B'}}>Details</div>
          {!selected ? (
            <div className="p-4 text-sm text-gray-500">Select a request to review</div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                  {selected.from?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-semibold" style={{color:'#2C2C2C'}}>{selected.from?.name}</div>
                  <div className="text-xs text-gray-500">{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-gray-500">Issue Type</div>
                  <div className="font-medium">{selected.issueType || '-'}</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium capitalize flex items-center gap-2">
                    {selected.status}
                    {selected.status==='resolved' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">Closed</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Description</div>
                <div className="p-3 bg-white border rounded min-h-[80px] text-sm whitespace-pre-wrap">{selected.issueDescription || '—'}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selected.status==='pending' && (
                  <>
                    <button onClick={()=>act('approve')} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white disabled:opacity-50" style={{backgroundColor:'#16a34a'}}>
                      <MdCheck/> Approve & Enable Chat
                    </button>
                    <button onClick={()=>act('reject')} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white disabled:opacity-50" style={{backgroundColor:'#dc2626'}}>
                      <MdClose/> Reject
                    </button>
                  </>
                )}
                {selected.status==='approved' && (
                  <>
                    <button onClick={()=> nav(`/chat/${selected.from?._id}`)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white" style={{backgroundColor:'#B8860B'}}>
                      <MdChat/> Open Chat
                    </button>
                    <button onClick={()=>act('resolve')} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white disabled:opacity-50" style={{backgroundColor:'#0ea5e9'}}>
                      Resolve & Close Chat
                    </button>
                  </>
                )}
                <button onClick={handleDelete} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-lg text-white disabled:opacity-50 ml-auto" style={{backgroundColor:'#dc2626'}}>
                  <MdDelete/> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDeleteConfirm(false)}
          />

          {/* Modal Card */}
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <MdDelete className="text-red-600 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete Help Request?</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this help request? This action cannot be undone.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import api from './http.js'

// Send a help request to admins
export const requestHelp = async (issueType, issueDescription) => {
  return (await api.post('/help/request', { issueType, issueDescription })).data
}

// Optional: check current help request status (pending/approved/rejected)
export const getHelpStatus = async () => (await api.get('/help/status')).data

// Admin: approve/reject a help request
export const respondHelpRequest = async ({ helpRequestId, action }) => {
  return (await api.post('/help/respond', { helpRequestId, action })).data
}

// Admin: list help requests
export const listHelpRequests = async (status) => {
  const q = status ? `?status=${encodeURIComponent(status)}` : ''
  return (await api.get(`/help/admin/list${q}`)).data
}

// Admin: get single help request
export const getHelpRequestById = async (id) => {
  return (await api.get(`/help/admin/${id}`)).data
}

// Admin: delete help request
export const deleteHelpRequest = async (id) => {
  return (await api.delete(`/help/admin/${id}`)).data
}

// Admin: get help request stats (pending count + unread messages)
export const getHelpRequestStats = async () => {
  return (await api.get('/help/admin/stats')).data
}

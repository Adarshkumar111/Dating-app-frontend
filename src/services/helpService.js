import api from './http.js'

// Send a help request to admins
export const requestHelp = async (issueType, issueDescription) => {
  return (await api.post('/help/request', { issueType, issueDescription })).data
}

// Optional: check current help request status (pending/approved/rejected)
export const getHelpStatus = async () => (await api.get('/help/status')).data

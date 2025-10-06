import api from './http.js'

export const getNotifications = async () => (await api.get('/notifications')).data
export const markAsRead = async (requestId, notificationId) => (await api.post('/notifications/mark-read', { requestId, notificationId })).data

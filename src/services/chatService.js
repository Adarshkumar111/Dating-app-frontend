import api from './http.js'

export const getChatWithUser = async (userId) => (await api.get(`/chat/with/${userId}`)).data
export const getMessages = async (chatId) => (await api.get(`/chat/${chatId}/messages`)).data
export const sendMessage = async (chatId, payload) => (await api.post(`/chat/${chatId}/send`, payload)).data
export const deleteMessage = async (chatId, messageId, deleteType) => (await api.post(`/chat/${chatId}/delete-message`, { messageId, deleteType })).data
export const addReaction = async (chatId, messageId, emoji) => (await api.post(`/chat/${chatId}/reaction`, { messageId, emoji })).data
export const uploadMedia = async (chatId, file) => {
  const formData = new FormData()
  formData.append('media', file)
  return (await api.post(`/chat/${chatId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })).data
}
export const block = async (chatId) => (await api.post(`/chat/${chatId}/block`)).data
export const unblock = async (chatId) => (await api.post(`/chat/${chatId}/unblock`)).data

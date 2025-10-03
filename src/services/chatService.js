import api from './http.js';

export const getChatWithUser = async (userId) => (await api.get(`/chat/with/${userId}`)).data;
export const sendMessage = async (chatId, data) => (await api.post(`/chat/${chatId}/send`, data)).data;
export const deleteMessage = async (chatId, messageId, deleteType) => (await api.post(`/chat/${chatId}/delete`, { messageId, deleteType })).data;
export const addReaction = async (chatId, messageId, emoji) => (await api.post(`/chat/${chatId}/react`, { messageId, emoji })).data;
export const uploadMedia = async (chatId, file) => {
  const fd = new FormData();
  fd.append('media', file);
  return (await api.post(`/chat/${chatId}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};
export const markAsSeen = async (chatId) => (await api.post(`/chat/${chatId}/seen`)).data;
export const markAsDelivered = async (chatId) => (await api.post(`/chat/${chatId}/delivered`)).data;
export const blockChat = async (chatId) => (await api.post(`/chat/${chatId}/block`)).data;
export const unblockChat = async (chatId) => (await api.post(`/chat/${chatId}/unblock`)).data;

import api from './http.js'

export const updateProfile = async (formData) => (await api.put('/profile/update', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})).data

export const changePassword = async (payload) => (await api.post('/profile/change-password', payload)).data

export const deleteGalleryImage = async (imageUrl) => (await api.delete('/profile/gallery-image', {
  data: { imageUrl }
})).data

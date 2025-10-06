import api from './http.js'

export const getEnabledFilters = async () => (await api.get('/public/settings/filters')).data

import api from './http.js'

export const getEnabledFilters = async () => (await api.get('/public/settings/filters')).data
export const getPreAuthBanner = async () => (await api.get('/public/preauth-banner')).data
export const getOnboardingSlides = async () => (await api.get('/public/onboarding-slides')).data

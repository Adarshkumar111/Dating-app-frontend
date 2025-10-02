import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice.js'
import chatReducer from './slices/chatSlice.js'
import uiReducer from './slices/uiSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['ui/setContextMenu', 'ui/setReactionMenu'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.x', 'payload.y', 'payload.message'],
        // Ignore these paths in the state
        ignoredPaths: ['ui.contextMenu', 'ui.reactionMenu']
      }
    })
})

export default store

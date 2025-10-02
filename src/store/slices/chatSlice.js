import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as chatService from '../../services/chatService.js'

// Async thunks
export const fetchChatWithUser = createAsyncThunk(
  'chat/fetchChatWithUser',
  async (userId, { rejectWithValue }) => {
    try {
      const data = await chatService.getChatWithUser(userId)
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load chat')
    }
  }
)

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, payload }, { rejectWithValue }) => {
    try {
      const data = await chatService.sendMessage(chatId, payload)
      return data.message
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message')
    }
  }
)

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ chatId, messageId, deleteType }, { rejectWithValue }) => {
    try {
      await chatService.deleteMessage(chatId, messageId, deleteType)
      return { messageId, deleteType }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete message')
    }
  }
)

export const addReaction = createAsyncThunk(
  'chat/addReaction',
  async ({ chatId, messageId, emoji }, { rejectWithValue }) => {
    try {
      const data = await chatService.addReaction(chatId, messageId, emoji)
      return { messageId, reactions: data.reactions }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add reaction')
    }
  }
)

export const uploadMedia = createAsyncThunk(
  'chat/uploadMedia',
  async ({ chatId, file }, { rejectWithValue }) => {
    try {
      const data = await chatService.uploadMedia(chatId, file)
      return data.message
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload media')
    }
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    currentChat: null,
    messages: [],
    loading: false,
    uploading: false,
    error: null,
    hasNewMessage: false
  },
  reducers: {
    addMessageRealtime: (state, action) => {
      state.messages.push(action.payload)
      if (!action.payload.fromSelf) {
        state.hasNewMessage = true
      }
    },
    updateMessageRealtime: (state, action) => {
      const { messageId, updates } = action.payload
      const index = state.messages.findIndex(m => String(m._id) === String(messageId))
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...updates }
      }
    },
    deleteMessageRealtime: (state, action) => {
      const { messageId, deleteType } = action.payload
      if (deleteType === 'forEveryone') {
        const index = state.messages.findIndex(m => String(m._id) === String(messageId))
        if (index !== -1) {
          state.messages[index] = {
            ...state.messages[index],
            deletedForEveryone: true,
            text: '',
            mediaUrl: null
          }
        }
      }
    },
    updateReactionRealtime: (state, action) => {
      const { messageId, reactions } = action.payload
      const index = state.messages.findIndex(m => String(m._id) === String(messageId))
      if (index !== -1) {
        state.messages[index].reactions = reactions
      }
    },
    clearNewMessageFlag: (state) => {
      state.hasNewMessage = false
    },
    clearChat: (state) => {
      state.currentChat = null
      state.messages = []
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch chat
      .addCase(fetchChatWithUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchChatWithUser.fulfilled, (state, action) => {
        state.loading = false
        state.currentChat = {
          chatId: action.payload.chatId,
          users: action.payload.users,
          isBlocked: action.payload.isBlocked
        }
        state.messages = action.payload.messages || []
      })
      .addCase(fetchChatWithUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Message will be added via socket
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload
      })
      // Delete message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { messageId, deleteType } = action.payload
        if (deleteType === 'forMe') {
          state.messages = state.messages.filter(m => String(m._id) !== String(messageId))
        } else if (deleteType === 'forEveryone') {
          const index = state.messages.findIndex(m => String(m._id) === String(messageId))
          if (index !== -1) {
            state.messages[index] = {
              ...state.messages[index],
              deletedForEveryone: true,
              text: '',
              mediaUrl: null
            }
          }
        }
      })
      // Add reaction
      .addCase(addReaction.fulfilled, (state, action) => {
        const { messageId, reactions } = action.payload
        const index = state.messages.findIndex(m => String(m._id) === String(messageId))
        if (index !== -1) {
          state.messages[index].reactions = reactions
        }
      })
      // Upload media
      .addCase(uploadMedia.pending, (state) => {
        state.uploading = true
        state.error = null
      })
      .addCase(uploadMedia.fulfilled, (state, action) => {
        state.uploading = false
        // Message will be added via socket
      })
      .addCase(uploadMedia.rejected, (state, action) => {
        state.uploading = false
        state.error = action.payload
      })
  }
})

export const {
  addMessageRealtime,
  updateMessageRealtime,
  deleteMessageRealtime,
  updateReactionRealtime,
  clearNewMessageFlag,
  clearChat
} = chatSlice.actions

export default chatSlice.reducer

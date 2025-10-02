import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    showMediaMenu: false,
    showCameraModal: false,
    cameraMode: 'photo', // 'photo' or 'video'
    zoomedImage: null,
    contextMenu: null,
    reactionMenu: null,
    isRecordingVideo: false
  },
  reducers: {
    toggleMediaMenu: (state) => {
      state.showMediaMenu = !state.showMediaMenu
    },
    closeMediaMenu: (state) => {
      state.showMediaMenu = false
    },
    openCameraModal: (state, action) => {
      state.showCameraModal = true
      state.cameraMode = action.payload || 'photo'
      state.showMediaMenu = false
    },
    closeCameraModal: (state) => {
      state.showCameraModal = false
      state.isRecordingVideo = false
    },
    setZoomedImage: (state, action) => {
      state.zoomedImage = action.payload
    },
    setContextMenu: (state, action) => {
      state.contextMenu = action.payload
      state.reactionMenu = null
    },
    setReactionMenu: (state, action) => {
      state.reactionMenu = action.payload
      state.contextMenu = null
    },
    closeAllMenus: (state) => {
      state.contextMenu = null
      state.reactionMenu = null
      state.showMediaMenu = false
    },
    setRecordingVideo: (state, action) => {
      state.isRecordingVideo = action.payload
    }
  }
})

export const {
  toggleMediaMenu,
  closeMediaMenu,
  openCameraModal,
  closeCameraModal,
  setZoomedImage,
  setContextMenu,
  setReactionMenu,
  closeAllMenus,
  setRecordingVideo
} = uiSlice.actions

export default uiSlice.reducer

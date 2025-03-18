import { configureStore } from '@reduxjs/toolkit'
import movieReducer from './movieSlice'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    movieData: movieReducer,
    auth: authReducer,
  },
})
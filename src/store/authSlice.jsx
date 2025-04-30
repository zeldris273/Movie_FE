import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/api';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('Attempting login with:', { email, password });
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });
      console.log('Login API response:', response);

      const { accessToken, refreshToken } = response.data;
      if (!accessToken || !refreshToken) {
        console.error('Tokens missing in response:', response.data);
        throw new Error('accessToken or refreshToken missing in response');
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      console.log('Tokens stored in localStorage:', {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      });

      return { email, token: accessToken };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password, otp }, { rejectWithValue, dispatch }) => {
    try {
      console.log('Verifying OTP with:', { email, password, otp });
      await api.post('/api/auth/verify-otp', {
        email,
        password,
        otp,
      });

      console.log('OTP verified, proceeding to login');
      const loginResponse = await dispatch(
        loginUser({ email, password })
      ).unwrap();
      return loginResponse;
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      console.log('Logging out with refreshToken:', refreshToken);
      await api.post('/api/auth/logout', { RefreshToken: refreshToken });

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      console.log('Tokens removed from localStorage');

      return null;
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: localStorage.getItem('accessToken') ? { email: null } : null,
    token: localStorage.getItem('accessToken') || null, // Thêm token vào initialState
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.token = localStorage.getItem('accessToken') || null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { email: action.payload.email };
        state.token = action.payload.token; // Lưu token vào state
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { email: action.payload.email };
        state.token = action.payload.token; // Lưu token vào state
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null; // Xóa token khi đăng xuất
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
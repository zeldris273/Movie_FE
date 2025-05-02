import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5116',
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('Interceptor caught error:', error); // Log toàn bộ error
    console.log('Error response:', error.response); // Log error.response
    console.log('Error status:', error.response?.status); // Log status

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('Attempting to refresh token');
        const response = await axios.post('http://localhost:5116/api/auth/refresh-token', {}, {
          withCredentials: true
        });

        const { accessToken } = response.data;
        console.log('New access token:', accessToken);

        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        localStorage.removeItem('accessToken');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
});

let refreshRequest = null;

const refreshAccessToken = () => {
  if (!refreshRequest) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return Promise.reject(new Error('Missing refresh token'));

    refreshRequest = axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
      .then(({ data }) => {
        localStorage.setItem('accessToken', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        return data.token;
      })
      .finally(() => { refreshRequest = null; });
  }
  return refreshRequest;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const status = error.response?.status;
    const isAuthRequest = request?.url?.includes('/auth/');
    if (!request || ![401, 403].includes(status) || request._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const token = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    } catch (refreshError) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:expired'));
      return Promise.reject(refreshError);
    }
  }
);

export default api;

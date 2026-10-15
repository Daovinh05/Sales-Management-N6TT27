import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
});

let refreshRequest = null;

const notifyExpiredSession = () => {
  // Chỉ báo một lần: request đầu tiên thấy session sẽ xóa + phát sự kiện,
  // các request song song còn lại thấy user đã bị xóa thì bỏ qua để tránh toast trùng.
  const hadSession = localStorage.getItem('user') !== null
    || localStorage.getItem('accessToken') !== null
    || localStorage.getItem('refreshToken') !== null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  if (hadSession) window.dispatchEvent(new Event('auth:expired'));
};

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
    if (!request || ![401, 403].includes(status) || isAuthRequest) {
      return Promise.reject(error);
    }
    // Token mới vừa refresh xong vẫn bị từ chối -> phiên đã hết, báo người dùng đăng nhập lại.
    if (request._retry) {
      notifyExpiredSession();
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const token = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    } catch (refreshError) {
      notifyExpiredSession();
      return Promise.reject(refreshError);
    }
  }
);

export default api;

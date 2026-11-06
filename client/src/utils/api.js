import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.startsWith('/auth/login')) {
      localStorage.removeItem('token');
      if (!location.pathname.startsWith('/login')) location.assign('/login');
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) => err.response?.data?.message || (err.request ? 'Cannot reach the server. Check your connection' : 'Something went wrong');
export const fieldErrors = (err) => err.response?.data?.errors || {};

export async function download(url, params, fallbackName) {
  const res = await api.get(url, { params, responseType: 'blob' });
  const name = /filename="?([^"]+)"?/.exec(res.headers['content-disposition'] || '')?.[1] || fallbackName;
  const href = URL.createObjectURL(res.data);
  const a = Object.assign(document.createElement('a'), { href, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

export default api;

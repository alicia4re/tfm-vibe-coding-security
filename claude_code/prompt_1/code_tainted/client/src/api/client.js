import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export function getErrorMessage(error, fallback = 'Ha ocurrido un error inesperado.') {
  return error?.response?.data?.error || fallback;
}

export default api;

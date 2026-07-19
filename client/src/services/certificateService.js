import axios from 'axios';

// Empty in local development: Vite proxies /api to the local Express server.
// Set VITE_API_URL to the Render service URL for Vercel production builds.
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const apiClient = axios.create({ baseURL: `${API_ORIGIN}/api`, timeout: 30000 });

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(error.response?.data?.message || 'Something went wrong. Please try again.')),
);

export async function generateCertificate(payload) {
  const { data } = await apiClient.post('/generate', payload);
  return data;
}

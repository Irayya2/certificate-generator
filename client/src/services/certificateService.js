import axios from 'axios';

// Empty in local development: Vite proxies /api to the local Express server.
// Set VITE_API_URL to the Render service URL for Vercel production builds.
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const apiClient = axios.create({ baseURL: `${API_ORIGIN}/api`, timeout: 30000 });

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const responseData = error.response?.data || {};
    const message = responseData.message || 'Something went wrong. Please try again.';
    const apiError = new Error(message);
    // Preserve the studentNotFound flag so the UI can react specifically
    apiError.studentNotFound = responseData.studentNotFound === true;
    return Promise.reject(apiError);
  },
);

export async function generateCertificate(payload) {
  const { data } = await apiClient.post('/generate', payload);
  return data;
}

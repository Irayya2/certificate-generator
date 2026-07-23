import axios from 'axios';

// Empty in local development: Vite proxies /api to the local Express server.
// Set VITE_API_URL to the Render service URL for Vercel production builds.
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const apiClient = axios.create({ baseURL: `${API_ORIGIN}/api`, timeout: 30000 });

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log full error details so debugging is possible from the console
    console.error('[certificateService] API error:', error);
    console.log('[certificateService] error.response:', error.response);
    console.log('[certificateService] error.response?.data:', error.response?.data);

    const responseData = error.response?.data || {};
    const message =
      responseData.message ||
      error.message ||
      'Something went wrong. Please try again.';
    const apiError = new Error(message);
    // Preserve the studentNotFound flag so the UI can react specifically
    apiError.studentNotFound = responseData.studentNotFound === true;
    // Preserve the original response so callers can inspect it
    apiError.response = error.response;
    return Promise.reject(apiError);
  },
);

export async function generateCertificate(payload) {
  // apiClient.post() returns the full axios response.
  // response.data is the JSON body the backend sent (the 201 payload).
  // Return it directly — do NOT destructure a nested .data that doesn't exist.
  const response = await apiClient.post('/generate', payload);
  return response.data; // { success, pngUrl, pdfUrl, filename, ... }
}

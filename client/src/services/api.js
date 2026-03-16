import axios from 'axios'

const API = axios.create({
  // Vite exposes env vars on import.meta.env
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
  timeout: 5 * 60 * 1000, // 5 minutes
})

export function uploadFile(url, formData, onProgress) {
  return API.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
    responseType: 'blob'
  })
}

export default API

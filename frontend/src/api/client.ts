import axios from "axios";

// Resolve dynamic API Base URL from Vite environment config
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const apiClient = axios.create({
  baseURL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Centralized Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Placeholder for future authentication token injection:
    // const token = localStorage.getItem("auth-token");
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Centralized Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn("[API Error] 401 Unauthorized - Access token invalid or missing.");
    } else if (status === 403) {
      console.warn("[API Error] 403 Forbidden - Insufficient permissions.");
    } else if (status === 404) {
      console.warn("[API Error] 404 Not Found - The requested resource does not exist.");
    } else if (status >= 500) {
      console.error("[API Error] 5xx Server Error - Gateway or backend service down.");
    }

    return Promise.reject(error);
  }
);

// src/api/client.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add console log to debug requests
apiClient.interceptors.request.use((config) => {
  console.log(
    "🔵 API Request:",
    config.method?.toUpperCase(),
    config.url,
    config.data,
  );
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log("🔵 API Response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error(
      "🔴 API Error:",
      error.response?.status,
      error.response?.data,
    );
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default apiClient;

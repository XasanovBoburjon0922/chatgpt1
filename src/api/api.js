import axios from "axios";

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const API_BASE_URL = "https://imzo-ai.uzjoylar.uz";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Ensure cookies are sent with every request
});

const verifyApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Changed to true to include cookies
});

// Common request interceptor for adding Authorization header
const addAuthHeader = (config) => {
  const token = getCookie("access_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`; // Add Bearer prefix (adjust if backend expects a different format)
  }
  return config;
};

// Common error handler for responses
const handleResponseError = (error) => {
  if (error.response?.status === 401) {
    window.location.href = "/login";
  }
  return Promise.reject(error);
};

// Apply interceptors to both instances
api.interceptors.request.use(addAuthHeader, (error) => Promise.reject(error));
verifyApi.interceptors.request.use(addAuthHeader, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response, handleResponseError);
verifyApi.interceptors.response.use((response) => response, handleResponseError);

export { api, verifyApi };
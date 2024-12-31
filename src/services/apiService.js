import axios from "axios";

// Axios instance with baseURL from .env file
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL, // Ensure this is set correctly
  withCredentials: true, // Allow cookies and Authorization headers
});

api.interceptors.request.use(
  (config) => {
    const username = process.env.REACT_APP_API_USERNAME;  
    const password = process.env.REACT_APP_API_PASSWORD;  

    if (username && password) {
      const encodedCredentials = btoa(`${username}:${password}`);
      config.headers["Authorization"] = `Basic ${encodedCredentials}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// Fetch data from a specific endpoint
export const fetchData = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

import axios from "axios";

const api = axios.create({
  baseURL: "/", // Proxy will handle routing to backend
  withCredentials: true,
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

export const fetchData = async (endpoint) => {
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

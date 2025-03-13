import axios from "axios";

// Axios instance with baseURL from .env file
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL, // Ensure this is set correctly
 // withCredentials: true, // Allow cookies and Authorization headers
});

api.interceptors.request.use(
  (config) => {
    // const username = process.env.REACT_APP_API_USERNAME;
    // const password = process.env.REACT_APP_API_PASSWORD;

    const username = localStorage.getItem("userId"); // Retrieve username
    const password = localStorage.getItem("userPassword"); // Retrieve password

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

// Post data to a specific endpoint
export const postData = async (endpoint, payload) => {
  try {
    const response = await api.post(endpoint, payload);
    return response.data;
  } catch (error) {
    console.error("Error posting data:", error);
    throw error;
  }
};

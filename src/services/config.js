// src/config.js
const hostname = window.location.hostname;

// Decide backend URL
let BACKEND_URL;

if (hostname === "localhost") {
  // Running on laptop
  BACKEND_URL = process.env.REACT_APP_BACKEND_URL; 
} else {
  // Mobile / other device → use laptop’s IP
  BACKEND_URL = `http://${hostname}:8080`;
}

// Export with the same name used everywhere
export const REACT_APP_BACKEND_URL = BACKEND_URL;

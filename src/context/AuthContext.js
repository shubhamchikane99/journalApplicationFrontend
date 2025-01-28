// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Load user data from localStorage when the app initializes
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (userData) => {
    setUser(userData); // Set user data in state
    localStorage.setItem("user", JSON.stringify(userData)); // Save user data in localStorage
    localStorage.setItem("userName", JSON.stringify(userData.userName)); // Save user data in localStorage
  };

 
  const logout = () => {
    setUser(null); // Clear user data from state
    localStorage.removeItem("user"); // Remove user data from localStorage
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("userPassword");
  };

  useEffect(() => {
    // Sync state with localStorage on refresh
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

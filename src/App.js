import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Use Routes instead of Switch
import LoginForm from './components/LoginForm';  // Import LoginForm component
import { fetchData } from './services/apiService';  // Import fetchData from apiService
import { endPoint } from './services/endPoint';
import Loader from './components/Loader'; // Make sure the Loader component is defined somewhere

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [loginData, setLoginData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch login data
  const fetchLoginData = async (username, password) => {
    setLoading(true);
    try {
      const data = await fetchData(endPoint.users+"/log-in?userName="+username+"&password="+password)
           // Check outer and inner errors in the response
      if (data.error) {
        setError(data.data.errorMessage || 'An unexpected error occurred.');
        setIsLoggedIn(false);
        return;
      }

      if (data.data.error) {
        setError(data.data.errorMessage || 'Invalid username or password.');
        setIsLoggedIn(false);
        return;
      }

      // If no errors, set login data and mark as logged in
      setLoginData(data.data);
      setUsername(username);
      setIsLoggedIn(true);
    } catch (err) {
      setError('Failed to fetch login data. Please try again.');
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Router>
      <div>
        <Routes>
          <Route
            path="/"
            element={
              !isLoggedIn ? (
                loading ? (
                  <Loader /> // Use the Loader component here
                ) : (
                  <LoginForm
                    setIsLoggedIn={setIsLoggedIn}
                    setUsername={setUsername}
                    fetchLoginData={fetchLoginData}
                    error={error}
                  />
                )
              ) : (
                <Navigate to="/login-data" />
              )
            }
          />
  
          <Route
            path="/login-data"
            element={
              isLoggedIn ? (
                <div>
                  <h2>Welcome, {username}</h2>
                  {loading ? (
                    <Loader /> // Use the Loader component here as well
                  ) : (
                    <p>Login data: {JSON.stringify(loginData, null, 2)}</p>
                  )}
                </div>
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Removed 'useLocation'
import LoginForm from './components/LoginForm';
import { fetchData } from './services/apiService';
import { endPoint } from './services/endPoint';
import Loader from './components/Loader';


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
      const data = await fetchData(endPoint.users + "/log-in?userName=" + username + "&password=" + password);
      if (data.error || data.data.error) {
        setError(data.data.errorMessage || 'Invalid username or password.');
        setIsLoggedIn(false);
        return;
      }

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
                  <Loader />
                ) : (
                  <LoginForm
                    setIsLoggedIn={setIsLoggedIn}
                    setUsername={setUsername}
                    fetchLoginData={fetchLoginData}
                    error={error}
                  />
                )
              ) : (
                <Navigate to="/login-data" state={{ username }} />
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
                    <Loader />
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

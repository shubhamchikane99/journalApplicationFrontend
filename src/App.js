import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link  } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import { fetchData } from './services/apiService';
import { endPoint } from './services/endPoint';
import Loader from './components/Loader';
import SignUpForm from './components/SignUpForm'; // Import the SignUpForm component



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
      <Routes>
        <Route
          path="/"
          element={
            !isLoggedIn ? (
              loading ? (
                <Loader />
              ) : (
                <>
                  <LoginForm
                    setIsLoggedIn={setIsLoggedIn}
                    setUsername={setUsername}
                    fetchLoginData={fetchLoginData}
                    error={error}
                  />
                </>
              )
            ) : (
              <Navigate to={`/login/${username}`} replace />
            )
          }
        />
        <Route
          path="/login/:username"
          element={
            isLoggedIn ? (
              <LoginDataPage loginData={loginData} username={username} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/signup"
          element={<SignUpForm setIsLoggedIn={setIsLoggedIn} />}
        />
      </Routes>
    </Router>
  );
};

const LoginDataPage = ({ loginData, username }) => {
  // Display loader while waiting for data
  if (!username || !loginData) {
    return <Loader />;
  }

  return (
    <div>
      <h2>Welcome, {username}</h2>
      <p>Login data: {JSON.stringify(loginData, null, 2)}</p>
    </div>
  );
};

export default App;
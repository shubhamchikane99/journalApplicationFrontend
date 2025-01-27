import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { AuthContext } from "../context/AuthContext";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import "../styles/loginFromStyle.css"

const LoginForm = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate(); // Initialize useNavigate

  const fetchLoginData = async (usernameInput, passwordInput) => {
    try {
      const data = await fetchData(
        endPoint.public + "/log-in?userName=" + usernameInput + "&password=" + passwordInput
      );

       console.log("data " + data.data.statusCode)
      if (data.error || data.data.error) {
        setError(data.data.errorMessage || "Invalid username or password.");
        return;
      }

      if (data.data.statusCode === 200) {
        const userData = data.data.users;
        login(userData); // Save user data to context and session storage
        navigate(`${usernameInput}/dashboard`); // Navigate to dashboard
      }
    } catch (err) {
      setError("Failed to fetch login data. Please try again.");
    }
  };

  const handleLogin = () => {
    if (usernameInput && passwordInput) {
      fetchLoginData(usernameInput, passwordInput); // Call fetchLoginData here
    } else {
      alert("Please enter username and password.");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <div className="login-form">
        <input
          type="text"
          placeholder="Username"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          className="login-input"
        />
        <button onClick={handleLogin} className="login-button">
          Login
        </button>
        {error && <p className="error-message">{error}</p>} {/* Display login error */}
        <p onClick={() => navigate("/signup")} className="signup-link">
          Don't have an account? Sign Up here
        </p>
      </div>
    </div>
  );
};

export default LoginForm;

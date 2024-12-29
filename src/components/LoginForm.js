import React, { useState } from "react";
import './loginFromStyle.css';


const LoginForm = ({ setIsLoggedIn, setUsername, fetchLoginData, error }) => {
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const handleLogin = () => {
    if (usernameInput && passwordInput) {
      setUsername(usernameInput);
      fetchLoginData(usernameInput, passwordInput);
      setIsLoggedIn(true);
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
        {error && <p className="error-message">{error}</p>} {/* Display error if exists */}
      </div>
    </div>
  );
};

export default LoginForm;

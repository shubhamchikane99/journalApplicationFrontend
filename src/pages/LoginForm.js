import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import Loader from "../components/Loader";
import "../styles/loginFromStyle.css";

const LoginForm = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchLoginData = async (usernameInput, passwordInput) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchData(
        `${endPoint.public}/log-in?userName=${usernameInput}&password=${passwordInput}`
      );

      if (data.error || data.data.error) {
        setError(data.data.errorMessage || "Invalid username or password.");
        return;
      }

      if (data.data.statusCode === 200) {
        localStorage.setItem("usersId", JSON.stringify(data?.data?.users?.id));
        localStorage.setItem("userPassword", passwordInput);
        localStorage.setItem("userId", usernameInput);

        const userData = data.data.users;
        login(userData);
        navigate(`/${usernameInput.trim().toLowerCase()}/dashboard/`);
      }
    } catch (err) {
      setError("Failed to fetch login data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (usernameInput && passwordInput) {
      fetchLoginData(usernameInput, passwordInput);
    } else {
      alert("Please enter username and password.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      {loading && <Loader />}
      <h2>Login</h2>
      <div className="login-form">
        <input
          type="text"
          placeholder="Username"
          value={usernameInput}
          onKeyDown={handleKeyDown}
          onChange={(e) => setUsernameInput(e.target.value)}
          className="login-input"
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={passwordInput}
          onKeyDown={handleKeyDown}
          onChange={(e) => setPasswordInput(e.target.value)}
          className="login-input"
          disabled={loading}
        />
        <button
          onClick={handleLogin}
          className="login-button"
          disabled={loading}
        >
          Login
        </button>
        {error && <p className="error-message">{error}</p>}
        <p onClick={() => navigate("/signup")} className="signup-link">
          Don't have an account? Sign Up here
        </p>
      </div>
    </div>
  );
};

export default LoginForm;

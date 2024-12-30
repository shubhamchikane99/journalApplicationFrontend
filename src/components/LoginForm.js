import React, { useState } from "react";
import './loginFromStyle.css';

const LoginForm = ({ setIsLoggedIn, setUsername, fetchLoginData, error }) => {
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showSignUp, setShowSignUp] = useState(false); // State to toggle between login and signup form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signUpError, setSignUpError] = useState("");

  const handleLogin = () => {
    if (usernameInput && passwordInput) {
      setUsername(usernameInput);
      fetchLoginData(usernameInput, passwordInput);
      setIsLoggedIn(true);
    } else {
      alert("Please enter username and password.");
    }
  };

  const handleSignUp = () => {
    if (newUsername && newPassword && confirmPassword) {
      if (newPassword !== confirmPassword) {
        setSignUpError("Passwords do not match.");
        return;
      }
      // Call your signup function here (e.g., API call to register the user)
      setSignUpError(""); // Clear error if successful
      alert("Sign Up Successful! Please log in.");
      setShowSignUp(false); // Hide sign up form after successful signup
    } else {
      setSignUpError("Please fill all fields.");
    }
  };

  return (
    <div className="login-container">
      <h2>{showSignUp ? "Sign Up" : "Login"}</h2>
      <div className="login-form">
        {/* Login Form */}
        {!showSignUp ? (
          <>
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
            <p onClick={() => setShowSignUp(true)} className="signup-link">
              Don't have an account? Sign Up here
            </p>
          </>
        ) : (
          /* Sign Up Form */
          <div className="signup-form-container">
            <input
              type="text"
              placeholder="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="signup-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="signup-input"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="confirm-password-input"
            />
            <button onClick={handleSignUp} className="signup-button">
              Sign Up
            </button>
            {signUpError && <p className="error-message">{signUpError}</p>} {/* Display signup error */}
            <p onClick={() => setShowSignUp(false)} className="signup-link">
              Already have an account? Login here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;

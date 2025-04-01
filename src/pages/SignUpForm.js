import React, { useState, useEffect, useCallback } from "react";
import { fetchData, postData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import "../styles/SignUpForm.css";

const SignUpForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpValidationLoading, setOtpValidationLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const navigate = useNavigate();

  // Function to check if username is taken
  const checkUsername = useCallback(async () => {
    // If username is 'admin', block it or do any specific handling
    if (username.trim().toLowerCase() === "admin") {
      setUsernameError("The username 'admin' is not allowed.");
      return;
    }

    //if (!username.trim()) return; // Prevent API call if username is empty
    try {
      const data = await fetchData(
        `${endPoint.public}/check-username?userName=${username}`
      );
      if (data.data.statusCode === 409) {
        setUsernameError(data.data.errorMessage);
      } else {
        setUsernameError("");
      }
    } catch {
      setUsernameError("Error checking username.");
    }
  }, [username]);

  // Function to check if email is taken
  const checkEmail = useCallback(async () => {
    if (!email.trim()) return; // Prevent API call if email is empty
    try {
      const data = await fetchData(
        `${endPoint.public}/check-email?emailId=${email}`
      );
      if (data.data.statusCode === 409) {
        setUsernameError(data.data.errorMessage);
      } else {
        setUsernameError("");
      }
    } catch {
      setEmailError("Error checking email.");
    }
  }, [email]);

  // Call API when username changes
  useEffect(() => {
    if (!username.trim()) {
      setUsernameError("");
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      checkUsername();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [username, email, checkUsername]);

  // Call API when email changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      checkEmail();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [email, username, checkEmail]);

  const handleSendOtp = async () => {
    if (!email) {
      setError("Please enter an email to send OTP.");
      return;
    }
    setOtpLoading(true);
    try {
      const data = await fetchData(
        `${endPoint.public}/send-otp?emailId=${email}`
      );
      if (!data.data.error) {
        alert("OTP sent to your email.");
        setIsOtpSent(true);
        setError("");
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Error sending OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleValidateOtp = async () => {
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setOtpValidationLoading(true);
    try {
      const data = await fetchData(
        `${endPoint.public}/validate-otp?emailId=${email}&otp=${otp}`
      );
      if (data.data.statusCode === 200) {
        alert("OTP verified successfully.");
        setIsOtpVerified(true);
        setError("");
      } else {
        setError(data.data.errorMessage || "Invalid OTP.");
      }
    } catch {
      setError("Error validating OTP. Please try again.");
    } finally {
      setOtpValidationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOtpVerified) {
      setError("Please verify your OTP first.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (usernameError || emailError) {
      setError("Please resolve errors before submitting.");
      return;
    }
    setLoading(true);
    const userPayload = {
      firstName,
      lastName,
      userName: username,
      password,
      email,
      sentimentAnalysis: 1,
      accessRole: [{ accessRoleName: "ADMIN" }],
    };
    try {
      const data = await postData(
        `${endPoint.public}/create-user`,
        userPayload
      );
      if (data.data.statusCode === 200) {
        alert(data.data.errorMessage);
        navigate("/");
      } else {
        setError(data.data.errorMessage);
        alert(data.data.errorMessage);
      }
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to validate email format
  const validateEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Disable Send OTP button until username and email are valid
  const isFormValid =
    !usernameError &&
    !emailError &&
    email &&
    username &&
    validateEmailFormat(email);

  return (
    <div className="container">
      {loading && <Loader />}
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {usernameError && <p className="error">{usernameError}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {emailError && <p className="error">{emailError}</p>}
        {isOtpSent && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={handleValidateOtp}
              disabled={otpValidationLoading}
            >
              {otpValidationLoading ? "Validating..." : "Validate OTP"}
            </button>
          </>
        )}
        {!isOtpSent && (
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={otpLoading || !isFormValid}
          >
            {otpLoading ? "Sending..." : "Send OTP"}
          </button>
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading || !isOtpVerified}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
      <p onClick={() => navigate("/")} className="signup-link">
        Already have an account? Login here
      </p>
    </div>
  );
};

export default SignUpForm;

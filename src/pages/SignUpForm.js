import React, { useState } from "react";
import { fetchData } from "../services/apiService";
import { endPoint } from "../services/endPoint";
import { postData } from "../services/apiService";
import { useNavigate } from "react-router-dom";
import "../styles/SignUpForm.css";

const SignUpForm = () => {
  const [firstName, setFirstname] = useState("");
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

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!email && !username) {
      setError("Please enter both username and email.");
      return;
    } else if (!email) {
      setError("Please enter an email to send OTP.");
      return;
    } else if (!username) {
      setError("Please enter a username.");
      return;
    }

    setOtpLoading(true);
    try {
      // API call to send OTP
      const data = await fetchData(endPoint.public + "/send-otp?emailId=" + email);

      if (data.data.error === false) {
        alert("OTP sent to your email.");
        setIsOtpSent(true);
        setError(""); // Clear any previous error messages
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch (err) {
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

    setLoading(true);
    try {
      // API call to validate OTP
      const data = await fetchData(
        endPoint.public + "/validate-otp?emailId=" + email + "&otp=" + otp
      );

      if (data.data.statusCode === 200) {
        alert("OTP verified successfully.");
        setIsOtpVerified(true);
        setError(""); // Clear any previous error messages
      } else {
        setError(data.data.errorMessage || "Invalid OTP.");
      }
    } catch (err) {
      setError("Error validating OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    if (!isOtpVerified) {
      setError("Please verify your OTP first.");
      return;
    }

    setLoading(true);

    const userPayload = {
      firstName : firstName,
      lastName : lastName,
      userName: username, 
      password: password, 
      email: email,
      sentimentAnalysis: 1,
      accessRole : [
        {
          accessRoleName : "ADMIN"
        }
      ] 
    };

    try {
      // Simulate sign-up API response

      const data = await postData(endPoint.public + "/create-user" , userPayload);

      console.log("log " + JSON.stringify(data))
      if (data.data.statusCode===200) {
        alert(data.data.errorMessage);
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        navigate("/"); // Redirect to login
      } else {
        alert(data.data.errorMessage)
      }
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
      <div>
          <label htmlFor="firstName">First Name:</label>
          <input
            type="text"
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstname(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="lastName">Last Name:</label>
          <input
            type="text"
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {isOtpSent && (
          <div>
            <label htmlFor="otp">Enter OTP:</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={handleValidateOtp}
              disabled={loading}
              style={{ marginBottom: "5px", marginTop : "5px" }}

            >
              {loading ? "Validating OTP..." : "Validate OTP"}
            </button>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpLoading}
              
            >
              {otpLoading ? "Resending OTP..." : "Resend OTP"}
            </button>
          </div>
        )}

        {!isOtpSent && (
          <button type="button" onClick={handleSendOtp} disabled={otpLoading}>
            {otpLoading ? "Sending OTP..." : "Send OTP"}
          </button>
        )}

        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

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

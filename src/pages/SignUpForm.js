import React, { useState } from "react";
import { fetchData } from '../services/apiService';
import { endPoint } from '../services/endPoint';
import { useNavigate } from "react-router-dom";
import "./SignUpForm.css";

const SignUpForm = () => {
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
    console.log("email " + email);
    console.log("username " + username)
    if (!email && !username) {

      setError("Please Enter user name And Email");
       return;
    } else if (!email) {
        
      setError("Please enter an email to send OTP.");
      return;

    } else if ( !username) {
        
      setError("Please enter user name.");
      return;
    }
      

    setOtpLoading(true);
    try {
      console.log("email " + email);
      // API call to send OTP
      const data = await fetchData(endPoint.public + "/send-opt?emailId=" + email);

      console.log(data.data.statusCode);

      if (data.data.error===false) {
        alert("OTP sent to your email.");
        setIsOtpSent(true);
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
      // Simulate validate OTP API
       console.log("OTP" + otp)
       console.log("Email" + email)
      const data = await fetchData(endPoint.public + "/validate-otp?emailId=" + email + "&otp=" + otp);
     
      if (data.data.statusCode===200) {
        alert("OTP verified successfully.");
        setIsOtpVerified(true);
      } else {
         alert(data.data.errorMessage);
        //setError(data.data.errorMessage || "Invalid OTP.");
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
    try {
      const data = { success: true }; // Simulate sign-up API response

      if (data.success) {
        alert("Account created successfully!");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
        navigate("/"); // Redirect to login
      } else {
        setError(data.message || "Something went wrong.");
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
            >
              {loading ? "Validating OTP..." : "Validate OTP"}
            </button>
          </div>
        )}

        {!isOtpSent && (
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={otpLoading}
          >
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

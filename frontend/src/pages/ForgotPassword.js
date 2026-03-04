import React, { useState } from "react";
import "../styles/login.css";
import { API } from "../config/api";
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
  const [form, setForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.email || !form.newPassword || !form.confirmPassword) {
      setMessage("Please fill all fields");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage("New password and confirm password do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API.FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, newPassword: form.newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Failed to update password");
        setLoading(false);
        return;
      }

      setMessage(data.message || "Password updated successfully");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="login-content-wrapper">
        {/* Left Side Box - Website Information */}
        <div className="login-left-box">
          {/* Home Arrow Button */}
          <Link to="/" className="home-arrow-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 19l-7-7m0 0l7-7m0 0"/>
              <path d="M3 12h18"/>
            </svg>
            {/* <span>Home</span> */}
          </Link>
          
          <div className="brand-section">
            <h1 className="brand-name">Justice Point</h1>
            <p className="brand-tagline">Your Trusted Legal Partner</p>
          </div>
          
          <div className="features-section">
            <h3>Why Choose Justice Point?</h3>
            <div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="feature-text">
                <h4>Verified Attorneys</h4>
                {/* <p>Connect with experienced and verified legal professionals</p> */}
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <div className="feature-text">
                <h4>Secure & Confidential</h4>
                {/* <p>Your legal matters are handled with complete privacy</p> */}
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 4"/>

                </svg>
              </div>
              <div className="feature-text">
                <h4>24/7 client support</h4>
                {/* <p>Round-the-clock assistance whenever you need it</p> */}
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div className="feature-text">
                <h4>Quick Solutions</h4>
                {/* <p>Fast and efficient legal assistance when you need it</p> */}
              </div>
            </div>
            </div>  
          </div>
          

          <div className="testimonials-section">
            <div className="testimonial">
              <div className="testimonial-text">
                Your Case, Our Commitment
              </div>
              <div className="testimonial-author">
                <div className="author-name">Justice Point</div>
                <div className="author-title">Legal Excellence</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Forgot Password Form */}
        <form className="register-form" onSubmit={handleSubmit}>
          <h1 className="get">Reset Password</h1>
          <h4 className="ac">Enter your email and new password</h4>
          <h2>Forgot Password</h2>

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Enter your new password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
              required
            />
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "Please wait..." : "Update Password"}
          </button>

          <div className="login-link">
            Remember your password? <a href="/login">Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;


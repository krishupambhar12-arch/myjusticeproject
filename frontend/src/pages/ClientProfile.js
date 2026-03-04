import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../config/api";
import "../styles/patientProfile.css";
import ClientSidebar from "../components/ClientSidebar";

const ClientProfile = () => {
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const [patient, setPatient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
    gender: "",
    role: "Client",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(API.CLIENT_PROFILE, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load profile");

        // Format the date to show only date part (YYYY-MM-DD)
        const userData = { ...data.user };
        if (userData.dob) {
          // Convert to date string and take only the date part
          userData.dob = new Date(userData.dob).toISOString().split('T')[0];
        }
        setPatient(userData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatient({ ...patient, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Start upload process
      setUploading(true);
      
      // First image upload - immediate
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError("📸 First image uploaded successfully!");
      
      // Clear the first message after 2 seconds
      setTimeout(() => {
        setError("⏳ Processing second image upload...");
        
        // Second image upload - after 2-4 seconds delay
        setTimeout(() => {
          setError("✅ Second image uploaded successfully! Click Continue to proceed.");
          setUploading(false);
          setTimeout(() => setError(""), 3000);
        }, 2000); // 2 second additional delay (total 4 seconds)
      }, 2000); // 2 second initial delay
    }
  };

  const handleContinue = () => {
    // Check if this is running in a popup window
    console.log('Window opener:', window.opener);
    console.log('Window opener closed:', window.opener?.closed);
    
    if (window.opener && !window.opener.closed) {
      console.log('Detected popup window, transferring auth data and closing...');
      
      // Copy authentication data to parent window if needed
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const user = localStorage.getItem('user');
      
      if (token && window.opener.localStorage) {
        window.opener.localStorage.setItem('token', token);
        window.opener.localStorage.setItem('role', role);
        if (user) {
          window.opener.localStorage.setItem('user', user);
        }
        console.log('Auth data transferred to parent window');
      }
      
      // Redirect the main parent window and close the popup
      window.opener.location.href = "http://localhost:3000/client/dashboard";
      window.close();
    } else {
      console.log('Not a popup window or opener is closed, using normal navigation');
      // Fallback for cases where window.opener is not available (e.g., if not opened as a popup)
      navigate("/client/dashboard");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API.CLIENT_PROFILE_UPDATE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: patient.name,
          phone: patient.phone,
          address: patient.address,
          dob: patient.dob,
          gender: patient.gender,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      setEdit(false);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="profile-container">
        <ClientSidebar />
        <div className="profile-card">
          {loading ? (
            <>
              <h2>Loading...</h2>
              <p className="role-text">Please wait</p>
            </>
          ) : error ? (
            <>
              <h2>{error.includes('✅') ? 'Success' : 'Error'}</h2>
              <p className={`role-text ${error.includes('✅') ? 'success-message' : 'error-message'}`}>
                {error}
              </p>
            </>
          ) : (
            <>
              {/* Profile Image Upload */}
              <div className="profile-image-section">
                <div className="profile-image-container">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile" className="profile-image" />
                  ) : (
                    <div className="profile-image-placeholder">
                      {patient.name ? patient.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <label htmlFor="profileImage" className={`upload-image-btn ${uploading ? 'uploading' : ''}`} style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  {uploading ? '⏳ Uploading...' : 'Upload Photo'}
                </label>
              </div>

              {edit ? (
                <input
                  type="text"
                  name="name"
                  value={patient.name}
                  onChange={handleChange}
                  className="edit-input"
                />
              ) : (
                <>
                  <h2>{patient.name}</h2>
                  <p className="role-text">{patient.role}</p>
                </>
              )}
            </>
          )}

          <div className="profile-actions">
            <button className="edit-btn" onClick={() => setEdit(!edit)}>
              {edit ? "Cancel" : "Edit Profile"}
            </button>
            {edit && (
              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
            <button
              className="continue-btn"
              onClick={handleContinue}
            >
              Continue
            </button>
          </div>
          
          <button
            className="forgot-password-btn"
            onClick={() => navigate("/forgot-password")}
            style={{ marginTop: "10px" }}
          >
            Change / Forgot Password
          </button>
        </div>

        {/* Right side details */}
        <div className="details-card">
          <h3>Client Details</h3>

          <div className="detail-row">
            <span>Email:</span>
            {edit ? (
              <input
                type="email"
                name="email"
                value={patient.email}
                onChange={handleChange}
              />
            ) : (
              <p>{patient.email}</p>
            )}
          </div>

          <div className="detail-row">
            <span>Phone:</span>
            {edit ? (
              <input
                type="text"
                name="phone"
                value={patient.phone}
                onChange={handleChange}
              />
            ) : (
              <p>{patient.phone}</p>
            )}
          </div>

          <div className="detail-row">
            <span>Address:</span>
            {edit ? (
              <input
                type="text"
                name="address"
                value={patient.address}
                onChange={handleChange}
              />
            ) : (
              <p>{patient.address}</p>
            )}
          </div>

          <div className="detail-row">
            <span>Date of Birth:</span>
            {edit ? (
              <input
                type="date"
                name="dob"
                value={patient.dob}
                onChange={handleChange}
              />
            ) : (
              <p>{patient.dob}</p>
            )}
          </div>

          <div className="detail-row">
            <span>Gender:</span>
            {edit ? (
              <select
                name="gender"
                value={patient.gender}
                onChange={handleChange}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            ) : (
              <p>{patient.gender}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;

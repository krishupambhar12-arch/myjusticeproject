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
    profilePicture: "",
    isSocialLogin: false,
    provider: ""
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
        const userData = { 
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          address: data.user.address || "",
          dob: data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split('T')[0] : "",
          gender: data.user.gender || "",
          role: data.user.role || "Client",
          profilePicture: data.user.profilePicture || "",
          isSocialLogin: data.user.isSocialLogin || false,
          provider: data.user.provider || ""
        };
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Image file selected:', file.name, file.size, file.type);
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("❌ File size must be less than 5MB");
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError("❌ Please select an image file");
        return;
      }
      
      setProfileImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      console.log('Image preview created:', previewUrl);
      
      // Auto-upload the image immediately
      await uploadProfileImage(file);
    }
  };

  const uploadProfileImage = async (file) => {
    try {
      setError("📸 Uploading photo...");
      
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      console.log('🔍 Auto-uploading image to server...');
      
      const res = await fetch(API.CLIENT_PROFILE_UPDATE, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      console.log('🔍 Upload response:', data);
      
      if (!res.ok) throw new Error(data.message || "Failed to upload photo");

      // Update local state with response data
      setPatient(data.user);
      setProfileImage(null); // Clear the selected file
      setImagePreview(null); // Clear the preview
      setError("✅ Photo uploaded successfully!");
      
      console.log('✅ Photo uploaded successfully:', data.user.profilePicture);
      
      // Clear success message after 3 seconds
      setTimeout(() => setError(""), 3000);
      
    } catch (e) {
      console.error('❌ Upload error:', e);
      setError(e.message);
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
    console.log('🔍 Save button clicked');
    console.log('🔍 Current profileImage:', profileImage);
    console.log('🔍 Current patient data:', patient);
    
    setSaving(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      console.log('🔍 Token:', token ? 'exists' : 'missing');
      
      // Create FormData for multipart/form-data (to handle file upload)
      const formData = new FormData();
      
      // Add text fields
      formData.append('name', patient.name);
      formData.append('phone', patient.phone);
      formData.append('address', patient.address);
      formData.append('dob', patient.dob);
      formData.append('gender', patient.gender);
      
      console.log('🔍 FormData text fields added');
      
      // Add image file if selected
      if (profileImage) {
        formData.append('profilePicture', profileImage);
        console.log('🔍 Profile image added to FormData:', profileImage.name);
      } else {
        console.log('🔍 No profile image to upload');
      }
      
      console.log('🔍 Sending request to:', API.CLIENT_PROFILE_UPDATE);
      
      const res = await fetch(API.CLIENT_PROFILE_UPDATE, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header when using FormData
          // Browser will set it automatically with boundary
        },
        body: formData,
      });

      console.log('🔍 Response status:', res.status);
      const data = await res.json();
      console.log('🔍 Response data:', data);
      
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      // Update local state with response data
      setPatient(data.user);
      setEdit(false);
      setProfileImage(null); // Clear the selected file
      setImagePreview(null); // Clear the preview
      setError("✅ Profile updated successfully!");
      
      console.log('✅ Profile updated with data:', data.user);
      console.log('✅ Profile picture:', data.user.profilePicture);
      
      // Clear success message after 3 seconds
      setTimeout(() => setError(""), 3000);
      
    } catch (e) {
      console.error('❌ Save error:', e);
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
          ) : error && !error.includes('✅') ? (
            <>
              <h2>Error</h2>
              <p className="role-text error-message">
                {error}
              </p>
            </>
          ) : (
            <>
              {/* Show success message if exists */}
              {error && error.includes('✅') && (
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px', border: '1px solid #c3e6cb' }}>
                  <p style={{ margin: 0, color: '#155724', fontWeight: 'bold' }}>
                    {error}
                  </p>
                </div>
              )}
              
              {/* Profile Image Upload */}
              <div className="profile-image-section">
                {/* Debug info */}
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                  Debug: profilePicture={patient.profilePicture}, imagePreview={imagePreview ? 'exists' : 'null'}
                </div>
                
                {/* Unsaved changes indicator */}
                {imagePreview && (
                  <div style={{ 
                    marginBottom: '10px', 
                    padding: '8px', 
                    backgroundColor: '#d1ecf1', 
                    borderRadius: '5px', 
                    border: '1px solid #bee5eb',
                    fontSize: '14px',
                    color: '#0c5460'
                  }}>
                    📸 Uploading photo automatically...
                  </div>
                )}
                
                <div className="profile-image-container">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile Preview" 
                      className="profile-image"
                      style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : patient.profilePicture ? (
                    <img 
                      src={`http://localhost:5000/uploads/${patient.profilePicture}`} 
                      alt="Profile" 
                      className="profile-image"
                      style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
                      onLoad={() => console.log('Profile image loaded successfully')}
                      onError={(e) => {
                        console.log('Failed to load profile image:', patient.profilePicture);
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : (
                    <div className="profile-image-placeholder" style={{ 
                      width: '150px', 
                      height: '150px', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: '#f0f0f0',
                      fontSize: '48px',
                      color: '#666'
                    }}>
                      {patient.name ? patient.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="profile-image-placeholder" style={{ 
                    display: 'none', 
                    width: '150px', 
                    height: '150px', 
                    borderRadius: '50%', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    fontSize: '48px',
                    color: '#666'
                  }}>
                    {patient.name ? patient.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  disabled={saving}
                />
                <label htmlFor="profileImage" className={`upload-image-btn ${saving ? 'uploading' : ''}`} style={{ cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? '⏳ Saving...' : 'Upload Photo'}
                </label>
              </div>

              {edit ? (
                <input
                  type="text"
                  name="name"
                  value={patient.name}
                  onChange={handleChange}
                  className="edit-input"
                  placeholder="Enter your name"
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
            <button 
              className="edit-btn" 
              onClick={() => {
                console.log('Edit button clicked, current edit state:', edit);
                setEdit(!edit);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: edit ? '#dc3545' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              {edit ? "Cancel" : "Edit Profile"}
            </button>
            {edit && (
              <button 
                className="save-btn" 
                onClick={handleSave} 
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  backgroundColor: saving ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  marginRight: '10px'
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
            <button
              className="continue-btn"
              onClick={handleContinue}
              style={{
                padding: '10px 20px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
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
            <p>{patient.email}</p>
          </div>

          <div className="detail-row">
            <span>Phone:</span>
            {edit ? (
              <input
                type="text"
                name="phone"
                value={patient.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                style={{ border: '2px solid #007bff', padding: '5px' }}
              />
            ) : (
              <p>{patient.phone || 'Not set'}</p>
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
                value={patient.gender || ""}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
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

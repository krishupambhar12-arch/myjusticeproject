// src/pages/AttorneyProfile.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/AttorneySidebar";
import "../styles/doctorProfile.css";
import { API } from "../config/api";
const BACKEND_URL = "http://localhost:5000";

const AttorneyProfile = () => {
  const navigate = useNavigate();
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [attorney, setAttorney] = useState({
    attorneyName: "",
    attorneyEmail: "",
    attorneyPhone: "",
    attorneyGender: "",
    attorneyAddress: "",
    attorneyDOB: "",
    specialization: "",
    qualification: "",
    experience: "",
    fees: "",
    profilePicture: ""
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const load = async () => {
      try {
        const res = await fetch(API.ATTORNEY_DASHBOARD, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load profile");

        setAttorney((prev) => ({
          ...prev,
          attorneyName: data?.attorney?.name || "",
          attorneyEmail: data?.attorney?.email || "",
          attorneyPhone: data?.attorney?.phone || "",
          attorneyGender: data?.attorney?.gender || "",
          attorneyAddress: data?.attorney?.address || "",
          attorneyDOB: data?.attorney?.dateOfBirth || "",
          specialization: data?.attorney?.specialization || "",
          qualification: data?.attorney?.qualification || "",
          experience: String(data?.attorney?.experience ?? ""),
          fees: String(data?.attorney?.fees ?? ""),
          profilePicture: data?.attorney?.profile_pic
            ? `${BACKEND_URL}/${data.attorney.profile_pic}`
            : "",
        }));
      } catch (e) {
        console.error("Profile load error:", e);
        // show minimal error, keep defaults
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    setAttorney({ ...attorney, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    console.log("🔍 File selected:", f);
    console.log("🔍 File details:", f ? {
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified
    } : "No file selected");
    
    setFile(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      console.log("🔍 Created object URL:", url);
      setAttorney((d) => ({ ...d, profilePicture: url }));
    } else {
      console.log("🔍 No file selected, clearing profile picture preview");
      setAttorney((d) => ({ ...d, profilePicture: "" }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      
      console.log("🔍 Starting profile save...");
      console.log("🔍 File to upload:", file);
      console.log("🔍 File details:", file ? {
        name: file.name,
        size: file.size,
        type: file.type
      } : "No file");
      
      const form = new FormData();
      
      // Personal details from signup
      if (attorney.attorneyName) form.append("attorneyName", attorney.attorneyName);
      if (attorney.attorneyEmail) form.append("attorneyEmail", attorney.attorneyEmail);
      if (attorney.attorneyPhone) form.append("attorneyPhone", attorney.attorneyPhone);
      if (attorney.attorneyGender) form.append("attorneyGender", attorney.attorneyGender);
      if (attorney.attorneyAddress) form.append("attorneyAddress", attorney.attorneyAddress);
      if (attorney.attorneyDOB) form.append("attorneyDOB", attorney.attorneyDOB);
      
      // Professional details
      if (attorney.specialization) form.append("specialization", attorney.specialization);
      if (attorney.qualification) form.append("qualification", attorney.qualification);
      if (attorney.experience !== "") form.append("experience", String(parseInt(attorney.experience || 0, 10)));
      if (attorney.fees !== "") form.append("fees", String(parseInt(attorney.fees || 0, 10)));
      if (file) {
        console.log("🔍 Adding file to FormData:", file.name);
        form.append("profile_pic", file);
      } else {
        console.log("🔍 No file to add to FormData");
      }

      console.log("🔍 FormData contents:");
      for (let [key, value] of form.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
      }

      const res = await fetch(API.ATTORNEY_PROFILE_UPDATE, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      
      console.log("🔍 Response status:", res.status);
      const data = await res.json();
      console.log("🔍 Response data:", data);
      
      if (!res.ok) throw new Error(data.message || "Failed to update profile");
      setMessage("Profile updated successfully");
      setEdit(false);
      
      // Reload profile data after successful update
      if (data.attorney?.profilePicture) {
        const newProfileUrl = `${BACKEND_URL}/${data.attorney.profilePicture}`;
        console.log("🔍 Setting new profile picture URL:", newProfileUrl);
        setAttorney(prev => ({
          ...prev,
          profilePicture: newProfileUrl
        }));
      }
    } catch (e) {
      console.error("Profile update error:", e);
      setMessage(e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-container">
        {/* Left profile card */}
        <div className="profile-card">
          {attorney.profilePicture ? (
            <img src={attorney.profilePicture} alt="Attorney" className="profile-pic" 
              onError={(e) => {
                console.error("Image failed to load:", attorney.profilePicture);
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="profile-pic-placeholder">
              <span>No Photo</span>
            </div>
          )}
          {edit ? (
            <>
              <input
                type="text"
                name="attorneyName"
                value={attorney.attorneyName}
                onChange={handleChange}
                className="edit-input"
              />
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </>
          ) : (
            <h2>{attorney.attorneyName || "Attorney"}</h2>
          )}
          <p>{attorney.specialization}</p>
          {edit ? (
            <button className="edit-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <button className="edit-btn" onClick={() => setEdit(true)}>Edit Profile</button>
          )}
          <button
            className="forgot-password-btn"
            onClick={() => navigate("/attorney-forgot-password")}
            style={{ marginTop: "10px" }}
          >
            Forgot Password
          </button>
          {message && <p style={{ marginTop: 8 }}>{message}</p>}
        </div>

        {/* Right details section */}
        <div className="details-card">
          <h3>Personal Information</h3>
          <div className="detail-row">
            <span>Full Name:</span>
            {edit ? (
              <input
                type="text"
                name="attorneyName"
                value={attorney.attorneyName}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.attorneyName || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Email:</span>
            {edit ? (
              <input
                type="email"
                name="attorneyEmail"
                value={attorney.attorneyEmail}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.attorneyEmail || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Phone:</span>
            {edit ? (
              <input
                type="tel"
                name="attorneyPhone"
                value={attorney.attorneyPhone}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.attorneyPhone || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Gender:</span>
            {edit ? (
              <select
                name="attorneyGender"
                value={attorney.attorneyGender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <span>{attorney.attorneyGender || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Date of Birth:</span>
            {edit ? (
              <input
                type="date"
                name="attorneyDOB"
                value={attorney.attorneyDOB}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.attorneyDOB || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Address:</span>
            {edit ? (
              <textarea
                name="attorneyAddress"
                value={attorney.attorneyAddress}
                onChange={handleChange}
                rows="3"
              />
            ) : (
              <span>{attorney.attorneyAddress || "Not provided"}</span>
            )}
          </div>

          <h3 style={{ marginTop: "30px" }}>Professional Information</h3>
          <div className="detail-row">
            <span>Specialization:</span>
            {edit ? (
              <input
                type="text"
                name="specialization"
                value={attorney.specialization}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.specialization || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Qualification:</span>
            {edit ? (
              <input
                type="text"
                name="qualification"
                value={attorney.qualification}
                onChange={handleChange}
              />
            ) : (
              <span>{attorney.qualification || "Not provided"}</span>
            )}
          </div>
          <div className="detail-row">
            <span>Experience (years):</span>
            {edit ? (
              <input
                type="number"
                name="experience"
                value={attorney.experience}
                onChange={handleChange}
                min="0"
              />
            ) : (
              <span>{attorney.experience || "0"} years</span>
            )}
          </div>
          <div className="detail-row">
            <span>Consultation Fees:</span>
            {edit ? (
              <input
                type="number"
                name="fees"
                value={attorney.fees}
                onChange={handleChange}
                min="0"
              />
            ) : (
              <span>${attorney.fees || "0"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttorneyProfile;

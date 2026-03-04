// src/pages/DoctorDashboard.js
import React, { useEffect, useState } from "react";
import Sidebar from "../components/AttorneySidebar";
import "../styles/doctorDashboard.css";
import "../styles/attorneyProfile.css";
import { API } from "../config/api";

const AttorneyDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attorney, setAttorney] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await fetch(API.ATTORNEY_DASHBOARD, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Check if response is JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.error('Received non-JSON response:', text);
          throw new Error('Server error. Please try again later.');
        }
        
        const data = await res.json();
        
        if (res.ok) {
          console.log("🔍 Dashboard attorney data:", data.attorney);
          setAttorney(data.attorney);
          setTodayAppointments(data.stats.todayAppointments);
          setTotalPatients(data.stats.totalClients);
          setUpcomingAppointments(data.stats.upcomingAppointments);
          setEarnings(data.stats.earnings);
        } else {
          setError(data.message || "Failed to load dashboard");
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          {loading ? (
            <>
              <h1>Loading dashboard…</h1>
              <p>Please wait</p>
            </>
          ) : error ? (
            <>
              <h1>Welcome</h1>
              <p style={{ opacity: 0.9 }}>{error}</p>
            </>
          ) : (
            <>
              <h1>Welcome Attorney {attorney?.name || 'Attorney'} 👋</h1>
              <p>You have {todayAppointments} appointments today.</p>
            </>
          )}
        </div>

        {/* Attorney Profile Details */}
        {attorney && (
          <div className="attorney-profile-card">
            <h2>Attorney Profile Details</h2>
            <div className="profile-grid">
              <div className="profile-item">
                <label>Name:</label>
                <span>{attorney.name || 'N/A'}</span>
              </div>
              <div className="profile-item">
                <label>Raw Name Debug:</label>
                <span style={{fontSize: '12px', fontFamily: 'monospace'}}>"{attorney.name}"</span>
              </div>
              <div className="profile-item">
                <label>Email:</label>
                <span>{attorney.email || 'N/A'}</span>
              </div>
              <div className="profile-item">
                <label>Phone:</label>
                <span>{attorney.phone || 'N/A'}</span>
              </div>
              <div className="profile-item">
                <label>Gender:</label>
                <span>{attorney.gender || 'N/A'}</span>
              </div>
              <div className="profile-item">
                <label>Address:</label>
                <span>{attorney.address || 'N/A'}</span>
              </div>
              <div className="profile-item">
                <label>Date of Birth:</label>
                <span>{attorney.dateOfBirth ? new Date(attorney.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="profile-item">
                <label>Specialization:</label>
                <span>{attorney.specialization || 'N/A'}</span>
              </div>
              <div className="profile-item">
                <label>Qualification:</label>
                <span>{attorney.qualification || 'N/A'}</span>
              </div>
              <div className="profile-item">
                <label>Experience:</label>
                <span>{attorney.experience || 0} years</span>
              </div>
              <div className="profile-item">
                <label>Consultation Fees:</label>
                <span>₹{attorney.fees || 0}</span>
              </div>
              {attorney.profile_pic && (
                <div className="profile-item full-width">
                  <label>Profile Picture:</label>
                  <img 
                    src={`http://localhost:5000/${attorney.profile_pic}`} 
                    alt="Profile" 
                    className="profile-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="stats-cards">
          <div className="card">
            <h2>Total Users</h2>
            <p>{totalPatients}</p>
          </div>
          <div className="card">
            <h2>Upcoming Appointments</h2>
            <p>{upcomingAppointments}</p>
          </div>
          <div className="card">
            <h2>Earnings</h2>
            <p>₹{earnings}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttorneyDashboard;

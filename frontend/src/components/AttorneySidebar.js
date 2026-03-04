import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./doctorSidebar.css";

const AttorneySidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  return (
    <div className="doctor-sidebar">
      <h2 className="logo">Attorney Panel</h2>
      <ul className="menu">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/attorney/dashboard">Dashboard</Link></li>
        <li><Link to="/attorney/profile">Profile</Link></li>
        <li><Link to="/attorney/appointments">Appointments</Link></li>
        <li><Link to="/attorney/consultation">Consultations</Link></li>
        <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
      </ul>
    </div>
  );
};

export default AttorneySidebar;


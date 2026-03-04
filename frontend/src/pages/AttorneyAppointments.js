// src/pages/AttorneyAppointments.js
import React, { useEffect, useState } from "react";
import Sidebar from "../components/AttorneySidebar";
import "../styles/doctorAppointments.css";
import { API } from "../config/api";

const AttorneyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
      try {
        const res = await fetch(API.ATTORNEY_APPOINTMENTS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load appointments");

        setAppointments(data.appointments || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div className="appointments-page">
      <Sidebar />
      <div className="appointments-content">
        <h1>Appointments</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading appointments...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
            <p>{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>No appointments found.</p>
          </div>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.id}</td>
                  <td>{appt.patient}</td>
                  <td>{appt.date}</td>
                  <td>{appt.time}</td>
                  <td className={`status ${appt.status.toLowerCase()}`}>
                    {appt.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttorneyAppointments;

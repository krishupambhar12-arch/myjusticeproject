import React, { useState, useEffect } from "react";
import { API } from "../config/api";
import "../styles/patientAppointments.css";
import ClientSidebar from "../components/ClientSidebar";

const ClientAppointments = () => {
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
        const res = await fetch(API.CLIENT_APPOINTMENTS, {
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
    <div className="dashboard-page">
      <ClientSidebar />
      <div className="appointments-container">
        <h2>My Appointments</h2>

        {loading ? (
          <div className="loading-container">
            <p>Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <p className="no-appointments">No appointments found.</p>
        ) : (
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Specialization</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Fees</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.specialization}</td>
                  <td>{appt.date}</td>
                  <td>{appt.time}</td>
                  <td className={`status status-${appt.status.toLowerCase()}`}>
                    {appt.status}
                  </td>
                  <td>₹{appt.fees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ClientAppointments;

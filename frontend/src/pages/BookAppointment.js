import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import { API } from "../config/api";
import "../styles/bookAppointment.css";

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    symptoms: "",
    notes: ""
  });
  const [message, setMessage] = useState("");

  const BACKEND_URL = "http://localhost:5000";

  const fetchDoctorDetails = useCallback(async () => {
    try {
      const res = await fetch(API.ALL_DOCTORS);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load attorney details");

      const doctorData = data.doctors?.find(d => d.id === doctorId || d._id === doctorId);
      if (doctorData) {
        setDoctor(doctorData);
      } else {
        setMessage("Attorney not found");
      }
    } catch (error) {
      console.error("Error fetching attorney details:", error);
      setMessage("Failed to load attorney details");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      setMessage("Please login to book a consultation");
      setLoading(false);
      return;
    }

    // Check if user is a client (Patient/Client)
    const isClient = role === "Patient" || role === "Client";
    if (!isClient) {
      setMessage("Only clients can book consultations");
      setLoading(false);
      return;
    }

    fetchDoctorDetails();
  }, [fetchDoctorDetails]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.time) {
      setMessage("Please select date and time");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Please login to book a consultation");
        return;
      }

      const appointmentData = {
        doctor_id: doctorId,
        date: formData.date,
        time: formData.time,
        symptoms: formData.symptoms,
        notes: formData.notes
      };

      const res = await fetch(API.BOOK_APPOINTMENT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Consultation booked successfully!");
        setTimeout(() => {
          navigate("/patient/appointments");
        }, 2000);
      } else {
        setMessage(data.message || "Failed to book consultation");
      }
    } catch (error) {
      console.error("Error booking consultation:", error);
      setMessage("Failed to book consultation");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="loading-container">
          <p>Loading attorney details...</p>
        </div>
        <Footer />
      </>
    );
  }

  // Check authentication and role
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return (
      <>
        <Header />
        <div className="error-container">
          <p>Please login to book a consultation</p>
          <button onClick={() => navigate("/login")}>Go to Login</button>
          <button onClick={() => navigate("/doctors")}>Back to Attorneys</button>
        </div>
        <Footer />
      </>
    );
  }

  const isClient = role === "Patient" || role === "Client";
  if (!isClient) {
    return (
      <>
        <Header />
        <div className="error-container">
          <p>Only clients can book consultations</p>
          <button onClick={() => navigate("/doctors")}>Back to Attorneys</button>
        </div>
        <Footer />
      </>
    );
  }

  if (!doctor) {
    return (
      <>
        <Header />
        <div className="error-container">
          <p>{message}</p>
          <button onClick={() => navigate("/doctors")}>Back to Attorneys</button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="book-appointment-container">
        <div className="appointment-header">
          <h1>Book Consultation</h1>
          <p>Schedule your consultation with Attorney {doctor.name}</p>
        </div>

        <div className="appointment-content">
          {/* Attorney Info Card */}
          <div className="doctor-info-card">
            <div className="doctor-image">
              <img
                src={doctor.profile_pic ? `${BACKEND_URL}/${doctor.profile_pic}` : ""}
                alt={doctor.name}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
            <div className="doctor-details">
              <h3>Attorney {doctor.name}</h3>
              <p className="specialization">{doctor.specialization}</p>
              <p className="qualification">{doctor.qualification}</p>
              <p className="experience">{doctor.experience} years experience</p>
              <p className="fees">₹{doctor.fees} consultation fee</p>
              {doctor.phone && <p className="phone">📞 {doctor.phone}</p>}
              <div className="rating">
                <span>⭐ {doctor.rating}</span>
              </div>
            </div>
          </div>

          {/* Appointment Form */}
          <div className="appointment-form">
            <h2>Consultation Details</h2>

            {message && (
              <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="date">Preferred Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="time">Preferred Time *</label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select time</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="symptoms">Symptoms (Optional)</label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  placeholder="Describe your symptoms..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional information..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => navigate("/doctors")} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="book-btn">
                  Book Consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default BookAppointment;

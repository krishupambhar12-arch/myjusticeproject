// back-end/routes/doctor.js (attorney routes; mounted at /attorney)
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Attorney = require("../models/Attorney");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const Consultation = require("../models/Consultation");
const ConsultationMessage = require("../models/ConsultationMessage");
let Appointment;
try { Appointment = require("../models/Appointment"); } catch {}

// ===== Multer setup for file upload =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // uploads/ folder root me hona chahiye
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ===== DEBUG ROUTE - Check Attorney Data =====
router.get("/debug", async (req, res) => {
  try {
    console.log("🔍 Debug: Checking attorney data...");
    
    const allAttorneys = await Attorney.find({});
    console.log("🔍 Total attorneys found:", allAttorneys.length);
    
    const attorneyData = allAttorneys.map(att => ({
      id: att._id,
      email: att.attorneyEmail,
      name: att.attorneyName,
      hasPassword: !!att.attorneyPassword,
      passwordLength: att.attorneyPassword ? att.attorneyPassword.length : 0
    }));
    
    res.json({
      message: "Debug data",
      totalAttorneys: allAttorneys.length,
      attorneys: attorneyData
    });
  } catch (error) {
    console.error("❌ Debug error:", error);
    res.status(500).json({ message: "Debug error", error: error.message });
  }
});

// ===== ATTORNEY LOGIN =====
router.post("/login", async (req, res) => {
  try {
    console.log("🔍 Attorney login attempt:", { email: req.body.email });
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Debug: Check all attorneys in database
    console.log("🔍 Checking all attorneys in database...");
    const allAttorneys = await Attorney.find({});
    console.log("🔍 Total attorneys found:", allAttorneys.length);
    allAttorneys.forEach(att => {
      console.log(`  - ${att.attorneyEmail} (ID: ${att._id})`);
    });

    // Also check User model for attorneys
    console.log("🔍 Checking User model for attorneys...");
    const userAttorneys = await User.find({ role: "Attorney" });
    console.log("🔍 Total attorneys in User model:", userAttorneys.length);
    userAttorneys.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user._id})`);
    });

    // Find attorney by email in Attorney model first
    let attorney = await Attorney.findOne({ attorneyEmail: email });
    console.log("🔍 Attorney found in Attorney model:", attorney ? "Yes" : "No");
    
    // If not found in Attorney model, check User model
    if (!attorney) {
      console.log("🔍 Checking User model for attorney...");
      const userAttorney = await User.findOne({ email, role: "Attorney" });
      if (userAttorney) {
        console.log("🔍 Attorney found in User model, creating Attorney record...");
        
        // Check if User has comparePassword method, if not, use direct bcrypt comparison
        let isPasswordMatch = false;
        try {
          if (userAttorney.comparePassword) {
            isPasswordMatch = await userAttorney.comparePassword(password);
          } else {
            // Use direct bcrypt comparison
            const bcrypt = require('bcryptjs');
            isPasswordMatch = await bcrypt.compare(password, userAttorney.password);
          }
        } catch (error) {
          console.log("❌ Password comparison error:", error.message);
        }
        
        if (!isPasswordMatch) {
          console.log("❌ Invalid password for User model attorney");
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Create Attorney record from User data
        attorney = new Attorney({
          attorneyName: userAttorney.name,
          attorneyEmail: userAttorney.email,
          attorneyPassword: userAttorney.password, // Already hashed
          attorneyPhone: userAttorney.phone || "",
          attorneyGender: userAttorney.gender || "",
          attorneyAddress: userAttorney.address || "",
          attorneyDOB: userAttorney.dateOfBirth || null,
          specialization: "",
          qualification: "",
          experience: 0,
          fees: 0,
          profilePicture: null
        });
        
        await attorney.save();
        console.log("✅ Attorney record created from User data");
        
        // Remove from User model to avoid duplicates
        await User.deleteOne({ _id: userAttorney._id });
        console.log("🔍 Removed duplicate from User model");
      }
    }
    
    if (!attorney) {
      console.log("❌ Attorney not found for email:", email);
      return res.status(404).json({ message: "Attorney not found" });
    }

    console.log("🔍 Attorney ID:", attorney._id);
    console.log("🔍 Attorney email:", attorney.attorneyEmail);
    console.log("🔍 Attorney has password:", !!attorney.attorneyPassword);

    // Check password - Attorney model has comparePassword method
    if (!attorney.attorneyPassword) {
      console.log("❌ Attorney has no password set");
      return res.status(500).json({ message: "Attorney account not properly configured" });
    }

    console.log("🔍 Attempting password comparison...");
    const isMatch = await attorney.comparePassword(password);
    console.log("🔍 Password match:", isMatch ? "Yes" : "No");
    
    if (!isMatch) {
      console.log("❌ Invalid password for email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: attorney._id, role: "Attorney" },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "24h" }
    );

    console.log("✅ Attorney login successful for:", email);

    console.log("🔍 Generated token payload:", {
      id: attorney._id,
      role: "Attorney"
    });

    res.status(200).json({
      message: "Login successful",
      token,
      attorney: {
        id: attorney._id,
        name: attorney.attorneyName,
        email: attorney.attorneyEmail
      }
    });
  } catch (error) {
    console.error("❌ Attorney login error:", error);
    console.error("❌ Error type:", error.constructor.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // Send specific error messages based on error type
    let errorMessage = "Server error";
    if (error.message.includes("bcrypt")) {
      errorMessage = "Password verification failed";
    } else if (error.message.includes("Cast to ObjectId failed")) {
      errorMessage = "Invalid attorney ID format";
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      errorMessage = "Database connection error";
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== POST Attorney Details =====
router.post("/details", upload.single("profile_pic"), async (req, res) => {
  try {
    const { 
      attorneyId,
      attorneyName,
      specialization, 
      qualification, 
      experience, 
      fees
    } = req.body;

    console.log("🔍 Attorney details submission:");
    console.log("  - attorneyId:", attorneyId);
    console.log("  - attorneyName:", attorneyName);
    console.log("  - specialization:", specialization);
    console.log("  - qualification:", qualification);
    console.log("  - experience:", experience);
    console.log("  - fees:", fees);
    console.log("  - profile_pic:", req.file?.filename);

    if (!attorneyId) {
      return res.status(400).json({ message: "❌ attorneyId is required" });
    }

    if (!specialization || !qualification || !experience || !fees) {
      return res.status(400).json({ message: "❌ All fields are required" });
    }

    // Update existing attorney record
    const attorney = await Attorney.findByIdAndUpdate(
      attorneyId,
      {
        attorneyName,
        specialization,
        qualification,
        experience: parseInt(experience) || 0,
        fees: parseFloat(fees) || 0,
        profilePicture: req.file ? req.file.filename : null
      },
      { new: true }
    );

    if (!attorney) {
      return res.status(404).json({ message: "❌ Attorney not found" });
    }

    console.log("✅ Attorney details updated in 'attorneys' table:");
    console.log("  - Updated ID:", attorney._id);
    console.log("  - Updated Name:", attorney.attorneyName);
    console.log("  - Updated Specialization:", attorney.specialization);
    console.log("  - Updated Qualification:", attorney.qualification);
    console.log("  - Updated Experience:", attorney.experience);
    console.log("  - Updated Fees:", attorney.fees);

    res.status(200).json({
      message: "✅ Attorney details updated successfully!",
      attorney: {
        id: attorney._id,
        attorneyName: attorney.attorneyName,
        attorneyEmail: attorney.attorneyEmail,
        specialization: attorney.specialization,
        qualification: attorney.qualification,
        experience: attorney.experience,
        fees: attorney.fees,
        profilePicture: attorney.profilePicture
      }
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// ===== UPDATE Attorney Profile =====
// PUT /attorney/profile  (auth required)
// Accepts multipart/form-data for optional profile_pic
router.put("/profile", auth, upload.single("profile_pic"), async (req, res) => {
  try {
    const {
      attorneyName,
      attorneyEmail,
      attorneyPhone,
      attorneyGender,
      attorneyAddress,
      attorneyDOB,
      specialization,
      qualification,
      experience,
      fees
    } = req.body;

    // Find attorney by ID (from auth middleware)
    const attorney = await Attorney.findById(req.userId);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney not found" });
    }

    // Update fields - only update if value is provided and not empty
    if (attorneyName && attorneyName.trim()) attorney.attorneyName = attorneyName.trim();
    if (attorneyEmail && attorneyEmail.trim()) attorney.attorneyEmail = attorneyEmail.trim();
    if (attorneyPhone && attorneyPhone.trim()) attorney.attorneyPhone = attorneyPhone.trim();
    if (attorneyGender && attorneyGender.trim()) attorney.attorneyGender = attorneyGender.trim();
    if (attorneyAddress && attorneyAddress.trim()) attorney.attorneyAddress = attorneyAddress.trim();
    if (attorneyDOB && attorneyDOB.trim()) attorney.attorneyDOB = attorneyDOB.trim();
    if (specialization && specialization.trim()) attorney.specialization = specialization.trim();
    if (qualification && qualification.trim()) attorney.qualification = qualification.trim();
    if (experience !== undefined && experience !== "") attorney.experience = parseInt(experience) || 0;
    if (fees !== undefined && fees !== "") attorney.fees = parseFloat(fees) || 0;
    if (req.file) {
    console.log("🔍 Profile picture uploaded:", req.file.filename);
    console.log("🔍 Full file path:", req.file.path);
    attorney.profilePicture = req.file.filename;
  }

    await attorney.save();

    res.json({
      message: "Profile updated successfully",
      attorney: {
        id: attorney._id,
        attorneyName: attorney.attorneyName,
        attorneyEmail: attorney.attorneyEmail,
        attorneyPhone: attorney.attorneyPhone,
        attorneyGender: attorney.attorneyGender,
        attorneyAddress: attorney.attorneyAddress,
        attorneyDOB: attorney.attorneyDOB,
        specialization: attorney.specialization,
        qualification: attorney.qualification,
        experience: attorney.experience,
        fees: attorney.fees,
        profilePicture: attorney.profilePicture ? `uploads/${attorney.profilePicture}` : null
      }
    });
  } catch (e) {
    console.error("Update profile error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /attorney/dashboard  -> Attorney + today's appointments count
router.get("/dashboard", auth, async (req, res) => {
  try {
    console.log("🔍 Dashboard request - userId:", req.userId);
    console.log("🔍 Dashboard request - userRole:", req.userRole);
    
    // Attorney profile (direct lookup by attorney ID)
    const attorney = await Attorney.findById(req.userId).lean();
    console.log("🔍 Attorney found:", attorney ? "Yes" : "No");
    console.log("🔍 Attorney data:", attorney);
    
    if (!attorney) {
      console.log("❌ Attorney not found for ID:", req.userId);
      return res.status(404).json({ message: "Attorney profile not found" });
    }

    // Stats (0 if Appointment model not present)
    let todayCount = 0;
    let totalClients = 0;
    let upcomingAppointments = 0;
    let earnings = 0;

    if (Appointment) {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date();   end.setHours(23,59,59,999);

      // today count
      todayCount = await Appointment.countDocuments({
        doctor_id: attorney._id,
        date: { $gte: start, $lte: end },
        status: { $ne: "Cancelled" }
      });

      // total unique clients seen by this attorney
      const uniqueClients = await Appointment.distinct("user_id", { doctor_id: attorney._id });
      totalClients = uniqueClients.length;

      // upcoming appointments from now (status pending/confirmed)
      upcomingAppointments = await Appointment.countDocuments({
        doctor_id: attorney._id,
        date: { $gte: new Date() },
        status: { $in: ["Pending", "Confirmed"] }
      });

      // simple earnings estimate = total completed appointments * fees
      const completedCount = await Appointment.countDocuments({
        doctor_id: attorney._id,
        status: { $in: ["Completed", "Done", "Approved"] }
      });
      earnings = completedCount * (attorney.fees || 0);
    }

    res.json({
      attorney: {
        id: attorney._id,
        name: attorney.attorneyName,
        email: attorney.attorneyEmail,
        phone: attorney.attorneyPhone,
        gender: attorney.attorneyGender,
        address: attorney.attorneyAddress,
        dateOfBirth: attorney.attorneyDOB,
        specialization: attorney.specialization,
        qualification: attorney.qualification,
        experience: attorney.experience,
        fees: attorney.fees,
        profile_pic: attorney.profilePicture ? `uploads/${attorney.profilePicture}` : null
      },
      stats: {
        todayAppointments: todayCount,
        totalClients,
        upcomingAppointments,
        earnings
      }
    });
    console.log("🔍 Dashboard response - profile picture:", attorney.profilePicture);
  } catch (e) {
    console.error("Dashboard error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET Attorney Appointments =====
// GET /attorney/appointments  -> All appointments for this attorney
router.get("/appointments", auth, async (req, res) => {
  try {
    // Find attorney profile
    const attorney = await Attorney.findById(req.userId).lean();
    if (!attorney) return res.status(404).json({ message: "Attorney profile not found" });

    // Get all appointments for this attorney
    let appointments = [];
    if (Appointment) {
      appointments = await Appointment.find({ doctor_id: attorney._id })
        .populate('user_id', 'name email phone')
        .sort({ date: 1, time: 1 })
        .lean();
    }

    // Format appointments for frontend
    const formattedAppointments = appointments.map(appt => ({
      id: appt._id,
      client: appt.user_id?.name || "Unknown Client",
      clientEmail: appt.user_id?.email || "",
      clientPhone: appt.user_id?.phone || "",
      date: new Date(appt.date).toISOString().split('T')[0],
      time: appt.time,
      status: appt.status,
      createdAt: appt.createdAt
    }));

    res.json({
      appointments: formattedAppointments,
      total: formattedAppointments.length
    });
  } catch (e) {
    console.error("Appointments error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET All Attorneys (Public) =====
// GET /attorney/all  -> Get all attorneys for public listing
router.get("/all", async (req, res) => {
  try {
    const { specialization, search } = req.query;
    
    // Build query
    let query = {};
    
    // Filter by specialization if provided
    if (specialization && specialization !== 'all') {
      query.specialization = { $regex: specialization, $options: 'i' };
    }
    
    // Get all attorneys
    let attorneys = await Attorney.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    // Apply search filter if provided
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      attorneys = attorneys.filter(attorney => 
        attorney.attorneyName?.match(searchRegex) ||
        attorney.specialization?.match(searchRegex) ||
        attorney.qualification?.match(searchRegex)
      );
    }
    
    // Format for frontend
    const formattedAttorneys = attorneys.map(attorney => ({
      id: attorney._id,
      name: attorney.attorneyName || "Attorney Unknown",
      email: attorney.attorneyEmail || "",
      phone: attorney.attorneyPhone || "",
      specialization: attorney.specialization,
      qualification: attorney.qualification,
      experience: attorney.experience,
      fees: attorney.fees,
      profile_pic: attorney.profilePicture,
      rating: 4.5, // You can add rating system later
      available: true
    }));
    
    res.json({
      attorneys: formattedAttorneys,
      total: formattedAttorneys.length
    });
  } catch (e) {
    console.error("Get all doctors error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== POST Book Appointment =====
router.post("/book-appointment", auth, async (req, res) => {
  try {
    // Check if user is a client
    if (req.userRole !== "Client") {
      return res.status(403).json({ message: "Only clients can book appointments" });
    }

    const { doctor_id, date, time, symptoms, notes } = req.body;

    if (!doctor_id || !date || !time) {
      return res.status(400).json({ message: "Attorney ID, date, and time are required" });
    }

    // Check if attorney exists
    const attorney = await Attorney.findById(doctor_id);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney not found" });
    }

    // Check if user is trying to book appointment with themselves (if they are an attorney)
    if (req.userRole === "Attorney") {
      const userAttorney = await Attorney.findById(req.userId);
      if (userAttorney && userAttorney._id.toString() === doctor_id) {
        return res.status(400).json({ message: "Attorneys cannot book appointments with themselves" });
      }
    }

    // Check if appointment already exists for this time slot
    const existingAppointment = await Appointment.findOne({
      doctor_id,
      date,
      time,
      status: { $in: ["Pending", "Upcoming"] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "This time slot is already booked" });
    }

    // Create new appointment
    const appointment = new Appointment({
      user_id: req.userId,
      doctor_id,
      date,
      time,
      symptoms: symptoms || "",
      notes: notes || "",
      status: "Pending"
    });

    await appointment.save();
    


    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: {
        id: appointment._id,
        doctor_id: appointment.doctor_id,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status
      }
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Failed to book appointment" });
  }
});

// ===== GET Attorney Consultations =====
router.get("/consultations", auth, async (req, res) => {
  try {
    // Check if user is an attorney
    if (req.userRole !== "Attorney") {
      return res.status(403).json({ message: "Only attorneys can access this endpoint" });
    }

    // Find attorney by userId
    const attorney = await Attorney.findById(req.userId);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney profile not found" });
    }

    const consultations = await Consultation.find({ doctor_id: attorney._id })
      .populate('patient_id', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    const formattedConsultations = consultations.map(consultation => ({
      id: consultation._id,
      patient_name: consultation.patient_id?.name || "Unknown",
      patient_email: consultation.patient_id?.email || "",
      status: consultation.status,
      subject: consultation.subject || "",
      createdAt: consultation.createdAt,
      updatedAt: consultation.updatedAt
    }));

    res.json({
      consultations: formattedConsultations,
      total: formattedConsultations.length
    });
  } catch (error) {
    console.error("Get doctor consultations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== SEND Message in Consultation (Attorney) =====
router.post("/consultation/:consultationId/message", auth, async (req, res) => {
  try {
    // Check if user is an attorney
    if (req.userRole !== "Attorney") {
      return res.status(403).json({ message: "Only attorneys can send messages" });
    }

    const { consultationId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Find attorney by userId
    const attorney = await Attorney.findById(req.userId);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney profile not found" });
    }

    // Check if consultation exists and belongs to this attorney
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    if (consultation.doctor_id.toString() !== attorney._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access to this consultation" });
    }

    // Create message
    const consultationMessage = new ConsultationMessage({
      consultation_id: consultationId,
      sender_id: req.userId,
      sender_role: 'Attorney',
      message: message.trim()
    });

    await consultationMessage.save();

    // Update consultation updatedAt
    await Consultation.findByIdAndUpdate(consultationId, { updatedAt: new Date() });

    res.status(201).json({
      message: "Message sent successfully",
      messageData: {
        id: consultationMessage._id,
        message: consultationMessage.message,
        sender_role: consultationMessage.sender_role,
        createdAt: consultationMessage.createdAt
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET Messages for Consultation (Attorney) =====
router.get("/consultation/:consultationId/messages", auth, async (req, res) => {
  try {
    // Check if user is an attorney
    if (req.userRole !== "Attorney") {
      return res.status(403).json({ message: "Only attorneys can access this endpoint" });
    }

    const { consultationId } = req.params;

    // Find attorney by userId
    const attorney = await Attorney.findById(req.userId);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney profile not found" });
    }

    // Check if consultation exists and belongs to this attorney
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    if (consultation.doctor_id.toString() !== attorney._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access to this consultation" });
    }

    // Get all messages for this consultation
    const messages = await ConsultationMessage.find({ consultation_id: consultationId })
      .populate('sender_id', 'name')
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      message: msg.message,
      sender_role: msg.sender_role,
      sender_name: msg.sender_id?.name || "Unknown",
      createdAt: msg.createdAt,
      read: msg.read
    }));

    // Mark client messages as read
    await ConsultationMessage.updateMany(
      { consultation_id: consultationId, sender_role: 'Client', read: false },
      { read: true }
    );

    res.json({
      messages: formattedMessages,
      total: formattedMessages.length
    });
  } catch (error) {
    console.error("Get consultation messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
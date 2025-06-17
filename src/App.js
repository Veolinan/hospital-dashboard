import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import RegisterHospital from "./pages/RegisterHospital";
import RegisterDoctor from "./pages/RegisterDoctor";
import LandingPage from "./pages/LandingPage"; 
import RegisterPatient from "./pages/RegisterPatient";
import LoginPatient from "./pages/LoginPatient";
import Questionnaire from "./pages/Questionnaire";
import QuestionBuilder from "./pages/QuestionBuilder"; 
import AdminRegister from "./pages/AdminRegister";
import DoctorDashboard from "./pages/DoctorDashboard";
import HospitalDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard"; 


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register-hospital" element={<RegisterHospital />} />
        <Route path="/register-doctor" element={<RegisterDoctor />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/login-patient" element={<LoginPatient />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/question-builder" element={<QuestionBuilder />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/hospital-dashboard" element={<HospitalDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />
        {/* Add more routes as needed */}
      

      </Routes>
    </Router>
  );
}

export default App;

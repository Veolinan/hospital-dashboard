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
import LoginPage from "./pages/LoginPage";
import FlaggedPatients from "./pages/FlaggedPatients";
import PatientReports from "./pages/PatientReports";
import DormantPatients from "./pages/DormantPatients";
import RequestPatient from "./pages/RequestPatient";
import Requests from "./pages/Requests"; 
import TransferPatient from "./pages/TransferPatient";


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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/flagged-patients" element={<FlaggedPatients />} />
        <Route path="/patient-reports" element={<PatientReports />} />
        <Route path="/dormant-patients" element={<DormantPatients />} />
        <Route path="/request-patient" element={<RequestPatient />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/transfer-patient" element={<TransferPatient />} />
        {/* Add more routes as needed */}
      

      </Routes>
    </Router>
  );
}

export default App;

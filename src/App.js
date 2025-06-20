import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 🌐 Public Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import LoginPatient from "./pages/LoginPatient";

// 🧾 Registration Pages
import RegisterHospital from "./pages/RegisterHospital";
import RegisterDoctor from "./pages/RegisterDoctor";
import RegisterPatient from "./pages/RegisterPatient";
import AdminRegister from "./pages/AdminRegister";

// 📋 Questionnaire Pages
import QuestionBuilder from "./pages/QuestionBuilder";
import Questionnaire from "./pages/Questionnaire";
import PreviewQuestion from "./pages/PreviewQuestion";

// 🩺 Doctor Pages
import DoctorDashboard from "./pages/DoctorDashboard";
import AllPatients from "./pages/AllPatients";
import FlaggedPatients from "./pages/FlaggedPatients";
import DormantPatients from "./pages/DormantPatients";
import PatientReports from "./pages/PatientReports";
import RequestPatient from "./pages/RequestPatient";
import Requests from "./pages/Requests";

// 🏥 Hospital Admin Pages
import HospitalAdminDashboard from "./pages/HospitalAdminDashboard";
import ManageStaff from "./pages/ManageStaff";
import TransferPatient from "./pages/TransferPatient";

// 🛡️ Admin Dashboards
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

// ⚠️ Error / Info
import NotAllowed from "./pages/NotAllowed";
import PageNotFound from "./pages/PageNotFound";

function App() {
  return (
    <Router>
      <Routes>
        {/* 🌐 Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login-patient" element={<LoginPatient />} />
        <Route path="/questionnaire" element={<Questionnaire />} />

        {/* 🧾 Registration Pages */}
        <Route path="/register-hospital" element={<RegisterHospital />} />
        <Route path="/register-doctor" element={<RegisterDoctor />} />
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/admin-register" element={<AdminRegister />} />

        {/* 📋 Questionnaire Tools */}
        <Route path="/question-builder" element={<QuestionBuilder />} />
        <Route path="/preview-question" element={<PreviewQuestion />} />

        {/* 🩺 Doctor Pages */}
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/all-patients" element={<AllPatients />} />
        <Route path="/flagged-patients" element={<FlaggedPatients />} />
        <Route path="/dormant-patients" element={<DormantPatients />} />
        <Route path="/patient-reports" element={<PatientReports />} />
        <Route path="/request-patient" element={<RequestPatient />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/question-preview" element={<PreviewQuestion />} />

        {/* 🏥 Hospital Admin Pages (Nested Routes) */}
        <Route path="/admin" element={<HospitalAdminDashboard />}>
          <Route path="patients" element={<AllPatients />} />
          <Route path="flagged" element={<FlaggedPatients />} />
          <Route path="dormant" element={<DormantPatients />} />
          <Route path="reports" element={<PatientReports />} />
          <Route path="staff" element={<ManageStaff />} />
          <Route path="transfer-patient" element={<TransferPatient />} />
        </Route>

        {/* 🛡️ Admin Dashboards */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />

        {/* ⚠️ Info / Errors */}
        <Route path="/not-allowed" element={<NotAllowed />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  );
}

export default App;

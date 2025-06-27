import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 🧩 Layout
import ProtectedLayout from "./layouts/ProtectedLayout";

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
import PatientHistory from "./pages/patientHistory";

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
  // ❗ TODO: Replace this with your actual user role logic (e.g., Firebase auth)
  const userRole = "doctor"; // or "admin", "hospitalAdmin", "superAdmin", or null for public/patient

  // A small utility to wrap role-specific routes with sidebar
  const withLayout = (Component, role = userRole) => (
    <ProtectedLayout role={role}>
      <Component />
    </ProtectedLayout>
  );

  return (
    <Router>
      <Routes>
        {/* 🌐 Public Routes (no sidebar) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login-patient" element={<LoginPatient />} />
        <Route path="/questionnaire" element={<Questionnaire />} />

        {/* 🧾 Registration Pages (with sidebar) */}
        <Route path="/register-hospital" element={withLayout(RegisterHospital)} />
        <Route path="/register-doctor" element={withLayout(RegisterDoctor)} />
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/admin-register" element={withLayout(AdminRegister, "superAdmin")} />

        {/* 📋 Questionnaire Tools */}
        <Route path="/question-builder" element={withLayout(QuestionBuilder)} />
        <Route path="/preview-question" element={withLayout(PreviewQuestion)} />
        <Route path="/question-preview" element={withLayout(PreviewQuestion)} />

        {/* 🩺 Doctor Pages */}
        <Route path="/doctor-dashboard" element={withLayout(DoctorDashboard)} />
        <Route path="/all-patients" element={withLayout(AllPatients)} />
        <Route path="/all-patients:patientId" element={withLayout(AllPatients)} />
        <Route path="/flagged-patients" element={withLayout(FlaggedPatients)} />
        <Route path="/dormant-patients" element={withLayout(DormantPatients)} />
        <Route path="/patient-reports" element={withLayout(PatientReports)} />
        <Route path="/request-patient" element={withLayout(RequestPatient)} />
        <Route path="/requests" element={withLayout(Requests)} />
        <Route path="/patient-history/:patientId" element={withLayout(PatientHistory)} />
        <Route path="patients/:Id" element={withLayout(AllPatients)} />

        {/* 🏥 Hospital Admin Pages */}
        <Route path="/admin" element={withLayout(HospitalAdminDashboard, "hospitalAdmin")} />
        <Route path="/admin/patients" element={withLayout(AllPatients, "hospitalAdmin")} />
        <Route path="/admin/flagged" element={withLayout(FlaggedPatients, "hospitalAdmin")} />
        <Route path="/admin/dormant" element={withLayout(DormantPatients, "hospitalAdmin")} />
        <Route path="/admin/reports" element={withLayout(PatientReports, "hospitalAdmin")} />
        <Route path="/admin/staff" element={withLayout(ManageStaff, "hospitalAdmin")} />
        <Route path="/admin/transfer-patient" element={withLayout(TransferPatient, "hospitalAdmin")} />

        {/* 🛡️ Admin Dashboards */}
        <Route path="/admin-dashboard" element={withLayout(AdminDashboard, "admin")} />
        <Route path="/super-admin-dashboard" element={withLayout(SuperAdminDashboard, "superAdmin")} />

        {/* ⚠️ Errors */}
        <Route path="/not-allowed" element={<NotAllowed />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  );
}

export default App;

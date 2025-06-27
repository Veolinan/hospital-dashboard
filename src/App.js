import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// Layout
import ProtectedLayout from "./layouts/ProtectedLayout";

// Route guard
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import LoginPatient from "./pages/LoginPatient";
import RegisterHospital from "./pages/RegisterHospital";
import RegisterDoctor from "./pages/RegisterDoctor";
import RegisterPatient from "./pages/RegisterPatient";
import AdminRegister from "./pages/AdminRegister";
import QuestionBuilder from "./pages/QuestionBuilder";
import Questionnaire from "./pages/Questionnaire";
import PreviewQuestion from "./pages/PreviewQuestion";
import DoctorDashboard from "./pages/DoctorDashboard";
import AllPatients from "./pages/AllPatients";
import FlaggedPatients from "./pages/FlaggedPatients";
import DormantPatients from "./pages/DormantPatients";
import PatientReports from "./pages/PatientReports";
import RequestPatient from "./pages/RequestPatient";
import Requests from "./pages/Requests";
import PatientHistory from "./pages/patientHistory";
import HospitalAdminDashboard from "./pages/HospitalAdminDashboard";
import ManageStaff from "./pages/ManageStaff";
import TransferPatient from "./pages/TransferPatient";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotAllowed from "./pages/NotAllowed";
import PageNotFound from "./pages/PageNotFound";

function App() {
  const [user, loading] = useAuthState(auth);
  const [role, setRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRole(snap.data().role || null);
        }
      } else {
        setRole(null);
      }
      setCheckingRole(false);
    };

    fetchRole();
  }, [user]);

  if (loading || checkingRole) return <div className="p-8 text-center">Loading...</div>;

  const withLayout = (Component, allowedRoles) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <ProtectedLayout role={role}>
        <Component />
      </ProtectedLayout>
    </ProtectedRoute>
  );

  return (
    <Router>
      <Routes>
        {/* 🌐 Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login-patient" element={<LoginPatient />} />
        <Route path="/questionnaire" element={<Questionnaire />} />

        {/* 🧾 Registration */}
        <Route path="/register-patient" element={<RegisterPatient />} />
        <Route path="/register-hospital" element={withLayout(RegisterHospital, ["admin"])} />
        <Route path="/register-doctor" element={withLayout(RegisterDoctor, ["admin"])} />
        <Route path="/admin-register" element={withLayout(AdminRegister, ["superAdmin"])} />

        {/* 📋 Questionnaire Tools */}
        <Route path="/question-builder" element={withLayout(QuestionBuilder, ["doctor", "admin"])} />
        <Route path="/preview-question" element={withLayout(PreviewQuestion, ["doctor", "admin"])} />
        <Route path="/question-preview" element={withLayout(PreviewQuestion, ["doctor", "admin"])} />

        {/* 🩺 Doctor */}
        <Route path="/doctor-dashboard" element={withLayout(DoctorDashboard, ["doctor"])} />
        <Route path="/all-patients" element={withLayout(AllPatients, ["doctor", "hospitalAdmin", "admin"])} />
        <Route path="/all-patients:patientId" element={withLayout(AllPatients, ["doctor", "hospitalAdmin", "admin"])} />
        <Route path="/flagged-patients" element={withLayout(FlaggedPatients, ["doctor", "hospitalAdmin", "admin"])} />
        <Route path="/dormant-patients" element={withLayout(DormantPatients, ["doctor", "hospitalAdmin", "admin"])} />
        <Route path="/patient-reports" element={withLayout(PatientReports, ["doctor", "hospitalAdmin", "admin"])} />
        <Route path="/request-patient" element={withLayout(RequestPatient, ["doctor"])} />
        <Route path="/requests" element={withLayout(Requests, ["doctor"])} />
        <Route path="/patient-history/:patientId" element={withLayout(PatientHistory, ["doctor", "hospitalAdmin", "admin"])} />
        <Route path="/patients/:Id" element={withLayout(AllPatients, ["doctor", "hospitalAdmin", "admin"])} />

        {/* 🏥 Hospital Admin */}
        <Route path="/admin" element={withLayout(HospitalAdminDashboard, ["hospitalAdmin", "admin"])} />
        <Route path="/admin/patients" element={withLayout(AllPatients, ["hospitalAdmin", "admin"])} />
        <Route path="/admin/flagged" element={withLayout(FlaggedPatients, ["hospitalAdmin", "admin"])} />
        <Route path="/admin/dormant" element={withLayout(DormantPatients, ["hospitalAdmin", "admin"])} />
        <Route path="/admin/reports" element={withLayout(PatientReports, ["hospitalAdmin", "admin"])} />
        <Route path="/admin/staff" element={withLayout(ManageStaff, ["hospitalAdmin", "admin"])} />
        <Route path="/admin/transfer-patient" element={withLayout(TransferPatient, ["hospitalAdmin", "admin"])} />

        {/* 🛡️ Admin Dashboards */}
        <Route path="/admin-dashboard" element={withLayout(AdminDashboard, ["admin"])} />
        <Route path="/super-admin-dashboard" element={withLayout(SuperAdminDashboard, ["superAdmin"])} />

        {/* ⚠️ Errors */}
        <Route path="/not-allowed" element={<NotAllowed />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  );
}

export default App;

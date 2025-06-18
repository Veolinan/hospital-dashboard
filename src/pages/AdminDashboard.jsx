// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function AdminDashboard() {
  const [hospitalCount, setHospitalCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const hospitals = await getDocs(collection(db, "hospitals"));
      const staff = await getDocs(collection(db, "users"));
      const patients = await getDocs(collection(db, "patients"));

      setHospitalCount(hospitals.size);
      setStaffCount(staff.size);
      setPatientCount(patients.size);
    };

    fetchStats();
  }, []);

  const navItems = [
    {
      title: "Register Hospital",
      to: "/register-hospital",
      bg: "bg-blue-600",
    },
    {
      title: "Manage Hospitals",
      to: "/managehospitals",
      bg: "bg-green-600",
    },
    {
      title: "Aggregate Reports",
      to: "/adminreports",
      bg: "bg-yellow-500",
    },
    {
      title: "Manage Staff",
      to: "/staff",
      bg: "bg-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        🧑‍💼 Admin Dashboard
      </h1>

      {/* Stats Overview */}
      <div className="grid sm:grid-cols-3 gap-6 mb-10 max-w-5xl mx-auto">
        <StatCard label="Hospitals" value={hospitalCount} color="text-blue-700" />
        <StatCard label="Staff Members" value={staffCount} color="text-green-700" />
        <StatCard label="Patients Registered" value={patientCount} color="text-rose-700" />
      </div>

      {/* Navigation */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {navItems.map((item, idx) => (
          <Link
            key={idx}
            to={item.to}
            className={`${item.bg} hover:scale-105 transition-transform duration-200 text-white font-medium p-5 rounded-xl shadow-lg text-center`}
          >
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Reusable card component
const StatCard = ({ label, value, color }) => (
  <div className="bg-white shadow-lg rounded-xl p-6 text-center border">
    <div className={`text-4xl font-extrabold ${color}`}>{value}</div>
    <div className="text-sm mt-2 text-gray-600 uppercase tracking-wide">{label}</div>
  </div>
);

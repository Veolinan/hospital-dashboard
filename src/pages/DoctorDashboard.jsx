// src/pages/DoctorDashboard.jsx
import React, { useState, useEffect, lazy, Suspense, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { signOut } from "firebase/auth";

import DoctorNavbar from "../components/DoctorNavbar";

const LineChartStats = lazy(() => import("../components/FlaggedLineChart"));

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [counts, setCounts] = useState({ flagged: 0, booked: 0, resolved: 0 });
  const [trendData, setTrendData] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "flaggedCases"),
      where("assignedTo", "==", uid)
    );
    const unsub = onSnapshot(q, snap => {
      const tally = { flagged: 0, booked: 0, resolved: 0 };
      const dayCounts = {};

      snap.docs.forEach(d => {
        const c = d.data();
        tally[c.status] = (tally[c.status] || 0) + 1;
        const date = c.flaggedAt?.toDate().toLocaleDateString();
        if (date) dayCounts[date] = (dayCounts[date] || 0) + 1;
      });

      setCounts(tally);
      setTrendData(Object.entries(dayCounts).map(([date, count]) => ({ date, count })));
    });

    return () => unsub();
  }, []);

  const currentUser = auth.currentUser;
  const isLoading = trendData.length === 0 && counts.flagged === 0;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { to: "/register-patient", label: "Register Patient" },
    { to: "/all-patients", label: "All Patients" },
    { to: "/flagged-patients", label: "Flagged Patients" },
    { to: "/dormant-patients", label: "Dormant Patients" },
    { to: "/patient-reports", label: "Patient Reports" },
    { to: "/request-patient", label: "Request Patient Info" },
    { to: "/requests", label: "Requests Made" },
    { to: "/question-builder", label: "Questionnaire Builder" },
  ];

  const groupedNav = {
    "Patient Management": [
      { to: "/register-patient", label: "Register Patient", color: "bg-blue-600" },
      { to: "/all-patients", label: "All Patients", color: "bg-indigo-600" },
      { to: "/flagged-patients", label: "Flagged Patients", color: "bg-red-500" },
      { to: "/dormant-patients", label: "Dormant Patients", color: "bg-yellow-500" },
      { to: "/patient-reports", label: "Patient Reports", color: "bg-green-600" },
    ],
    "Admin Tools": [
      { to: "/request-patient", label: "Request Patient Info", color: "bg-purple-500" },
      { to: "/requests", label: "Requests Made", color: "bg-pink-600" },
      { to: "/question-builder", label: "Questionnaire Builder", color: "bg-gray-700" },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Top Navbar */}
      <DoctorNavbar />

      {/* Inner header with user dropdown */}
      <header className="flex justify-between items-center p-4 bg-white shadow-sm">
        <h1 className="text-xl font-semibold text-blue-600">Doctor Dashboard</h1>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
          >
            <span className="text-sm font-medium">
              {currentUser?.displayName || currentUser?.email || "User"}
            </span>
            <ChevronDownIcon className="w-4 h-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded shadow-lg z-50">
              {navLinks.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 text-sm border-t"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="p-6 max-w-7xl mx-auto space-y-10">
        {Object.entries(groupedNav).map(([section, links]) => (
          <section key={section}>
            <h2 className="text-lg font-semibold mb-4">{section}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {links.map(btn => (
                <Link
                  key={btn.to}
                  to={btn.to}
                  className={`${btn.color} text-white p-5 rounded-lg text-center font-semibold text-sm hover:opacity-90 transition`}
                >
                  {btn.label}
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {["flagged", "booked", "resolved"].map(key => (
            <div key={key} className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-sm uppercase text-gray-500">{key}</p>
              <p className="text-4xl font-bold text-blue-700">{counts[key]}</p>
            </div>
          ))}
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">📊 Flagged Cases Over Time</h2>
          <Suspense fallback={<div className="h-48 flex justify-center items-center text-gray-500">Loading chart…</div>}>
            <LineChartStats data={trendData} loading={isLoading} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
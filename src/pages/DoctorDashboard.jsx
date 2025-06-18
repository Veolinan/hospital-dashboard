import React, { useState, useEffect, lazy, Suspense, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { signOut } from "firebase/auth";

const LineChartStats = lazy(() => import("../components/FlaggedLineChart"));

export default function DoctorDashboard() {
  const [counts, setCounts] = useState({ flagged: 0, booked: 0, resolved: 0 });
  const [trendData, setTrendData] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(collection(db, "flaggedCases"), where("assignedTo", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const tally = { flagged: 0, booked: 0, resolved: 0 };
      const dayCounts = {};

      snap.docs.forEach((d) => {
        const c = d.data();
        tally[c.status] += 1;
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
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { to: "/registerpatient", label: "Register Patient" },
    { to: "/flagged-patients", label: "Flagged Patients" },
    { to: "/patient-reports", label: "Patient Reports" },
    { to: "/dormant-patients", label: "Dormant Patients" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Top Navigation */}
      <header className="flex justify-between items-center p-4 bg-white shadow-md">
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
            <div className="absolute right-0 mt-2 w-56 bg-white rounded shadow z-50 overflow-hidden">
              {navLinks.map((item) => (
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

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navLinks.map((btn, index) => {
            const colors = ["bg-blue-500", "bg-red-500", "bg-green-500", "bg-yellow-500"];
            return (
              <Link
                key={btn.to}
                to={btn.to}
                className={`${colors[index]} text-white p-5 rounded-lg text-center text-sm font-semibold hover:opacity-90 transition`}
              >
                {btn.label}
              </Link>
            );
          })}
        </div>

        {/* Counters */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {["flagged", "booked", "resolved"].map((key) => (
            <div
              key={key}
              className="bg-white p-6 rounded-lg shadow text-center"
            >
              <p className="text-sm uppercase text-gray-500">{key}</p>
              <p className="text-4xl font-bold text-blue-700">{counts[key]}</p>
            </div>
          ))}
        </section>

        {/* Chart */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Flagged Cases Over Time</h2>
          <Suspense fallback={<div className="h-48 flex justify-center items-center text-gray-500">Loading chart...</div>}>
            <LineChartStats data={trendData} loading={isLoading} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
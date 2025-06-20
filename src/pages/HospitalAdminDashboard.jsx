import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";

import {
  UsersIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  DocumentChartBarIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

export default function HospitalAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    flagged: 0,
    dormant: 0,
  });
  const [hospitalName, setHospitalName] = useState("");
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    let unsubs = [];
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const fetchHospitalId = async () => {
      const userDoc = await getDoc(doc(db, "users", uid));
      const userData = userDoc.data();
      setAdminName(userData?.fullName || "Admin");

      const hid = userData?.hospitalId;
      if (!hid) return;

      const hospitalDoc = await getDoc(doc(db, "hospitals", hid));
      setHospitalName(hospitalDoc.data()?.name || "Hospital");

      const twelveDaysAgo = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000);

      const listeners = [
        onSnapshot(
          query(collection(db, "patients"), where("hospitalId", "==", hid)),
          snap => setStats(prev => ({ ...prev, patients: snap.size }))
        ),
        onSnapshot(
          query(
            collection(db, "users"),
            where("role", "==", "doctor"),
            where("hospitalId", "==", hid)
          ),
          snap => setStats(prev => ({ ...prev, doctors: snap.size }))
        ),
        onSnapshot(
          query(collection(db, "flaggedCases"), where("hospitalId", "==", hid)),
          snap => setStats(prev => ({ ...prev, flagged: snap.size }))
        ),
        onSnapshot(
          query(
            collection(db, "patients"),
            where("hospitalId", "==", hid),
            where("lastQuestionnaireAt", "<", twelveDaysAgo)
          ),
          snap => setStats(prev => ({ ...prev, dormant: snap.size }))
        ),
      ];

      unsubs = listeners;
    };

    fetchHospitalId();
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const navCards = [
    {
      to: "/admin/patients",
      label: "All Patients",
      icon: ClipboardDocumentListIcon,
      stat: stats.patients,
      color: "bg-green-600",
    },
    {
      to: "/admin/flagged",
      label: "Flagged Cases",
      icon: ExclamationCircleIcon,
      stat: stats.flagged,
      color: "bg-red-500",
    },
    {
      to: "/admin/dormant",
      label: "Dormant Patients",
      icon: CalendarIcon,
      stat: stats.dormant,
      color: "bg-yellow-500",
    },
    {
      to: "/admin/transfer-patient",
      label: "Transfer Patients",
      icon: ArrowPathIcon,
      stat: null,
      color: "bg-indigo-500",
    },
    {
      to: "/admin/staff",
      label: "Manage Staff",
      icon: UsersIcon,
      stat: stats.doctors,
      color: "bg-blue-600",
    },
    {
      to: "/admin/reports",
      label: "Patient Reports",
      icon: DocumentChartBarIcon,
      stat: null,
      color: "bg-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center p-4 bg-white shadow-md gap-3 md:gap-0">
        <div>
          <h1 className="text-xl font-bold text-blue-700">{hospitalName}</h1>
          <p className="text-sm text-gray-600">Logged in as: {adminName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/register-doctor"
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
          >
            <UserPlusIcon className="w-4 h-4" />
            Register Doctor
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-red-600 hover:text-red-800"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </header>

      {/* Overview Stats */}
      <section className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded shadow text-center">
          <p className="text-sm text-gray-500">Total Doctors</p>
          <p className="text-3xl font-bold">{stats.doctors}</p>
        </div>
        <div className="bg-white p-5 rounded shadow text-center">
          <p className="text-sm text-gray-500">Registered Patients</p>
          <p className="text-3xl font-bold">{stats.patients}</p>
        </div>
        <div className="bg-white p-5 rounded shadow text-center">
          <p className="text-sm text-gray-500">Flagged Cases</p>
          <p className="text-3xl font-bold">{stats.flagged}</p>
        </div>
        <div className="bg-white p-5 rounded shadow text-center">
          <p className="text-sm text-gray-500">Dormant (12+ days)</p>
          <p className="text-3xl font-bold">{stats.dormant}</p>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {navCards.map(card => (
          <Link
            key={card.to}
            to={card.to}
            className={`${card.color} text-white p-5 rounded-lg hover:opacity-90 transition shadow-lg flex flex-col justify-between`}
          >
            <div className="flex justify-between items-start">
              <card.icon className="h-6 w-6 opacity-80" />
              {card.stat !== null && (
                <span className="text-sm bg-white text-black px-2 py-1 rounded bg-opacity-20">
                  {card.stat}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold">{card.label}</h2>
          </Link>
        ))}
      </section>

      {/* Nested views */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}

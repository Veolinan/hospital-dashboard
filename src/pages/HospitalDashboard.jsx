// src/pages/HospitalDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function HospitalDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hospital Dashboard</h1>
      <div className="space-y-3">
        <Link to="/registerdoctor" className="block bg-blue-500 text-white p-3 rounded">Register Doctor</Link>
        <Link to="/staff" className="block bg-purple-500 text-white p-3 rounded">Manage Staff</Link>
        <Link to="/reports" className="block bg-green-500 text-white p-3 rounded">Hospital Reports</Link>
        <Link to="/patients" className="block bg-orange-500 text-white p-3 rounded">Patient History</Link>
      </div>
    </div>
  );
}

// src/pages/AdminDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard (Multi-Hospital)</h1>
      <div className="space-y-3">
        <Link to="/registerhospital" className="block bg-blue-600 text-white p-3 rounded">Register Hospital</Link>
        <Link to="/managehospitals" className="block bg-green-600 text-white p-3 rounded">Manage Hospitals</Link>
        <Link to="/adminreports" className="block bg-yellow-500 text-white p-3 rounded">Aggregate Reports</Link>
        <Link to="/staff" className="block bg-purple-600 text-white p-3 rounded">Manage Staff</Link>
      </div>
    </div>
  );
}

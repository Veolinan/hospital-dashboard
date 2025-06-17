// src/pages/SuperAdminDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function SuperAdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Super Admin Dashboard</h1>
      <div className="space-y-3">
        <Link to="/registerhospital" className="block bg-blue-700 text-white p-3 rounded">Register Hospital</Link>
        <Link to="/adminregister" className="block bg-indigo-700 text-white p-3 rounded">Register Admins</Link>
        <Link to="/manageallusers" className="block bg-purple-700 text-white p-3 rounded">Manage All Users</Link>
        <Link to="/globalreports" className="block bg-red-700 text-white p-3 rounded">System-wide Reports</Link>
        <Link to="/auditlogs" className="block bg-gray-800 text-white p-3 rounded">Audit Logs</Link>
      </div>
    </div>
  );
}

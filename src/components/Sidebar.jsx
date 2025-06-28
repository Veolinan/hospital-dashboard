import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiMenu, FiLogOut, FiUsers, FiActivity,
  FiClipboard, FiHome, FiUserPlus, FiTool, FiSettings
} from "react-icons/fi";

const Sidebar = ({ role }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setHidden(scrollY > lastScrollY && scrollY > 50);
      lastScrollY = scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!role || role === "patient") return null;

  const toggleSidebar = () => setCollapsed(prev => !prev);
  const logout = () => navigate("/");

  const dashboardPath = {
    doctor: "/doctor-dashboard",
    hospitalAdmin: "/admin",
    admin: "/admin-dashboard",
    superAdmin: "/super-admin-dashboard",
  };

  const roleIcons = {
    doctor: "👨‍⚕️",
    hospitalAdmin: "🏥",
    admin: "🛡️",
    superAdmin: "👑",
  };

  const roleLinks = {
    doctor: [
      { to: dashboardPath.doctor, label: "Dashboard", icon: <FiHome /> },
      { to: "/all-patients", label: "All Patients", icon: <FiUsers /> },
      { to: "/flagged-patients", label: "Flagged", icon: <FiActivity /> },
      { to: "/dormant-patients", label: "Dormant", icon: <FiClipboard /> },
      { to: "/patient-reports", label: "Reports", icon: <FiClipboard /> },
    ],
    hospitalAdmin: [
      { to: dashboardPath.hospitalAdmin, label: "Dashboard", icon: <FiHome /> },
      { to: "/admin/flagged", label: "Flagged", icon: <FiActivity /> },
      { to: "/admin/dormant", label: "Dormant", icon: <FiClipboard /> },
      { to: "/admin/reports", label: "Reports", icon: <FiClipboard /> },
      { to: "/admin/staff", label: "Manage Staff", icon: <FiTool /> },
      { to: "/admin/transfer-patient", label: "Transfer", icon: <FiSettings /> },
    ],
    admin: [
      { to: dashboardPath.admin, label: "Dashboard", icon: <FiHome /> },
      { to: "/register-doctor", label: "Register Doctor", icon: <FiUserPlus /> },
      { to: "/register-hospital", label: "Register Hospital", icon: <FiUserPlus /> },
    ],
    superAdmin: [
      { to: dashboardPath.superAdmin, label: "Dashboard", icon: <FiHome /> },
      { to: "/admin-register", label: "Register Admin", icon: <FiUserPlus /> },
    ],
  };

  const links = roleLinks[role] || [];

  return (
    <>
      {/* Hamburger Icon */}
      {!collapsed && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-[100] p-2 bg-white rounded-full shadow-md hover:shadow-lg transition"
        >
          <FiMenu className="text-black text-2xl" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen z-50 w-64
        bg-white/10 backdrop-blur-md shadow-xl border-r border-white/20
        transition-transform duration-300 ease-in-out
        ${collapsed ? "translate-x-0" : "-translate-x-full"}
        ${hidden ? "-translate-y-full" : ""}
        flex flex-col justify-between`}
      >
        {/* Role Header */}
        <div className="p-4 bg-white/20 border-b border-white/20 backdrop-blur-md flex flex-col items-center">
          <div className="text-4xl">{roleIcons[role]}</div>
          <p className="text-sm mt-1 font-medium text-white capitalize">{role}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setCollapsed(false)}
              className={`flex items-center gap-3 px-4 py-2 text-white hover:bg-white/20 rounded-md transition ${
                location.pathname === link.to ? "bg-white/20" : ""
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/20 bg-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-red-400 hover:text-red-600 px-4 py-2 hover:bg-red-100/20 rounded-md transition"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

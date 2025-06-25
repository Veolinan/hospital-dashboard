// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const navigate = useNavigate();

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = showRoleModal ? "hidden" : "auto";
  }, [showRoleModal]);

  return (
    <div className={`relative min-h-screen bg-gradient-to-br from-blue-50 to-white text-gray-800 ${showRoleModal ? 'backdrop-blur-sm' : ''}`}>
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">HealthFlag</h1>
          <button
            onClick={() => setShowRoleModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>
      </header>

       {/* Hero Section */}
      <section className="py-16 text-center px-6">
        <h2 className="text-4xl font-bold mb-4 text-blue-700">
          Empowering Early Detection & Maternal Triage
        </h2>
        <p className="max-w-3xl mx-auto text-lg text-gray-600">
          HealthFlag is a digital triage and alert system developed during the{" "}
          <span className="font-semibold">Kakuma Innovation Mission in May 2025</span>,
          a collaboration between the{" "}
          <span className="font-semibold">Kenya Red Cross Society</span> and the{" "}
          <span className="font-semibold">University of Texas</span>. It aims to streamline
          healthcare delivery in resource-constrained environments like Kakuma and Kalobeyei,
          where doctor-to-patient ratios are high, and expectant mothers often lack access
          to smartphones, transport, or emergency care.
        </p>
      </section>
 {/* How It Works */}
      <section className="bg-blue-50 py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-blue-700">How It Works</h3>
            <p className="text-gray-700 mb-4">
              HealthFlag offers rapid digital triage through a simple questionnaire filled out by healthcare workers or patients. The system evaluates responses using medical flag logic to assess <strong>symptom severity</strong>, <strong>maternal risk</strong>, and <strong>age vulnerability</strong>. 
              Key benefits include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Quick identification of high-risk expectant mothers for urgent follow-up.</li>
              <li>Flags conditions before they escalate, helping clinicians intervene early.</li>
              <li>Minimizes unnecessary hospital visits, reducing congestion and wait times.</li>
              <li>Connects patients with medical officers even when ambulance services or digital devices are unavailable.</li>
              <li>Supports data tracking and medical record storage in secure, centralized dashboards.</li>
            </ul>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1599045118108-bf9954418b76?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGhvc3BpdGFsfGVufDB8fDB8fHww"
              alt="Medical Triage"
              className="rounded shadow-md"
            />
          </div>
        </div>
      </section>


      {/* Conditions Covered — Retain as in your version */}

      {/* Call to Action */}
      <section className="py-20 text-center bg-blue-600 text-white px-6">
        <h3 className="text-3xl font-bold mb-4">Ready to begin?</h3>
        <p className="mb-6 text-lg">
          Login to access the HealthFlag dashboard and begin supporting early maternal triage in your clinic or community.
        </p>
        <button
          onClick={() => setShowRoleModal(true)}
          className="inline-block bg-white text-blue-600 px-6 py-3 rounded font-semibold shadow hover:bg-gray-100 transition"
        >
          Login
        </button>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-500 bg-white border-t">
        © {new Date().getFullYear()} HealthFlag • Built with ❤️ in IOMe 001 Mombasa • Powered by KRCS & UT
      </footer>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Overlay with blur */}
          <div
            className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowRoleModal(false)}
          />
          
          {/* Modal content with animation */}
          <div className="relative bg-white rounded-lg p-6 shadow-xl space-y-4 w-80 animate-fadeIn z-10">
            <h3 className="text-xl font-semibold text-blue-700 text-center">Login As</h3>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Admin / Hospital
            </button>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            >
              Doctor
            </button>
            <button
              onClick={() => navigate("/login-patient")}
              className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
            >
              Patient
            </button>
            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full border border-gray-300 py-2 rounded text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

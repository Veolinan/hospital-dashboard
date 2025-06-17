// src/pages/RegisterHospital.jsx
import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const RegisterHospital = () => {
  const [form, setForm] = useState({
    name: "",
    county: "",
    subCounty: "",
    locality: "",
    phone: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    try {
      await addDoc(collection(db, "hospitals"), {
        ...form,
        createdAt: serverTimestamp(),
      });
      setSuccess("✅ Hospital registered successfully!");
      setForm({
        name: "",
        county: "",
        subCounty: "",
        locality: "",
        phone: "",
        email: "",
      });
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-100 to-blue-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white p-10 rounded-2xl shadow-2xl border border-blue-100">
        <h2 className="text-3xl font-bold text-blue-700 text-center mb-8">
          🏥 Register Hospital
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {[
            { name: "name", label: "Hospital Name" },
            { name: "county", label: "County" },
            { name: "subCounty", label: "Sub-county" },
            { name: "locality", label: "Locality" },
            { name: "phone", label: "Phone Number" },
            { name: "email", label: "Email Address" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label
                htmlFor={name}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {label}
              </label>
              <input
                type={name === "email" ? "email" : "text"}
                name={name}
                id={name}
                value={form[name]}
                onChange={handleChange}
                required={["name", "county", "subCounty", "locality"].includes(name)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            {loading ? "Registering..." : "Register Hospital"}
          </button>

          {success && (
            <p className="text-green-600 text-center text-sm mt-3 font-medium">
              {success}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegisterHospital;

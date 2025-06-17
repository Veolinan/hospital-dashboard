import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const RegisterPatient = () => {
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    dob: "",
    phone: "",
    email: "",
    village: "",
    locality: "",
    hospitalId: "",
  });

  const [hospitals, setHospitals] = useState([]);
  const [registeringDoctorId, setRegisteringDoctorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Fetch hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      const snapshot = await getDocs(collection(db, "hospitals"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setHospitals(data);
    };
    fetchHospitals();
  }, []);

  // Get current logged-in doctor UID
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) setRegisteringDoctorId(user.uid);
    });
  }, []);

  // Handle form input
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Generate random 4-digit code
  const generateCode = () => Math.floor(1000 + Math.random() * 9000);

  // Submit patient
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    const patientCode = generateCode();

    try {
      await addDoc(collection(db, "patients"), {
        ...form,
        patientCode,
        registeringDoctor: registeringDoctorId,
        createdAt: serverTimestamp(),
      });
      setSuccess("✅ Patient registered successfully!");
      setForm({
        fullName: "",
        gender: "",
        dob: "",
        phone: "",
        email: "",
        village: "",
        locality: "",
        hospitalId: "",
      });
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-100 to-green-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white p-10 rounded-2xl shadow-2xl border border-green-100">
        <h2 className="text-3xl font-bold text-green-700 text-center mb-8">
          🧑‍🤝‍🧑 Register Patient
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { name: "fullName", label: "Full Name" },
            { name: "dob", label: "Date of Birth", type: "date" },
            { name: "phone", label: "Phone Number" },
            { name: "email", label: "Email (optional)", type: "email" },
            { name: "village", label: "Village" },
            { name: "locality", label: "Locality" },
          ].map(({ name, label, type = "text" }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Hospital
            </label>
            <select
              name="hospitalId"
              value={form.hospitalId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
            >
              <option value="">Select hospital</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition"
          >
            {loading ? "Registering..." : "Register Patient"}
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

export default RegisterPatient;

import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function RegisterDoctor() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    specialization: "",
    workId: "",
    licenseNumber: "",
    password: "",
    hospitalId: "",
    role: "doctor",
  });

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchHospitals() {
      const snap = await getDocs(collection(db, "hospitals"));
      setHospitals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    fetchHospitals();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setToast("");

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const uid = userCred.user.uid;

      const { password, ...doctorData } = form;
      await setDoc(doc(db, "users", uid), {
        uid,
        ...doctorData,
        createdAt: serverTimestamp(),
      });

      setToast("✅ Doctor registered successfully!");
      setForm({
        fullName: "",
        email: "",
        phone: "",
        gender: "",
        specialization: "",
        workId: "",
        licenseNumber: "",
        password: "",
        hospitalId: "",
        role: "doctor",
      });

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      setError("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-100 to-blue-200 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-lg max-w-lg w-full space-y-4"
      >
        <h2 className="text-3xl font-bold text-blue-700 text-center">
          🧑‍⚕️ Register Doctor
        </h2>

        {error && <p className="text-red-600 text-center">{error}</p>}
        {toast && <p className="text-green-600 text-center">{toast}</p>}

        {[
          ["fullName", "Full Name"],
          ["email", "Email Address"],
          ["phone", "Phone Number"],
          ["specialization", "Specialization"],
          ["workId", "Work ID"],
          ["licenseNumber", "License Number"],
          ["password", "Password"],
        ].map(([key, label]) => (
          <div key={key}>
            <label className="block text-gray-700 mb-1">{label}</label>
            <input
              name={key}
              type={key === "password" ? "password" : "text"}
              required
              value={form[key]}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ))}

        <div>
          <label className="block text-gray-700 mb-1">Gender</label>
          <select
            name="gender"
            required
            value={form.gender}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Choose gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Assign to Hospital</label>
          <select
            name="hospitalId"
            required
            value={form.hospitalId}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Hospital</option>
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
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              Registering...
            </>
          ) : (
            "Register Doctor"
          )}
        </button>
      </form>
    </div>
  );
}

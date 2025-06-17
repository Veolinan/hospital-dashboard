import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

const RegisterDoctor = () => {
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
    role: "Doctor",
  });

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Fetch hospital list
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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    try {
      // 1. Create Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      // 2. Save to Firestore
      await addDoc(collection(db, "doctors"), {
        uid: userCredential.user.uid,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        specialization: form.specialization,
        workId: form.workId,
        licenseNumber: form.licenseNumber,
        hospitalId: form.hospitalId,
        role: form.role,
        createdAt: serverTimestamp(),
      });

      setSuccess("✅ Doctor registered successfully!");
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
        role: "Doctor",
      });
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-100 to-blue-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white p-10 rounded-2xl shadow-2xl border border-blue-100">
        <h2 className="text-3xl font-bold text-blue-700 text-center mb-8">
          🧑‍⚕️ Register Doctor
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* TEXT INPUTS */}
          {[
            { name: "fullName", label: "Full Name" },
            { name: "email", label: "Email Address", type: "email" },
            { name: "phone", label: "Phone Number" },
            { name: "specialization", label: "Specialization" },
            { name: "workId", label: "Work ID" },
            { name: "licenseNumber", label: "License Number" },
            { name: "password", label: "Password", type: "password" },
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
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>
          ))}

          {/* GENDER SELECT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* HOSPITAL SELECT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Hospital
            </label>
            <select
              name="hospitalId"
              value={form.hospitalId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">Select hospital</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* ROLE (HIDDEN or preset) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              name="role"
              value={form.role}
              disabled
              className="w-full px-4 py-2 border border-gray-200 bg-gray-100 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            {loading ? "Registering..." : "Register Doctor"}
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

export default RegisterDoctor;

import React, { useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const LoginPatient = () => {
  const [code, setCode] = useState("");
  const [patientData, setPatientData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPatientData(null);

    try {
      const querySnapshot = await getDocs(collection(db, "patients"));
      let matchedPatient = null;

      for (let docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        if (String(data.patientCode) === code) {
          matchedPatient = { id: docSnap.id, ...data };
          break;
        }
      }

      if (matchedPatient) {
        // Fetch hospital name
        const hospitalDoc = await getDoc(doc(db, "hospitals", matchedPatient.hospitalId));
        const hospitalName = hospitalDoc.exists() ? hospitalDoc.data().name : "Unknown";

        setPatientData({ ...matchedPatient, hospitalName });
      } else {
        setError("No patient found with that code.");
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    // You can pass patient data via state or context or global state
    navigate("/questionnaire", { state: { patient: patientData } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-100 to-emerald-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-emerald-200">
        <h2 className="text-2xl font-bold text-emerald-700 text-center mb-6">
          Patient Login
        </h2>

        {!patientData ? (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter your 4-digit patient code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none text-center text-lg tracking-widest"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition"
            >
              {loading ? "Searching..." : "Login"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-700">
              <strong>Name:</strong> {patientData.fullName}
            </p>
            <p className="text-gray-700">
              <strong>Hospital:</strong> {patientData.hospitalName}
            </p>
            <p className="text-gray-700">
              <strong>Village:</strong> {patientData.village}
            </p>
            <p className="text-gray-700">
              <strong>Locality:</strong> {patientData.locality}
            </p>

            <div className="flex gap-4 mt-4">
              <button
                onClick={handleConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Yes, it's me
              </button>
              <button
                onClick={() => {
                  setPatientData(null);
                  setCode("");
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 rounded-lg"
              >
                No, go back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPatient;

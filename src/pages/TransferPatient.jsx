// src/pages/TransferPatient.jsx
import React, { useEffect, useState } from "react";
import { db, auth, functions } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import toast from "react-hot-toast";

export default function TransferPatient() {
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [hospitalMap, setHospitalMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const reqSnap = await getDocs(collection(db, "recordRequests"));
      const hosSnap = await getDocs(collection(db, "hospitals"));

      const hosData = {};
      hosSnap.docs.forEach(doc => {
        hosData[doc.id] = doc.data().name;
      });

      setHospitalMap(hosData);
      setRequests(reqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setHospitals(hosSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    };

    fetchData();
  }, []);

  const handleAction = async (req, action, targetHospitalId = null) => {
    const reqRef = doc(db, "recordRequests", req.id);
    setLoading(true);

    try {
      if (action === "approve") {
        await updateDoc(reqRef, {
          status: "approved",
          statusUpdatedAt: serverTimestamp(),
        });
        toast.success("Request approved ✅");
      }

      if (action === "decline") {
        await updateDoc(reqRef, {
          status: "declined",
          statusUpdatedAt: serverTimestamp(),
        });
        toast.error("Request declined");
      }

      if (action === "transfer" && targetHospitalId) {
        const patientRef = doc(db, "patients", req.patientId);
        const patientSnap = await getDoc(patientRef);

        if (!patientSnap.exists()) {
          throw new Error("Patient not found");
        }

        const patientData = patientSnap.data();
        const newPatientId = `${req.patientId}_${targetHospitalId}`;

        await setDoc(doc(db, "patients", newPatientId), {
          ...patientData,
          hospitalId: targetHospitalId,
          transferredFrom: patientData.hospitalId,
          transferCreatedAt: serverTimestamp(),
        });

        await updateDoc(reqRef, {
          status: "transferred",
          transferredBy: auth.currentUser.uid,
          toHospitalId: targetHospitalId,
          statusUpdatedAt: serverTimestamp(),
        });

        const sendTransferEmail = httpsCallable(functions, "sendTransferNotification");
        await sendTransferEmail({ requestId: req.id });

        toast.success("Patient transferred and emails sent ✅");
      }

      // Refresh requests
      const reqSnap = await getDocs(collection(db, "recordRequests"));
      setRequests(reqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
      toast.error("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => req.status === filter);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">🔁 Patient Transfer Requests</h2>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-6 border px-3 py-2 rounded"
      >
        {["pending", "approved", "transferred", "declined"].map((status) => (
          <option key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </option>
        ))}
      </select>

      {filteredRequests.length === 0 ? (
        <p>No requests to show.</p>
      ) : (
        filteredRequests.map((req) => (
          <div key={req.id} className="mb-4 p-4 border rounded">
            <p><strong>Patient:</strong> {req.patientName || req.patientId}</p>
            <p><strong>From:</strong> {hospitalMap[req.fromHospitalId] || req.fromHospitalId}</p>
            <p><strong>Requested by:</strong> {req.requestingDoctorEmail}</p>
            <p><strong>Status:</strong> {req.status}</p>

            {req.status === "pending" && (
              <div className="mt-2 flex gap-2">
                <button
                  disabled={loading}
                  onClick={() => handleAction(req, "approve")}
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Approve
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleAction(req, "decline")}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Decline
                </button>
              </div>
            )}

            {req.status === "approved" && (
              <div className="mt-3 flex items-center gap-2">
                <select
                  defaultValue=""
                  onChange={(e) => req.toHospitalId = e.target.value}
                  className="border px-2 py-1 rounded"
                >
                  <option value="">Select Hospital</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={loading || !req.toHospitalId}
                  onClick={() => handleAction(req, "transfer", req.toHospitalId)}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Transfer
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

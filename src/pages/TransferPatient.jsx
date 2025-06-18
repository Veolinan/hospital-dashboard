import React, { useState, useEffect } from "react";
import { db, auth, functions } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export default function TransferPatient() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);

  // Fetch requests and hospitals
  useEffect(() => {
    const fetchData = async () => {
      const reqSnap = await getDocs(collection(db, "recordRequests"));
      const allRequests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(allRequests);
      setFilteredRequests(allRequests.filter(r => r.status === statusFilter));

      const hospSnap = await getDocs(collection(db, "hospitals"));
      setHospitals(hospSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
    };

    fetchData();
  }, [statusFilter]);

  const handleAction = async (req, action, targetHospitalId) => {
    setLoading(true);

    try {
      const reqDoc = doc(db, "recordRequests", req.id);

      if (action === "approve") {
        await updateDoc(reqDoc, { status: "approved", statusUpdatedAt: serverTimestamp() });
      }

      if (action === "decline") {
        await updateDoc(reqDoc, { status: "declined", statusUpdatedAt: serverTimestamp() });
      }

      if (action === "transfer" && targetHospitalId) {
        // Fetch patient
        const patientDoc = await getDocs(doc(db, "patients", req.patientId));
        const patientData = patientDoc.data();

        // Create patient copy
        await setDoc(
          doc(db, "patients", patientDoc.id + "_" + targetHospitalId),
          { ...patientData, hospitalId: targetHospitalId, createdAt: serverTimestamp() }
        );

        // Update original
        await updateDoc(reqDoc, {
          status: "transferred",
          statusUpdatedAt: serverTimestamp(),
          transferredBy: auth.currentUser.uid,
          toHospitalId: targetHospitalId,
        });

        // Notify via cloud function
        const notify = httpsCallable(functions, "sendTransferNotification");
        await notify({ requestId: req.id });
      }

      // Refresh requests
      const snapshot = await getDocs(collection(db, "recordRequests"));
      const updated = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(updated);
      setFilteredRequests(updated.filter(r => r.status === statusFilter));
    } catch (err) {
      console.error(err);
      alert("Action failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">🩺 Manage Transfer Requests</h2>

      <div className="flex items-center gap-4 mb-6">
        <label>Status Filter:</label>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          {["pending", "approved", "transferred", "declined"].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <p>No requests with status <strong>{statusFilter}</strong>.</p>
      ) : (
        filteredRequests.map(req => (
          <div key={req.id} className="mb-4 p-4 border rounded">
            <p><strong>Patient ID:</strong> {req.patientId}</p>
            <p><strong>From Hospital ID:</strong> {req.fromHospitalId}</p>
            <p><strong>Requested by:</strong> {req.requestingDoctorId}</p>
            <p><strong>Status:</strong> {req.status}</p>

            {req.status === "pending" && (
              <div className="mt-3 space-x-2">
                <button
                  onClick={() => handleAction(req, "approve")}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(req, "decline")}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Decline
                </button>
              </div>
            )}

            {req.status === "approved" && (
              <div className="mt-3 flex items-center gap-3">
                <select
                  defaultValue=""
                  onChange={e => req.selected = e.target.value}
                  className="border px-3 py-2 rounded"
                >
                  <option value="">Select new hospital...</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleAction(req, "transfer", req.selected)}
                  disabled={loading || !req.selected}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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

// src/pages/Requests.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, "recordRequests"), where("requestingDoctorId", "==", user.uid));
      const snap = await getDocs(q);

      const data = await Promise.all(snap.docs.map(async d => {
        const r = d.data();
        const patSnap = await getDoc(doc(db, "patients", r.patientId));
        const fromDoc = await getDoc(doc(db, "hospitals", r.fromHospitalId));
        const toDoc = await getDoc(doc(db, "hospitals", r.toHospitalId));

        return {
          id: d.id,
          ...r,
          patientName: patSnap.data()?.fullName,
          fromHospital: fromDoc.data()?.name,
          toHospital: toDoc.data()?.name,
          requestedAt: r.requestedAt?.toDate().toLocaleString(),
          statusUpdatedAt: r.statusUpdatedAt?.toDate().toLocaleString(),
        };
      }));

      setRequests(data);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🩺 My Data Requests</h2>
      {requests.length === 0 ? (
        <p>No requests yet.</p>
      ) : (
        <div className="bg-white shadow rounded overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Patient</th>
                <th className="p-3">From</th>
                <th className="p-3">To</th>
                <th className="p-3">Status</th>
                <th className="p-3">Requested</th>
                <th className="p-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{r.patientName}</td>
                  <td className="p-3">{r.fromHospital}</td>
                  <td className="p-3">{r.toHospital}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{r.requestedAt}</td>
                  <td className="p-3">{r.statusUpdatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// src/pages/Requests.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(
          collection(db, "transferRequests"),
          where("fromDoctorId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);

        const enrichedRequests = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();

            // Get patient info
            const patientRef = doc(db, "patients", data.patientId);
            const patientSnap = await getDoc(patientRef);
            const patient = patientSnap.exists() ? patientSnap.data() : {};

            // Get target hospital name
            const hospitalRef = doc(db, "hospitals", data.toHospitalId);
            const hospitalSnap = await getDoc(hospitalRef);
            const hospital = hospitalSnap.exists() ? hospitalSnap.data() : {};

            return {
              id: docSnap.id,
              ...data,
              patientName: patient.name || "Unknown",
              patientPhone: patient.phone || "N/A",
              hospitalName: hospital.name || "Unknown",
              createdAt: data.createdAt?.toDate().toLocaleString() || "Unknown",
              statusUpdatedAt: data.statusUpdatedAt?.toDate().toLocaleString() || "N/A",
            };
          })
        );

        setRequests(enrichedRequests);
      } catch (error) {
        console.error("Error fetching transfer requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading requests...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🧾 My Transfer Requests</h2>
      {requests.length === 0 ? (
        <p>No transfer requests made yet.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Patient</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Target Hospital</th>
                <th className="p-3">Status</th>
                <th className="p-3">Requested At</th>
                <th className="p-3">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{r.patientName}</td>
                  <td className="p-3">{r.patientPhone}</td>
                  <td className="p-3">{r.hospitalName}</td>
                  <td className="p-3 capitalize font-medium">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        r.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : r.status === "transferred"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">{r.createdAt}</td>
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
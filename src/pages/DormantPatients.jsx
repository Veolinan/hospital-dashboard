// src/pages/DormantPatients.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";

export default function DormantPatients() {
  const [dormant, setDormant] = useState([]);

  useEffect(() => {
    (async () => {
      const qSnap = await getDocs(collection(db, "patients"));
      const responsesSnap = await getDocs(collection(db, "questionnaire_responses"));
      const lastByPatient = {};
      responsesSnap.forEach(d => {
        const p = d.data().patientId;
        const dt = d.data().submittedAt.toDate();
        if (!lastByPatient[p] || dt > lastByPatient[p]) lastByPatient[p] = dt;
      });
      const cutoff = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000);
      const idle = [];
      qSnap.forEach(d => {
        const data = d.data();
        const last = lastByPatient[d.id];
        if (!last || last < cutoff) {
          idle.push({ id: d.id, ...data, lastActive: last });
        }
      });
      setDormant(idle);
    })();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Dormant Patients (12+ days)</h2>
      <table className="w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            {["Name","Phone","Last Active","Actions"].map(h => (
              <th key={h} className="p-2 border">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dormant.map(p => (
            <tr key={p.id} className="border-t hover:bg-gray-50">
              <td className="p-2 border">{p.fullName}</td>
              <td className="p-2 border">{p.phone}</td>
              <td className="p-2 border">
                {(p.lastActive && p.lastActive.toLocaleDateString()) || "Never"}
              </td>
              <td className="p-2 border">
                <button onClick={() => alert(`Remind ${p.phone}`)} className="px-2 bg-blue-600 text-white rounded">
                  Send Reminder
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// src/pages/PatientReports.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export default function PatientReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "questionnaire_responses"), orderBy("submittedAt", "desc"));
    return onSnapshot(q, snap => setReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">All Patient Reports</h2>
      <table className="w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            {["Patient","Date","Flagged","Actions"].map(h => (
              <th key={h} className="p-2 border">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              <td className="p-2 border">{r.patientName}</td>
              <td className="p-2 border">{r.submittedAt?.toDate().toLocaleDateString()}</td>
              <td className="p-2 border">
                {r.flagged ? (
                  <span className="bg-red-200 text-red-800 px-2 rounded">Yes</span>
                ) : (
                  <span className="bg-green-200 text-green-800 px-2 rounded">No</span>
                )}
              </td>
              <td className="p-2 border">
                <button onClick={() => alert(JSON.stringify(r.responses, null, 2))} className="px-2 bg-blue-500 rounded text-white">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

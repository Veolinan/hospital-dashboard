// src/pages/FlaggedPatients.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

export default function FlaggedPatients() {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "flaggedCases"), where("status", "in", ["flagged", "booked"])),
      (snap) => setCases(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    await updateDoc(doc(db, "flaggedCases", id), {
      status: newStatus,
      bookedAt: newStatus === "booked" ? serverTimestamp() : undefined,
      resolvedAt: newStatus === "resolved" ? serverTimestamp() : undefined,
    });
  };

  const addNote = async (id) => {
    const note = prompt("Enter note:");
    if (!note) return;
    await updateDoc(doc(db, "flaggedCases", id), {
      notes: arrayUnion({
        text: note,
        by: auth.currentUser.uid,
        at: serverTimestamp(),
      }),
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-xl mb-4">Flagged Patients</h2>
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-100">
          <tr>
            {["Name","Flagged For","Flagged At","Status","Actions","Notes"].map(h => (
              <th key={h} className="p-2 border">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map(c => (
            <tr key={c.id} className="border-t hover:bg-gray-50">
              <td className="p-2 border">{c.patientName}</td>
              <td className="p-2 border">{c.flagReason}</td>
              <td className="p-2 border">{c.flaggedAt.toDate().toLocaleString()}</td>
              <td className="p-2 border">
                <span className={`px-2 py-1 rounded ${
                  c.status === "flagged" ? "bg-red-200" :
                  c.status === "booked" ? "bg-yellow-200" : "bg-green-200"}`}>
                  {c.status}
                </span>
              </td>
              <td className="p-2 border space-x-2">
                {c.status === "flagged" && (
                  <button onClick={() => handleStatusChange(c.id, "booked")} className="bg-yellow-500 text-white px-2 rounded">
                    Mark Booked
                  </button>
                )}
                {c.status !== "resolved" && (
                  <button onClick={() => handleStatusChange(c.id, "resolved")} className="bg-green-600 text-white px-2 rounded">
                    Resolve
                  </button>
                )}
                <button onClick={() => addNote(c.id)} className="bg-blue-500 text-white px-2 rounded">Add Note</button>
              </td>
              <td className="p-2 border">
                {c.notes?.map((n, i) => (
                  <div key={i} className="mb-1 text-sm">
                    • {n.text} <em>by {n.by}</em>
                  </div>
                )) || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

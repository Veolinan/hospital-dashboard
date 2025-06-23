// src/pages/FlaggedPatients.jsx
import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function FlaggedPatients() {
  const [cases, setCases] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'responses'), where('flags', '!=', []));
    const unsub = onSnapshot(q, snap => {
      setCases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-6">
      <h2 className="mb-4 text-xl font-bold">🚩 Flagged Patients</h2>
      <table className="w-full border bg-white">
        <thead className="bg-gray-100"><tr>
          <th className="p-2 border">Name</th>
          <th className="p-2 border">Symptoms</th>
          <th className="p-2 border">Condition</th>
          <th className="p-2 border">Date</th>
        </tr></thead>
        <tbody>
          {cases.map(c =>
            <tr key={c.id} className="border-t">
              <td className="p-2 border">{c.patientName}</td>
              <td className="p-2 border">{c.flags?.join(', ')}</td>
              <td className="p-2 border">{c.suggestedCondition}</td>
              <td className="p-2 border">{c.submittedAt?.toDate().toLocaleString()}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

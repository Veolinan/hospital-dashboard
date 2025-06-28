import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function FlaggedPatients() {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'questionnaire_responses'), snap => {
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const dangerOrAlertCases = all.filter(c =>
        c.riskClassification === 'Danger Zone' || c.riskClassification === 'Alert Zone'
      );
      setCases(dangerOrAlertCases);
    });
    return () => unsub();
  }, []);

  const getRowColor = (risk) => {
    if (risk === 'Danger Zone') return 'bg-red-50 text-red-700';
    if (risk === 'Alert Zone') return 'bg-yellow-50 text-yellow-800';
    return '';
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h2 className="mb-4 text-2xl font-bold text-red-600">🚩 Flagged Patients (Danger + Alert Zones)</h2>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border text-left">Name</th>
            <th className="p-2 border text-left">Risk</th>
            <th className="p-2 border text-left">Symptoms</th>
            <th className="p-2 border text-left">Condition</th>
            <th className="p-2 border text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {cases.length > 0 ? (
            cases.map(c => (
              <tr key={c.id} className={`border-t ${getRowColor(c.riskClassification)}`}>
                <td className="p-2 border">{c.patientName}</td>
                <td className="p-2 border font-semibold">{c.riskClassification}</td>
                <td className="p-2 border">
                  {Array.isArray(c.flags)
                    ? c.flags.map(f => f.label || f).join(', ')
                    : '-'}
                </td>
                <td className="p-2 border">
                  {c.suggestedCondition || (c.flags?.slice(-1)[0]?.label) || '-'}
                </td>
                <td className="p-2 border">
                  {c.submittedAt?.toDate().toLocaleString() || '-'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-500">
                No Danger or Alert zone cases found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

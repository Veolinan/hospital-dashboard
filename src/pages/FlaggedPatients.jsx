// src/pages/FlaggedPatients.jsx
import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function FlaggedPatients() {
  const [cases, setCases] = useState([]);
  const [patientsMap, setPatientsMap] = useState({});
  const [doctorsMap, setDoctorsMap] = useState({});
  const STATUS_OPTIONS = ['submitted', 'under review', 'booked', 'reviewed', 'resolved'];

  // Load patients
  useEffect(() => {
    getDocs(collection(db, 'patients')).then(snap => {
      const map = {};
      snap.docs.forEach(d => (map[d.id] = d.data()));
      setPatientsMap(map);
    });
  }, []);

  // Load doctors
  useEffect(() => {
    getDocs(collection(db, 'doctors')).then(snap => {
      const map = {};
      snap.docs.forEach(d => (map[d.id] = d.data().fullName));
      setDoctorsMap(map);
    });
  }, []);

  // Load flagged cases
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'questionnaire_responses'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const flagged = all.filter(c =>
        c.riskClassification === 'Danger Zone' || c.riskClassification === 'Alert Zone'
      );
      setCases(flagged);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (id, newStatus) => {
    await updateDoc(doc(db, 'questionnaire_responses', id), {
      status: newStatus,
      reviewedBy: {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || auth.currentUser.email
      },
      updatedAt: serverTimestamp()
    });
  };

  const updateNotes = async (id, notes) => {
    await updateDoc(doc(db, 'questionnaire_responses', id), {
      doctorNotes: notes,
      updatedAt: serverTimestamp()
    });
  };

  const getRowColor = (risk) => {
    switch (risk) {
      case 'Danger Zone': return 'bg-red-50';
      case 'Alert Zone': return 'bg-yellow-50';
      default: return '';
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h2 className="mb-4 text-2xl font-bold text-red-600">
        🚩 Flagged Patients (Danger & Alert Zones)
      </h2>

      <table className="w-full border text-sm bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Village</th>
            <th className="p-2 border">Attached Doctor</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">CSR</th>
            <th className="p-2 border">Condition</th>
            <th className="p-2 border">Symptoms</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Reviewed By</th>
            <th className="p-2 border">Notes</th>
          </tr>
        </thead>
        <tbody>
          {cases.length > 0 ? cases.map(c => {
            const p = patientsMap[c.patientId] || {};
            return (
              <tr key={c.id} className={`border-t ${getRowColor(c.riskClassification)}`}>
                <td className="p-2 border">{c.patientName || '-'}</td>
                <td className="p-2 border">{p.village || '-'}</td>
                <td className="p-2 border">{doctorsMap[p.registeringDoctor] || '-'}</td>
                <td className="p-2 border">{c.submittedAt?.toDate().toLocaleString() || '-'}</td>
                <td className="p-2 border font-semibold">{c.totalWeight ?? '-'}</td>
                <td className="p-2 border">
                  {c.suggestedCondition || c.flags?.slice(-1)[0]?.label || '-'}
                </td>
                <td className="p-2 border">
                  {Array.isArray(c.flags) ? c.flags.map(f => f.label || f).join(', ') : '-'}
                </td>
                <td className="p-2 border">
                  <select
                    value={c.status || ''}
                    onChange={e => updateStatus(c.id, e.target.value)}
                    className="border rounded p-1 bg-white"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="p-2 border">{c.reviewedBy?.name || '-'}</td>
                <td className="p-2 border">
                  <input
                    type="text"
                    value={c.doctorNotes || ''}
                    onChange={e => updateNotes(c.id, e.target.value)}
                    className="border p-1 w-full"
                  />
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="10" className="p-4 text-center text-gray-500">
                No flagged cases found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

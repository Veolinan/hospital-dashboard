import React, { useState, useEffect } from 'react';
import { db, auth, functions } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export default function RequestPatient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchHospitals = async () => {
      const snap = await getDocs(collection(db, 'hospitals'));
      setHospitals(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    };
    fetchHospitals();
  }, []);

  const handleSearch = async () => {
    setError('');
    setSuccess('');
    setPatient(null);
    if (!searchTerm.trim()) return setError('Enter patient code or phone');
    setLoading(true);

    try {
      const byCode = query(collection(db, 'patients'), where('patientCode', '==', searchTerm.trim()));
      const codeSnap = await getDocs(byCode);

      if (!codeSnap.empty) {
        setPatient({ id: codeSnap.docs[0].id, ...codeSnap.docs[0].data() });
      } else {
        const byPhone = query(collection(db, 'patients'), where('phone', '==', searchTerm.trim()));
        const phoneSnap = await getDocs(byPhone);

        if (!phoneSnap.empty) {
          setPatient({ id: phoneSnap.docs[0].id, ...phoneSnap.docs[0].data() });
        } else {
          setError('❌ No patient found');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('❌ Failed to search patient');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!selectedHospital) {
      setError('⚠️ Select receiving hospital');
      return;
    }
    if (!currentUser) {
      setError('⚠️ Doctor must be logged in');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestRef = await addDoc(collection(db, 'recordRequests'), {
        patientId: patient.id,
        patientName: patient.fullName,
        requestingDoctorId: currentUser.uid,
        requestingDoctorEmail: currentUser.email,
        fromHospitalId: patient.hospitalId,
        toHospitalId: selectedHospital,
        status: 'pending',
        requestedAt: serverTimestamp(),
      });

      const sendEmail = httpsCallable(functions, 'sendRecordRequestNotification');
      await sendEmail({ requestId: requestRef.id });

      setSuccess('✅ Request sent successfully');
      setPatient(null);
      setSearchTerm('');
      setSelectedHospital('');
    } catch (err) {
      console.error('Failed to send request:', err);
      setError('❌ Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10 px-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-6">Request Patient Records</h2>

      <div className="flex gap-2 mb-4">
        <input
          placeholder="Patient code or phone"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      {patient && (
        <>
          <div className="bg-gray-100 p-4 rounded mb-4">
            <p><strong>Name:</strong> {patient.fullName}</p>
            <p><strong>From hospital:</strong> {patient.hospitalId}</p>
            <p><strong>Code:</strong> {patient.patientCode}</p>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Request to</label>
            <select
              value={selectedHospital}
              onChange={e => setSelectedHospital(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select hospital</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRequest}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Sending request...' : 'Send Request'}
          </button>
        </>
      )}
    </div>
  );
}

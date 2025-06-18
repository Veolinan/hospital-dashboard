import React, { useState, useEffect } from 'react';
import { db, auth, functions } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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
      setHospitals(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
    };
    fetchHospitals();
  }, []);

  const handleSearch = async () => {
    setError('');
    setPatient(null);
    setSuccess('');
    if (!searchTerm.trim()) return setError('Enter patient code or phone');
    setLoading(true);
    try {
      const q = query(
        collection(db, 'patients'),
        where('patientCode', '==', searchTerm.trim())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        // fallback search by phone
        const q2 = query(collection(db, 'patients'), where('phone', '==', searchTerm.trim()));
        const snap2 = await getDocs(q2);
        if (snap2.empty) return setError('No patient found');
        setPatient({ id: snap2.docs[0].id, ...snap2.docs[0].data() });
      } else {
        setPatient({ id: snap.docs[0].id, ...snap.docs[0].data() });
      }
    } catch (err) {
      console.error(err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!selectedHospital) return setError('Select receiving hospital');

    setLoading(true);
    setError('');
    try {
      const ref = await addDoc(collection(db, 'recordRequests'), {
        patientId: patient.id,
        patientName: patient.fullName,
        requestingDoctorId: currentUser.uid,
        requestingDoctorEmail: currentUser.email,
        fromHospitalId: patient.hospitalId,
        toHospitalId: selectedHospital,
        status: 'pending',
        requestedAt: serverTimestamp(),
      });

      // Trigger email via Cloud Function
      const sendNotification = httpsCallable(functions, 'sendRecordRequestNotification');
      await sendNotification({ requestId: ref.id });

      setSuccess('Request sent successfully ✅');
      setPatient(null);
      setSearchTerm('');
      setSelectedHospital('');
    } catch (err) {
      console.error(err);
      setError('Failed to send request');
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
            <p><strong>Hospital ID:</strong> {patient.hospitalId}</p>
            <p><strong>Code:</strong> {patient.patientCode}</p>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Request to Hospital:</label>
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

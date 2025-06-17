import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; // Ensure Firebase is initialized
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function AdminRegister() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    staffNumber: '',
    role: '',
    hospitalId: '',
  });

  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHospitals = async () => {
      const hospitalSnapshot = await getDocs(collection(db, 'hospitals'));
      const hospitalList = hospitalSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHospitals(hospitalList);
    };
    fetchHospitals();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const { name, email, phone, nationalId, staffNumber, role, hospitalId } = form;

    if (!name || !email || !phone || !nationalId || !staffNumber || !role) {
      return setError('All fields are required.');
    }

    if (role === 'admin' && !hospitalId) {
      return setError('Please select a hospital for role: admin.');
    }

    try {
      await addDoc(collection(db, 'admins'), {
        ...form,
        createdAt: new Date(),
      });
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('Registration failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-6">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-lg w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-blue-700 text-center">Admin Registration</h2>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} className="w-full border px-4 py-2 rounded" />

        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full border px-4 py-2 rounded" />

        <input type="text" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="w-full border px-4 py-2 rounded" />

        <input type="text" name="nationalId" placeholder="National ID Number" value={form.nationalId} onChange={handleChange} className="w-full border px-4 py-2 rounded" />

        <input type="text" name="staffNumber" placeholder="Staff Number" value={form.staffNumber} onChange={handleChange} className="w-full border px-4 py-2 rounded" />

        <select name="role" value={form.role} onChange={handleChange} className="w-full border px-4 py-2 rounded">
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="s-admin">Senior Admin (s-admin)</option>
          <option value="su-admin">Super Admin (su-admin)</option>
        </select>

        {form.role === 'admin' && (
          <select name="hospitalId" value={form.hospitalId} onChange={handleChange} className="w-full border px-4 py-2 rounded">
            <option value="">Select Hospital</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        )}

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Register
        </button>
      </form>
    </div>
  );
}

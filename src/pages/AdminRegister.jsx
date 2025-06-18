import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, serverTimestamp, doc, setDoc } from 'firebase/firestore';

export default function AdminRegister() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    staffNumber: '',
    password: '',
    role: '',
    hospitalId: '',
  });

  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch hospital list
  useEffect(() => {
    const fetchHospitals = async () => {
      const snapshot = await getDocs(collection(db, 'hospitals'));
      const hospitalList = snapshot.docs.map(doc => ({
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
    setError('');
    setLoading(true);

    const { name, email, phone, nationalId, staffNumber, password, role, hospitalId } = form;

    if (!name || !email || !phone || !nationalId || !staffNumber || !password || !role) {
      setLoading(false);
      return setError('⚠️ All fields are required.');
    }

    if (role === 'admin' && !hospitalId) {
      setLoading(false);
      return setError('⚠️ Please select a hospital for the admin role.');
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Save user profile to Firestore with UID as doc ID
      await setDoc(doc(db, 'users', uid), {
        uid,
        name,
        email,
        phone,
        nationalId,
        staffNumber,
        role,
        hospitalId: role === 'admin' ? hospitalId : '',
        createdAt: serverTimestamp(),
      });

      // Redirect to login page
      navigate('/login');
    } catch (err) {
      console.error('Registration failed:', err.message);
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-4 border border-blue-100"
      >
        <h2 className="text-2xl font-bold text-blue-700 text-center">🛡️ Admin Registration</h2>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="text"
          name="nationalId"
          placeholder="National ID Number"
          value={form.nationalId}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="text"
          name="staffNumber"
          placeholder="Staff Number"
          value={form.staffNumber}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        >
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="s-admin">Senior Admin (s-admin)</option>
          <option value="su-admin">Super Admin (su-admin)</option>
        </select>

        {form.role === 'admin' && (
          <select
            name="hospitalId"
            value={form.hospitalId}
            onChange={handleChange}
            required
            className="w-full border px-4 py-2 rounded"
          >
            <option value="">Select Hospital</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? 'Registering...' : 'Register Admin'}
        </button>
      </form>
    </div>
  );
}

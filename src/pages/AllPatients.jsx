import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  startAfter,
  limit
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 20;

export default function AllPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hospitalId, setHospitalId] = useState(null);
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const navigate = useNavigate();
  const loaderRef = useRef();

  // 1. Fetch current user's hospitalId
  useEffect(() => {
    const fetchHospitalId = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          console.warn("No auth user");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", uid));
        const hId = userDoc.data()?.hospitalId;
        console.log("Fetched hospitalId:", hId);
        setHospitalId(hId);
      } catch (err) {
        console.error("Error fetching hospitalId:", err);
      }
    };
    fetchHospitalId();
  }, []);

  // 2. Load patients
  const fetchPatients = async (reset = false) => {
    if (!hospitalId) {
      console.warn("Skipped fetchPatients: hospitalId not ready.");
      return;
    }

    setLoading(true);
    console.log(`Fetching patients (reset: ${reset})...`);

    try {
      let q = query(
        collection(db, "patients"),
        where("hospitalId", "==", hospitalId),
        orderBy("fullName"),
        ...(lastDoc && !reset ? [startAfter(lastDoc)] : []),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const nextLastDoc = snap.docs[snap.docs.length - 1] || null;

      console.log("Fetched docs:", fetched.length, "Next lastDoc:", nextLastDoc?.id || null);

      const filtered = search.trim()
        ? fetched.filter(p => {
            const term = search.toLowerCase();
            return (
              p.fullName?.toLowerCase().includes(term) ||
              p.phone?.includes(term) ||
              String(p.patientCode || "").includes(term)
            );
          })
        : fetched;

      setPatients(prev => (reset ? filtered : [...prev, ...filtered]));
      setLastDoc(nextLastDoc);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error loading patients:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Trigger fetch on hospitalId or search change
  useEffect(() => {
    if (!hospitalId) return;

    setPatients([]);
    setLastDoc(null);
    setHasMore(true);

    fetchPatients(true);
  }, [hospitalId, search]);

  // 4. Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && hasMore) {
          console.log("Triggering more fetch...");
          fetchPatients(false);
        }
      },
      { threshold: 1 }
    );

    const current = loaderRef.current;
    if (current) observer.observe(current);
    return () => current && observer.unobserve(current);
  }, [loading, hasMore, lastDoc, hospitalId]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-blue-700">All Registered Patients</h1>

      <input
        type="text"
        placeholder="Search by name, phone, or code"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full md:w-1/2 px-4 py-2 border rounded shadow"
      />

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">DOB</th>
              <th className="px-4 py-3">Village</th>
              <th className="px-4 py-3">Hospital</th>
              <th className="px-4 py-3">Profile</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{p.fullName || "—"}</td>
                <td className="px-4 py-2">{p.phone || "—"}</td>
                <td className="px-4 py-2">{p.dob || "—"}</td>
                <td className="px-4 py-2">{p.village || "—"}</td>
                <td className="px-4 py-2">{p.hospitalId || "—"}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => navigate(`/patient/${p.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div ref={loaderRef} className="text-center text-sm text-gray-500 py-4">
          {loading
            ? "Loading..."
            : !patients.length
            ? "No patients found."
            : hasMore
            ? "Scroll to load more..."
            : "End of list."}
        </div>
      </div>
    </div>
  );
}

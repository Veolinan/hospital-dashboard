import React, { useEffect, useState, useRef, useCallback } from "react";
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
  limit,
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
    async function fetchHospitalId() {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const userDoc = await getDoc(doc(db, "users", uid));
      const hId = userDoc.data()?.hospitalId;
      console.log("User hospitalId:", hId);
      setHospitalId(hId);
    }
    fetchHospitalId();
  }, []);

  // 🔁 Load patients (memoized to prevent re-renders in useEffect)
  const loadPatients = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "patients"),
          where("hospitalId", "==", hospitalId),
          orderBy("fullName"),
          ...(lastDoc && !reset ? [startAfter(lastDoc)] : []),
          limit(PAGE_SIZE)
        );

        const snap = await getDocs(q);
        const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const filtered = docs.filter((p) => {
          const term = search.toLowerCase();
          return (
            p.fullName?.toLowerCase().includes(term) ||
            p.phone?.includes(term) ||
            p.patientCode?.includes(term)
          );
        });

        setPatients((prev) => (reset ? filtered : [...prev, ...filtered]));
        setLastDoc(snap.docs[snap.docs.length - 1]);
        setHasMore(snap.docs.length === PAGE_SIZE);
      } catch (error) {
        console.error("Error loading patients:", error.message);
      } finally {
        setLoading(false);
      }
    },
    [hospitalId, lastDoc, search]
  );

  // 2. Load patients when hospitalId or search changes
  useEffect(() => {
    if (!hospitalId) return;
    setPatients([]);
    setLastDoc(null);
    setHasMore(true);
    loadPatients(true);
  }, [hospitalId, search, loadPatients]);

  // 3. Scroll trigger
  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          loadPatients(false);
        }
      },
      { threshold: 1 }
    );

    observer.observe(currentLoader);
    return () => observer.unobserve(currentLoader);
  }, [hasMore, loading, loadPatients]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-blue-700">All Registered Patients</h1>

      <input
        type="text"
        placeholder="Search by name, phone, or code"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
            {patients.map((p) => (
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
          {loading ? "Loading..." : hasMore ? "Scroll to load more..." : "End of list."}
        </div>
      </div>
    </div>
  );
}

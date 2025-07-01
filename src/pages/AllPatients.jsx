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
  const [doctorsMap, setDoctorsMap] = useState({});
  const [hospitalsMap, setHospitalsMap] = useState({});

  const navigate = useNavigate();
  const loaderRef = useRef();

  // Fetch current user's hospital ID
  useEffect(() => {
    const fetchHospitalId = async () => {
      const uid = auth.currentUser?.uid;
      console.log("Auth UID:", uid);
      if (!uid) return;

      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        const hId = userDoc.data()?.hospitalId;
        console.log("Fetched hospitalId:", hId);
        setHospitalId(hId);
      } catch (error) {
        console.error("Error fetching user document:", error);
      }
    };
    fetchHospitalId();
  }, []);

  // Load doctors and hospitals mapping
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const doctorSnap = await getDocs(collection(db, "doctors"));
        const doctorMap = {};
        doctorSnap.forEach((d) => {
          doctorMap[d.id] = d.data().fullName || "—";
        });
        setDoctorsMap(doctorMap);

        const hospitalSnap = await getDocs(collection(db, "hospitals"));
        const hospitalMap = {};
        hospitalSnap.forEach((h) => {
          hospitalMap[h.id] = h.data().name || "—";
        });
        setHospitalsMap(hospitalMap);
      } catch (error) {
        console.error("Error loading doctor/hospital maps:", error);
      }
    };
    loadMaps();
  }, []);

  // Fetch patients (initial and paginated)
  const fetchPatients = async (reset = false) => {
    if (!hospitalId) {
      console.warn("fetchPatients called without hospitalId");
      return;
    }

    setLoading(true);
    console.log("Fetching patients...", { reset, hospitalId });

    try {
      let q = query(
        collection(db, "patients"),
        where("hospitalId", "==", hospitalId),
        orderBy("fullName"),
        ...(lastDoc && !reset ? [startAfter(lastDoc)] : []),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);
      const fetched = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const nextLastDoc = snap.docs[snap.docs.length - 1] || null;

      console.log("Fetched from Firestore:", fetched);

      const term = search.trim().toLowerCase();
      const filtered = term
        ? fetched.filter((p) => {
            return (
              p.fullName?.toLowerCase().includes(term) ||
              p.phone?.includes(term) ||
              String(p.patientCode || "").includes(term)
            );
          })
        : fetched;

      console.log("Filtered patients:", filtered);

      setPatients((prev) => (reset ? filtered : [...prev, ...filtered]));
      setLastDoc(nextLastDoc);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error loading patients:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetching when hospitalId or search changes
  useEffect(() => {
    if (!hospitalId) return;
    setPatients([]);
    setLastDoc(null);
    setHasMore(true);
    fetchPatients(true);
  }, [hospitalId, search]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && hasMore) {
          console.log("Loader visible. Fetching next page...");
          fetchPatients(false);
        }
      },
      { threshold: 1 }
    );

    const current = loaderRef.current;
    if (current) observer.observe(current);
    return () => current && observer.unobserve(current);
  }, [loading, hasMore, lastDoc, hospitalId]);

  const getAge = (dobString) => {
    if (!dobString) return "—";
    const dob = new Date(dobString);
    const ageDifMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  if (!hospitalId) {
    return <div className="p-4">Loading hospital information...</div>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Age</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Village</th>
            <th className="px-4 py-3">Hospital</th>
            <th className="px-4 py-3">Doctor</th>
            <th className="px-4 py-3">Profile</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{p.patientCode || "—"}</td>
              <td className="px-4 py-2">{p.fullName || "—"}</td>
              <td className="px-4 py-2">{getAge(p.dob)}</td>
              <td className="px-4 py-2">{p.phone || "—"}</td>
              <td className="px-4 py-2">{p.village || "—"}</td>
              <td className="px-4 py-2">{hospitalsMap[p.hospitalId] || "—"}</td>
              <td className="px-4 py-2">{doctorsMap[p.registeringDoctor] || "—"}</td>
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
  );
}

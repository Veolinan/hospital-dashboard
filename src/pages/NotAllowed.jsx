// src/pages/NotAllowed.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { getDoc, doc } from "firebase/firestore";

export default function NotAllowed() {
  const [role, setRole] = useState("");

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const data = userSnap.data();
      setRole(data?.role || "Unknown");
    };
    fetchRole();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 px-6 text-center">
      <h1 className="text-4xl font-bold text-yellow-600 mb-3">Access Denied 🚫</h1>
      <p className="text-lg text-gray-700 mb-2">
        You do not have permission to view this page.
      </p>
      <p className="text-sm text-gray-600 mb-6">
        Your current role:{" "}
        <span className="font-semibold text-red-600">{role}</span>
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition"
      >
        Go Back
      </button>
    </div>
  );
}

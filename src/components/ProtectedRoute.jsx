// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const user = auth.currentUser;
      if (!user) return setLoading(false);

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return setLoading(false);

        const role = docSnap.data().role;
        if (allowedRoles.includes(role)) setHasAccess(true);
      } catch (err) {
        console.error("Error checking role:", err);
      }

      setLoading(false);
    };

    checkAccess();
  }, [allowedRoles]);

  if (loading) return <div className="text-center mt-10">Checking permissions...</div>;

  return hasAccess ? children : <Navigate to="/not-allowed" replace />;
};

export default ProtectedRoute;

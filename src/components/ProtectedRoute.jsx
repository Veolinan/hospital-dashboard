import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const user = auth.currentUser;

      // Redirect if not logged in
      if (!user) {
        setUserChecked(true);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const role = docSnap.data().role;

          if (allowedRoles.includes(role)) {
            setHasAccess(true);
          }
        }
      } catch (err) {
        console.error("Error checking user role:", err);
      }

      setUserChecked(true);
      setLoading(false);
    };

    checkAccess();
  }, [allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid" />
      </div>
    );
  }

  // 🚫 Not logged in
  if (!auth.currentUser && userChecked) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Not authorized
  if (!hasAccess) {
    return <Navigate to="/not-allowed" replace />;
  }

  // ✅ Authorized
  return children;
};

export default ProtectedRoute;

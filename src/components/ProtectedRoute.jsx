import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsLoggedIn(false);
        setCheckingAuth(false);
        return;
      }

      setIsLoggedIn(true);

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const role = snap.data().role;
          setHasAccess(allowedRoles.includes(role));
        }
      } catch (err) {
        console.error("Error checking role:", err);
      }

      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [allowedRoles]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid" />
      </div>
    );
  }

  // ❗ Not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Unauthorized
  if (!hasAccess) {
    return <Navigate to="/not-allowed" replace />;
  }

  // ✅ Authorized
  return children;
};

export default ProtectedRoute;

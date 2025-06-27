import React from "react";
import Sidebar from "../components/Sidebar";

const ProtectedLayout = ({ role, children }) => {
  return (
    <div className="flex">
      <Sidebar role={role} />
      <main className="ml-16 md:ml-64 p-4 w-full transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;

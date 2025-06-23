import React from "react";
import { Outlet } from "react-router-dom";
import DoctorNavbar from "../components/DoctorNavbar";

export default function DoctorLayout() {
  return (
    <>
      <DoctorNavbar />
      <main className="pt-4 px-4">
        <Outlet />
      </main>
    </>
  );
}

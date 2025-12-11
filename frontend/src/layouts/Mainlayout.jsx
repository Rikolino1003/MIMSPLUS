import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";   // Asegúrate de que la ruta sea correcta

export default function MainLayout() {
  return (
    <div className="main-layout">
      {/* 🔷 Navbar visible en todas las páginas públicas */}
      <Navbar />

      {/* 🔹 Contenido dinámico que cambia según la ruta */}
      <main className="contenido-principal">
        <Outlet />
      </main>
    </div>
  );
}

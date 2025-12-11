import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/empleadoDashboard.css";

export default function EmpleadoLayout() {
  return (
    <div className="layout-empleado">
      {/* Si tienes sidebar para el empleado */}
      <Sidebar />

      {/* Aquí se carga el contenido de cada subruta */}
      <div className="empleado-contenido">
        <Outlet />
      </div>
    </div>
  );
}

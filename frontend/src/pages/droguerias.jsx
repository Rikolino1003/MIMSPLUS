import React, { useContext, useEffect } from "react";
import { DrogueriaContext } from "../context/DrogueriaContext";
import DrogueriasList from "../components/Droguerias/DrogueriasList";
import ChatWindow from "../components/Droguerias/ChatWindow";
import "../styles/droguerias.css";

export default function Droguerias() {
  const { usuario, cargarDrogueriaActiva, cargarDroguerias } = useContext(DrogueriaContext);
  const esAdmin = usuario?.is_superuser || usuario?.is_staff;

  useEffect(() => {
    if (esAdmin) {
      cargarDroguerias();
      cargarDrogueriaActiva();
    }
  }, [esAdmin, cargarDrogueriaActiva, cargarDroguerias]);

  if (!esAdmin) {
    return (
      <div className="droguerias-page unauthorized">
        <div className="error-message">
          <h2>Acceso denegado</h2>
          <p>Solo los administradores pueden acceder a este módulo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="droguerias-page">
      <DrogueriasList />
      <ChatWindow />
    </div>
  );
}

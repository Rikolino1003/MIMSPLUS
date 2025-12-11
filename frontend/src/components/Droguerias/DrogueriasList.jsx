import React, { useContext, useEffect } from "react";
import { DrogueriaContext } from "../../context/DrogueriaContext";
import { ChevronRight } from "lucide-react";

export default function DrogueriasList() {
  const ctx = useContext(DrogueriaContext);
  
  // Debug
  useEffect(() => {
    console.log("DrogueriasList mounted", {
      droguerias: ctx?.droguerias?.length,
      drogueriaActiva: ctx?.drogueriaActiva?.id,
      usuario: ctx?.usuario?.username
    });
  }, [ctx]);

  if (!ctx) {
    console.error("DrogueriaContext is null!");
    return <div>Error: Context not available</div>;
  }

  const { droguerias, drogueriaActiva, cambiarDrogueria, cargarDroguerias, usuario } = ctx;
  const esAdmin = usuario?.is_superuser || usuario?.is_staff;

  useEffect(() => {
    console.log("Loading droguerias, current count:", droguerias?.length);
    if (!droguerias || droguerias.length === 0) {
      console.log("Calling cargarDroguerias...");
      cargarDroguerias();
    }
  }, []);

  const handleSelectDrogueria = (drogueriaId) => {
    console.log("Selecting drogueria:", drogueriaId, "esAdmin:", esAdmin);
    if (esAdmin) {
      cambiarDrogueria(drogueriaId);
    }
  };

  return (
    <div className="droguerias-list">
      <div className="list-header">
        <h2>Droguerías</h2>
        {esAdmin && <span className="badge-admin">Admin</span>}
      </div>

      <div className="list-container">
        {!droguerias || droguerias.length === 0 ? (
          <div className="empty-state">
            <p>No hay droguerías disponibles</p>
          </div>
        ) : (
          droguerias.map((drogueria) => (
            <button
              key={drogueria.id}
              onClick={() => handleSelectDrogueria(drogueria.id)}
              disabled={!esAdmin}
              className={`drogueria-item ${drogueriaActiva?.id === drogueria.id ? "active" : ""} ${!esAdmin ? "disabled" : ""}`}
            >
              <div className="item-content">
                <h3>{drogueria.nombre}</h3>
                <p>{drogueria.telefono || "Sin teléfono"}</p>
              </div>
              {esAdmin && drogueriaActiva?.id === drogueria.id && <ChevronRight size={20} />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useContext, useState, useEffect } from "react";
import { DrogueriaContext } from "../context/DrogueriaContext";
import { ChevronDown, MessageSquare } from "lucide-react";
import "../styles/drogueriaWidget.css";

export default function DrogueriaWidget() {
  const { drogueriaActiva, droguerias, cambiarDrogueria, usuario, cargarDroguerias } = useContext(DrogueriaContext);
  const [isOpen, setIsOpen] = useState(false);
  const esAdmin = usuario?.is_superuser || usuario?.is_staff;

  // Cargar droguerías si está vacío
  useEffect(() => {
    if (esAdmin && droguerias.length === 0) {
      cargarDroguerias();
    }
  }, [esAdmin, droguerias.length, cargarDroguerias]);

  if (!esAdmin || !drogueriaActiva) return null;

  return (
    <div className="drogueria-widget">
      <div className="widget-container">
        <div className="widget-icon">
          <MessageSquare size={18} />
        </div>
        <div className="widget-info">
          <h4>Droguería Activa</h4>
          <p>{drogueriaActiva.nombre}</p>
        </div>
        <button 
          className="widget-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown size={18} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
        </button>
      </div>

      {isOpen && (
        <div className="widget-dropdown">
          <div className="dropdown-list">
            {droguerias.map((drogueria) => (
              <button
                key={drogueria.id}
                onClick={() => {
                  cambiarDrogueria(drogueria.id);
                  setIsOpen(false);
                }}
                className={`dropdown-item ${drogueriaActiva.id === drogueria.id ? "active" : ""}`}
              >
                {drogueria.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

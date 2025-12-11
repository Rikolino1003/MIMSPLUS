import React from "react"; 
import "../styles/sidebar.css";
import { Pill, FileText, Package, LogOut } from "lucide-react";

const Sidebar = ({ seccionActual, setSeccion }) => {
  const items = [
    { id: "medicamentos", nombre: "Medicamentos", icono: <Pill size={20} /> },
    { id: "facturas", nombre: "Facturas", icono: <FileText size={20} /> },
    { id: "pedidos", nombre: "Pedidos", icono: <Package size={20} /> },
  ];

  // Función de logout
  const handleLogout = () => {
    // Guardar razón del cierre de sesión
    sessionStorage.setItem('logoutReason', 'success');
    
    // Limpiar datos de autenticación
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    
    // Redirigir al login
    window.location.href = "/login";
  };

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">
        <span className="title-icon">👨‍⚕️</span> Panel Empleado
      </h2>

      <ul className="sidebar-menu">
        {items.map((item) => (
          <li
            key={item.id}
            className={`sidebar-item ${seccionActual === item.id ? "active" : ""}`}
            onClick={() => setSeccion(item.id)}
          >
            {item.icono} {item.nombre}
          </li>
        ))}
      </ul>

      {/* Botón de logout */}
      <button className="sidebar-logout" onClick={handleLogout}>
        <LogOut size={20} /> Cerrar sesión
      </button>
    </aside>
  );
};

export default Sidebar;

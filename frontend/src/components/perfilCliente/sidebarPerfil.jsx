import React from "react";
import { User, ShoppingBag, FileText } from "lucide-react";
import "../../styles/sidebarPerfil.css";

export default function SidebarPerfil({ activeTab, setActiveTab }) {
  return (
    <aside className="sidebar-perfil">

      <h2 className="sidebar-title">Mi Cuenta</h2>

      <button
        className={`sidebar-item ${activeTab === "info" ? "active" : ""}`}
        onClick={() => setActiveTab("info")}
        aria-label="Ver información"
      >
        <User size={18} />
        Información
      </button>

      <button
        className={`sidebar-item ${activeTab === "pedidos" ? "active" : ""}`}
        onClick={() => setActiveTab("pedidos")}
        aria-label="Ver pedidos"
      >
        <ShoppingBag size={18} />
        Pedidos
      </button>

      <button
        className={`sidebar-item ${activeTab === "facturas" ? "active" : ""}`}
        onClick={() => setActiveTab("facturas")}
        aria-label="Ver facturas"
      >
        <FileText size={18} />
        Facturas
      </button>

    </aside>
  );
}

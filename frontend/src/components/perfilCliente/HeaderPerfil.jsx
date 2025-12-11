import "../../styles/pages/headerPerfil.css";
import { User } from 'lucide-react';

export default function HeaderPerfil({ nombre, email, onEdit }) {
  const inicial = nombre ? nombre.charAt(0).toUpperCase() : "C";

  return (
    <div className="header-perfil-container">
      <div className="header-avatar">
        {nombre ? (
          <div className="avatar-inicial">{inicial}</div>
        ) : (
          <User size={32} className="avatar-icon" />
        )}
      </div>
      <div className="header-info">
        <div className="header-nombre">{nombre || "Usuario"}</div>
        <div className="header-email">{email || "-"}</div>
        <div className="header-rol">Cliente</div>
      </div>

      <button className="header-btn-editar" onClick={onEdit}>
        ✏️ Editar perfil
      </button>
    </div>
  );
}

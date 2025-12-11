import { useEffect, useState } from "react";
import HeaderPerfil from "./HeaderPerfil";
import TabPerfilInfo from "./TabPerfilInfo";
import TabPedidos from "./TabPedidos";
import TabFacturas from "./TabFacturas";
import "../../styles/pages/perfilCliente.css";
import { actualizarPerfil } from "../../services/perfilServices";
import ErrorBoundary from "../common/ErrorBoundary";

export default function PerfilClienteContent({
  usuario = {},
  pedidos = [],
  facturas = [],
  activeTab = "info",
  setActiveTab,
  setUsuario,
  currencyFormatter = (v) => v,
}) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(usuario || {});
  const [saving, setSaving] = useState(false);
  const [errores, setErrores] = useState({});
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [loadingFacturas, setLoadingFacturas] = useState(false);

  // Sincronizar formData cuando cambie el usuario
  useEffect(() => {
    if (usuario) {
      setFormData(usuario);
    }
  }, [usuario]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleEdit = async () => {
    if (!editMode) return setEditMode(true);

    // Validar antes de guardar
    const nuevosErrores = {};
    if (!formData.nombre_completo || formData.nombre_completo.trim().length < 3) {
      nuevosErrores.nombre_completo = "El nombre debe tener al menos 3 caracteres";
    }
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      nuevosErrores.email = "Correo electrónico inválido";
    }
    if (!formData.telefono || !/^\+?[0-9\s\-]{7,15}$/.test(formData.telefono)) {
      nuevosErrores.telefono = "Teléfono inválido";
    }
    if (!formData.direccion || formData.direccion.trim().length < 5) {
      nuevosErrores.direccion = "Dirección demasiado corta";
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      // No continuar si hay errores
      return;
    }

    try {
      setSaving(true);
      const res = await actualizarPerfil(usuario.id, formData);
      setUsuario(res);
      setEditMode(false);
      setErrores({});
      alert("Perfil actualizado");
    } catch (err) {
      console.error("Error guardando perfil:", err);
      alert("No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="perfilClientewrapper">
      <HeaderPerfil nombre={usuario?.nombre_completo || usuario?.nombre} email={usuario?.email} onEdit={toggleEdit} />

      <div className="perfil-tabs">
        <button
          className={`perfil-tab ${activeTab === "info" ? "perfil-tab--active" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          Información
        </button>

        <button
          className={`perfil-tab ${activeTab === "pedidos" ? "perfil-tab--active" : ""}`}
          onClick={() => setActiveTab("pedidos")}
        >
          Pedidos
        </button>

        <button
          className={`perfil-tab ${activeTab === "facturas" ? "perfil-tab--active" : ""}`}
          onClick={() => setActiveTab("facturas")}
        >
          Facturas
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "info" && (
          <TabPerfilInfo cliente={formData} editMode={editMode} handleChange={handleChange} errores={errores} />
        )}

        {activeTab === "pedidos" && (
          <TabPedidos pedidos={pedidos} loadingPedidos={false} currencyFormatter={currencyFormatter} />
        )}

        {activeTab === "facturas" && (
          <ErrorBoundary>
            <TabFacturas facturas={facturas} currencyFormatter={currencyFormatter} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

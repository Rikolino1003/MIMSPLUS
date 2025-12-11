import React, { useState, useEffect } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { Edit2, Save, X, AlertCircle } from "lucide-react";
import "../styles/PerfilCliente.css";

export default function PerfilCliente() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    telefono: "",
    direccion: "",
  });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const response = await API.get("/usuarios/perfil/");
      setUsuario(response.data);
      setFormData({
        nombre_completo: response.data.nombre_completo || "",
        email: response.data.email || "",
        telefono: response.data.telefono || "",
        direccion: response.data.direccion || "",
      });
    } catch (error) {
      console.error("Error cargando perfil:", error);
      setMensaje({
        tipo: "error",
        texto: "No se pudo cargar el perfil. Por favor, inicia sesión nuevamente.",
      });
      // Redirigir a login si no está autenticado
      if (error.response?.status === 401) {
        setTimeout(() => navigate("/login"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo si existe
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const guardarCambios = async () => {
    try {
      setErrores({});
      setMensaje(null);

      const response = await API.patch("/usuarios/perfil/", formData);

      setUsuario(response.data.usuario);
      setEditando(false);
      setMensaje({
        tipo: "success",
        texto: "Perfil actualizado correctamente",
      });

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      if (error.response?.data?.errors) {
        setErrores(error.response.data.errors);
      } else {
        setMensaje({
          tipo: "error",
          texto: "No se pudo actualizar el perfil. Intenta de nuevo.",
        });
      }
    }
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setFormData({
      nombre_completo: usuario.nombre_completo || "",
      email: usuario.email || "",
      telefono: usuario.telefono || "",
      direccion: usuario.direccion || "",
    });
    setErrores({});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="perfil-cliente-container">
      <div className="perfil-card">
        <div className="perfil-header">
          <h1>Mi Perfil</h1>
          {!editando && (
            <button
              onClick={() => setEditando(true)}
              className="btn-editar"
              title="Editar perfil"
            >
              <Edit2 size={18} /> Editar
            </button>
          )}
        </div>

        {mensaje && (
          <div
            className={`mensaje ${mensaje.tipo}`}
            role="alert"
          >
            {mensaje.tipo === "error" && <AlertCircle size={18} />}
            <span>{mensaje.texto}</span>
          </div>
        )}

        {editando ? (
          <div className="perfil-form">
            <div className="form-group">
              <label>Nombre Completo</label>
              <input
                type="text"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleChange}
                className={`form-input ${errores.nombre_completo ? "error" : ""}`}
              />
              {errores.nombre_completo && (
                <span className="error-text">{errores.nombre_completo}</span>
              )}
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errores.email ? "error" : ""}`}
              />
              {errores.email && (
                <span className="error-text">{errores.email}</span>
              )}
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={`form-input ${errores.telefono ? "error" : ""}`}
              />
              {errores.telefono && (
                <span className="error-text">{errores.telefono}</span>
              )}
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className={`form-input ${errores.direccion ? "error" : ""}`}
              />
              {errores.direccion && (
                <span className="error-text">{errores.direccion}</span>
              )}
            </div>

            <div className="form-actions">
              <button
                onClick={guardarCambios}
                className="btn-save"
              >
                <Save size={18} /> Guardar
              </button>
              <button
                onClick={cancelarEdicion}
                className="btn-cancel"
              >
                <X size={18} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="perfil-info">
            <div className="info-group">
              <label>Usuario</label>
              <p>{usuario?.username || "—"}</p>
            </div>

            <div className="info-group">
              <label>Nombre Completo</label>
              <p>{usuario?.nombre_completo || "—"}</p>
            </div>

            <div className="info-group">
              <label>Email</label>
              <p>{usuario?.email || "—"}</p>
            </div>

            <div className="info-group">
              <label>Teléfono</label>
              <p>{usuario?.telefono || "—"}</p>
            </div>

            <div className="info-group">
              <label>Dirección</label>
              <p>{usuario?.direccion || "—"}</p>
            </div>

            <div className="info-group">
              <label>Rol</label>
              <p className="rol-badge">{usuario?.rol || "cliente"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import "../../styles/TabDirecciones.css";

export default function TabDirecciones({ usuario }) {
  const [direccion, setDireccion] = useState("");
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setDireccion(usuario.direccion || "");
    }
  }, [usuario]);

  const guardarCambios = () => {
    if (!direccion.trim()) {
      alert("La dirección no puede estar vacía");
      return;
    }

    // Aquí puedes llamar a tu backend con axios
    // axios.put("/api/usuario/direccion", { direccion });

    localStorage.setItem(
      "usuario",
      JSON.stringify({ ...usuario, direccion })
    );

    alert("Dirección actualizada correctamente");
    setEditando(false);
  };

  return (
    <div className="direcciones-container">
      <h2 className="titulo-seccion">Direcciones</h2>
      <p className="descripcion">
        Administra tu dirección de entrega para pedidos a domicilio.
      </p>

      <div className="card-direccion">
        <label className="label">Dirección registrada</label>

        {!editando ? (
          <>
            <p className="direccion-texto">{direccion || "No registrada"}</p>

            <button className="btn-editar" onClick={() => setEditando(true)}>
              Editar dirección
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              className="input-direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Calle 12 #4-22"
            />

            <div className="acciones">
              <button className="btn-guardar" onClick={guardarCambios}>
                Guardar cambios
              </button>

              <button
                className="btn-cancelar"
                onClick={() => setEditando(false)}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

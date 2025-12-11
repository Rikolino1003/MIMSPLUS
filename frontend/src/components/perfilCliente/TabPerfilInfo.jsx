import React from "react";
import FieldItem from "./FieldItem";

export default function TabPerfilInfo({ cliente, editMode = false, handleChange = () => {}, errores = {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">

      <div>
        <label className="block text-sm font-semibold mb-1">Nombre Completo</label>
        {editMode ? (
          <>
            <input
              name="nombre_completo"
              value={cliente?.nombre_completo || cliente?.nombre || ""}
              onChange={handleChange}
              className="perfil-input"
            />
            {errores.nombre_completo && <p className="text-red-600 text-xs mt-1">⚠️ {errores.nombre_completo}</p>}
          </>
        ) : (
          <FieldItem value={cliente?.nombre_completo || cliente?.nombre} />
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Correo</label>
        {editMode ? (
          <>
            <input
              name="email"
              value={cliente?.email || ""}
              onChange={handleChange}
              className="perfil-input"
            />
            {errores.email && <p className="text-red-600 text-xs mt-1">⚠️ {errores.email}</p>}
          </>
        ) : (
          <FieldItem value={cliente?.email} />
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Teléfono</label>
        {editMode ? (
          <>
            <input
              name="telefono"
              value={cliente?.telefono || ""}
              onChange={handleChange}
              className="perfil-input"
            />
            {errores.telefono && <p className="text-red-600 text-xs mt-1">⚠️ {errores.telefono}</p>}
          </>
        ) : (
          <FieldItem value={cliente?.telefono} />
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Dirección</label>
        {editMode ? (
          <>
            <input
              name="direccion"
              value={cliente?.direccion || ""}
              onChange={handleChange}
              className="perfil-input"
            />
            {errores.direccion && <p className="text-red-600 text-xs mt-1">⚠️ {errores.direccion}</p>}
          </>
        ) : (
          <FieldItem value={cliente?.direccion} />
        )}
      </div>

      {/* Campos no editables */}
      <FieldItem label="Puntos Acumulados" value={cliente?.puntos} />
      <FieldItem label="Estado" value={cliente?.estado} />
      <FieldItem label="Última Compra" value={cliente?.ultimaCompra} />
      <FieldItem label="Miembro Desde" value={cliente?.registro} />
    </div>
  );
}

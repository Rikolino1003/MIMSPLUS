// src/pages/Roles.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import Modal from "../components/Modal";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    activo: true,
  });

  const baseRoles = "/usuarios/roles/";

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchRoles(), 300);
    return () => clearTimeout(t);
  }, [search, page]);

  /** Obtener lista de roles con paginación */
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get(baseRoles);
      let allRoles = res.data || [];

      // Filtrar por búsqueda
      if (search) {
        allRoles = allRoles.filter((r) =>
          r.nombre.toLowerCase().includes(search.toLowerCase()) ||
          r.descripcion?.toLowerCase().includes(search.toLowerCase())
        );
      }

      setTotalCount(allRoles.length);

      // Aplicar paginación
      const inicio = (page - 1) * pageSize;
      const fin = inicio + pageSize;
      setRoles(allRoles.slice(inicio, fin));
    } catch (err) {
      console.error(err);
      alert("Error al cargar roles");
    } finally {
      setLoading(false);
    }
  };

  /** Guardar (crear o editar) */
  const save = async () => {
    // Validaciones
    if (!form.nombre.trim()) {
      alert("Por favor ingresa el nombre del rol");
      return;
    }
    if (form.nombre.length < 3) {
      alert("El nombre del rol debe tener al menos 3 caracteres");
      return;
    }

    try {
      if (editing) {
        await api.patch(`${baseRoles}${editing.id}/`, form);
      } else {
        await api.post(baseRoles, form);
      }

      setOpen(false);
      resetForm();
      fetchRoles();
      alert(editing ? "Rol actualizado" : "Rol creado");
    } catch (err) {
      console.error(err);
      alert("Error al guardar rol");
    }
  };

  /** Cambiar estado del rol */
  const toggleActive = async (r) => {
    try {
      await api.patch(`${baseRoles}${r.id}/`, { activo: !r.activo });
      fetchRoles();
    } catch (err) {
      console.error(err);
      alert("Error al cambiar estado del rol");
    }
  };

  /** Consultar rol */
  const viewRole = (r) => {
    setSelectedRole(r);
    setViewModal(true);
  };

  /** Preparar modal para editar */
  const startEdit = (r) => {
    setEditing(r);
    setForm({
      nombre: r.nombre,
      descripcion: r.descripcion || "",
      activo: r.activo,
    });
    setOpen(true);
  };

  /** Preparar modal para crear */
  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };

  /** Limpiar formulario */
  const resetForm = () => {
    setEditing(null);
    setForm({ nombre: "", descripcion: "", activo: true });
  };

  /** ----------------------------------------
   * 7. Filtrar roles por nombre
   -----------------------------------------*/
  const rolesFiltrados = roles.filter((r) =>
    r.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gestión de Roles</h2>

        <button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="btn-primary px-4 py-2 bg-green-600"
        >
          + Nuevo rol
        </button>
      </header>

      {/* Campo de búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre de rol"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-default"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg p-4 shadow">
        <table className="w-full">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="py-2">ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {rolesFiltrados.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.id}</td>
                <td>{r.nombre}</td>
                <td>{r.descripcion}</td>
                <td>
                  <button
                    onClick={() => toggleActive(r)}
                    className={`px-3 py-1 rounded ${
                      r.activo ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {r.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="flex gap-2 py-2">
                  <button
                    onClick={() => startEdit(r)}
                    className="px-3 py-1 btn-primary flex items-center gap-1"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => viewRole(r)}
                    className="px-3 py-1 btn-secondary flex items-center gap-1"
                  >
                    👁️ Consultar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para consultar rol */}
      {viewModal && selectedRole && (
        <Modal
          open={viewModal}
          title={`Detalles del rol: ${selectedRole.nombre}`}
          onClose={() => setViewModal(false)}
          footer={null}
        >
          <div className="space-y-3">
            <p>
              <strong>Nombre:</strong> {selectedRole.nombre}
            </p>
            <p>
              <strong>Descripción:</strong> {selectedRole.descripcion}
            </p>
          </div>
        </Modal>
      )}

      {/* Modal para crear/editar rol */}
      <Modal
        open={open}
        title={editing ? "Editar rol" : "Nuevo rol"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              onClick={() => setOpen(false)}
              className="btn-secondary px-4 py-2"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              className="btn-primary px-4 py-2"
            >
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre"
            className="input-default"
          />

          <textarea
            value={form.descripcion}
            onChange={(e) =>
              setForm({ ...form, descripcion: e.target.value })
            }
            placeholder="Descripción"
            className="input-default"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) =>
                setForm({ ...form, activo: e.target.checked })
              }
            />
            Activo
          </label>
        </div>
      </Modal>
    </div>
  );
}

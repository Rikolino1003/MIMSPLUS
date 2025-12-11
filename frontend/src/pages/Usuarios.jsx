// src/pages/Usuarios.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import Modal from "../components/Modal";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [rolFiltro, setRolFiltro] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    nombre_completo: "",
    telefono: "",
    direccion: "",
    rol: "cliente",
  });

  const base = "/usuarios/usuarios/";
  const roles = ["cliente", "empleado", "admin"];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Debounce para búsqueda
    const t = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, rolFiltro, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(base);
      let allUsers = Array.isArray(res.data) ? res.data : [];

      // Aplicar filtros localmente
      if (search) {
        allUsers = allUsers.filter(
          (u) =>
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.nombre_completo.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (rolFiltro) {
        allUsers = allUsers.filter((u) => u.rol === rolFiltro);
      }

      setTotalCount(allUsers.length);

      // Aplicar paginación
      const inicio = (page - 1) * pageSize;
      const fin = inicio + pageSize;
      setUsuarios(allUsers.slice(inicio, fin));
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
      alert("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      username: "",
      email: "",
      password: "",
      nombre_completo: "",
      telefono: "",
      direccion: "",
      rol: "cliente",
    });
    setOpenModal(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      username: u.username || "",
      email: u.email || "",
      password: "",
      nombre_completo: u.nombre_completo || "",
      telefono: u.telefono || "",
      direccion: u.direccion || "",
      rol: u.rol || "cliente",
    });
    setOpenModal(true);
  };

  const openView = (u) => {
    setSelectedUser(u); // Guardar el usuario seleccionado
    setViewModal(true); // Abrir el modal para ver usuario
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar si el username ya existe
    const usernameExists = usuarios.some((u) => u.username === form.username);
    if (usernameExists && !editing) {
      alert("El nombre de usuario ya existe. Por favor, elige otro.");
      return;
    }

    try {
      let res;
      if (editing) {
        res = await api.put(`${base}${editing.id}/`, form);
        // Si el admin/usuario editó el propio usuario que está en localStorage, actualizar localStorage
        try {
          const current = JSON.parse(localStorage.getItem("usuario") || "{}");
          if (current && current.id === editing.id) {
            const updated = res.data || res;
            localStorage.setItem("usuario", JSON.stringify(updated));
          }
        } catch (e) {
          console.warn("No se pudo actualizar localStorage tras editar usuario:", e);
        }
      } else {
        res = await api.post(base, form);
      }

      setOpenModal(false);
      fetchUsers();
    } catch (err) {
      console.error("Error al guardar usuario:", err);
      alert("Error al guardar usuario. Verifica los datos e intenta nuevamente.");
    }
  };

  const handleDeactivate = async (u) => {
    if (!window.confirm("¿Inactivar usuario?")) return;

    try {
      await api.delete(`${base}${u.id}/`);
      fetchUsers();
    } catch (err) {
      console.error("Error al inactivar:", err);
      alert("Error al inactivar");
    }
  };

  // Filtrar usuarios según el texto de búsqueda
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <div className="flex gap-3">
          <button
            onClick={openCreate}
            className="px-4 py-2 btn-primary"
          >
            + Nuevo usuario
          </button>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 btn-secondary"
          >
            {loading ? "Cargando..." : "Refrescar"}
          </button>
        </div>
      </header>

      {/* Filtros de búsqueda */}
      <div className="mb-4 flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por usuario, correo o nombre"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 input-default"
          aria-label="Buscar usuarios"
        />
        <select
          value={rolFiltro}
          onChange={(e) => { setRolFiltro(e.target.value); setPage(1); }}
          className="input-default"
        >
          <option value="">Todos los roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg p-4 shadow">
        <table className="w-full">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="py-2">ID</th>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="py-2">{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.nombre_completo || "—"}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-sm text-white ${
                    u.rol === "admin" ? "bg-red-600" :
                    u.rol === "empleado" ? "bg-blue-600" :
                    "bg-green-600"
                  }`}>
                    {u.rol}
                  </span>
                </td>
                <td className="py-2 flex gap-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="px-3 py-1 btn-primary text-sm"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => openView(u)}
                    className="px-3 py-1 btn-secondary text-sm"
                  >
                    👁️ Ver
                  </button>
                  <button
                    onClick={() => handleDeactivate(u)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        {totalCount > pageSize && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-slate-600">
              Mostrando {(page - 1) * pageSize + 1} -{" "}
              {Math.min(page * pageSize, totalCount)} de {totalCount} usuarios
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-slate-100 rounded disabled:opacity-50"
              >
                ← Anterior
              </button>
              <span className="px-3 py-1">Pág {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(totalCount / pageSize)}
                className="px-3 py-1 bg-slate-100 rounded disabled:opacity-50"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para ver usuario */}
      {viewModal && selectedUser && (
        <Modal
          open={viewModal}
          title={`Datos de ${selectedUser.username}`}
          onClose={() => setViewModal(false)}
          footer={null}
        >
          <div>
            <p>
              <strong>Nombre completo:</strong> {selectedUser.nombre_completo}
            </p>
            <p>
              <strong>Correo:</strong> {selectedUser.email}
            </p>
            <p>
              <strong>Teléfono:</strong> {selectedUser.telefono}
            </p>
            <p>
              <strong>Dirección:</strong> {selectedUser.direccion}
            </p>
            <p>
              <strong>Rol:</strong> {selectedUser.rol}
            </p>
          </div>
        </Modal>
      )}

      {/* Modal para crear/editar usuario */}
      <Modal
        open={openModal}
        title={editing ? "Editar Usuario" : "Crear Usuario"}
        onClose={() => setOpenModal(false)}
        footer={null}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Usuario"
            className="input-default"
            required
            aria-label="Usuario"
          />

          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Correo"
            type="email"
            className="input-default"
            required
            aria-label="Correo"
          />

          <input
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Contraseña"
            type="password"
            className="input-default"
            {...(!editing ? { required: true } : {})}
            aria-label="Contraseña"
          />

          <input
            value={form.nombre_completo}
            onChange={(e) =>
              setForm({ ...form, nombre_completo: e.target.value })
            }
            placeholder="Nombre completo"
            className="input-default"
            aria-label="Nombre completo"
          />

          <input
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="Teléfono"
            className="input-default"
            aria-label="Teléfono"
          />

          <input
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            placeholder="Dirección"
            className="input-default"
            aria-label="Dirección"
          />

          <select
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
            className="input-default"
          >
            <option value="cliente">Cliente</option>
            <option value="empleado">Empleado</option>
            <option value="admin">Administrador</option>
          </select>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setOpenModal(false)}
              type="button"
              className="btn-secondary px-4 py-2"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary px-4 py-2"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

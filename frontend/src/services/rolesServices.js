import api from "./api.js";

export const obtenerRoles = async () => {
  const res = await api.get("usuarios/roles/");
  return res.data;
};

export const crearRol = async (data) => {
  const res = await api.post("usuarios/roles/", data);
  return res.data;
};

export const actualizarRol = async (id, data) => {
  const res = await api.patch(`usuarios/roles/${id}/`, data);
  return res.data;
};

export const eliminarRol = async (id) => {
  await api.delete(`usuarios/roles/${id}/`);
};

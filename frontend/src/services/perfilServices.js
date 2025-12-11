import API from "./api";

export const obtenerPerfil = async () => {
  try {
    const res = await API.get("/usuarios/perfil/");
    console.log('✅ obtenerPerfil response:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    throw error;
  }
};

export const actualizarPerfil = async (id, datos) => {
  try {
    const res = await API.put(`/usuarios/editar-usuario/${id}/`, datos);
    console.log('✅ actualizarPerfil response:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    throw error;
  }
};
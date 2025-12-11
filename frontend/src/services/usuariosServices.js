import API from "./api.js";
import httpUtils from "./httpUtils";

export const obtenerUsuarios = async () => {
  return await httpUtils.fetchWithRetry(() => API.get("usuarios/")).then(r => r.data);
};

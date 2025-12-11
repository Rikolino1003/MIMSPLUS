import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

export const DrogueriaContext = createContext();

export const DrogueriaProvider = ({ children }) => {
  const [drogueriaActiva, setDrogueriaActiva] = useState(null);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [droguerias, setDroguerias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const conversacionRef = useRef(null);

  // Cargar droguería activa desde localStorage al montar
  useEffect(() => {
    const drogueriaGuardada = localStorage.getItem("drogueriaActiva");
    if (drogueriaGuardada) {
      try {
        setDrogueriaActiva(JSON.parse(drogueriaGuardada));
      } catch (e) {
        console.error("Error al parsear droguería guardada", e);
      }
    }

    // Obtener usuario actual
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado));
      } catch (e) {
        console.error("Error al parsear usuario", e);
      }
    }
  }, []);

  // Cargar conversación de una droguería
  const cargarConversacion = useCallback(async (drogueriaId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.post(
        `http://localhost:8000/api/conversaciones/`,
        { drogueria: drogueriaId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setConversacionActiva(response.data);
      conversacionRef.current = response.data;
      setMensajes(response.data.mensajes || []);
    } catch (error) {
      console.error("Error al cargar conversación:", error);
    }
  }, []);

  // Cambiar droguería (SOLO ADMIN)
  const cambiarDrogueria = useCallback(async (drogueriaId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No hay token");
        return;
      }

      const response = await axios.post(
        `http://localhost:8000/api/droguerias/set_active/`,
        { drogueria: drogueriaId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.drogueria) {
        setDrogueriaActiva(response.data.drogueria);
        localStorage.setItem("drogueriaActiva", JSON.stringify(response.data.drogueria));
        
        // Cargar conversación y mensajes de la nueva droguería
        await cargarConversacion(drogueriaId);
      }
    } catch (error) {
      console.error("Error al cambiar droguería:", error);
    }
  }, [cargarConversacion]);

  // Enviar mensaje
  const enviarMensaje = useCallback(async (texto) => {
    if (!conversacionRef.current || !texto.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:8000/api/mensajes/`,
        {
          conversacion: conversacionRef.current.id,
          texto: texto,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMensajes((prev) => [...prev, response.data]);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  }, []);

  // Cargar todas las droguerías
  const cargarDroguerias = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8000/api/droguerias/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setDroguerias(response.data);
      return response.data;
    } catch (error) {
      console.error("Error al cargar droguerías:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar droguería activa del servidor (admin)
  const cargarDrogueriaActiva = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:8000/api/droguerias/get_active/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          validateStatus: () => true,
        }
      );

      if (response.status === 200 && response.data) {
        setDrogueriaActiva(response.data);
        localStorage.setItem("drogueriaActiva", JSON.stringify(response.data));
        await cargarConversacion(response.data.id);
      } else {
        // Si no hay droguería activa, usar localStorage si existe
        const savedDrogueria = localStorage.getItem("drogueriaActiva");
        if (savedDrogueria) {
          const d = JSON.parse(savedDrogueria);
          setDrogueriaActiva(d);
          await cargarConversacion(d.id);
        }
      }
    } catch (error) {
      console.error("Error al cargar droguería activa:", error);
    }
  }, [cargarConversacion]);

  const value = {
    drogueriaActiva,
    conversacionActiva,
    mensajes,
    droguerias,
    loading,
    usuario,
    cambiarDrogueria,
    cargarConversacion,
    enviarMensaje,
    cargarDroguerias,
    cargarDrogueriaActiva,
    setMensajes,
  };

  return (
    <DrogueriaContext.Provider value={value}>
      {children}
    </DrogueriaContext.Provider>
  );
};

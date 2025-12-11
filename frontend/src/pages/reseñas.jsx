// src/pages/Reseñas.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import "../styles/pages/resenas.css"; // moved and ascii-normalized file name

export default function Reseñas() {
  const [reseñas, setReseñas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [totalCount, setTotalCount] = useState(0);
  const [filtroRating, setFiltroRating] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [ordenamiento, setOrdenamiento] = useState("reciente");

  const apiUrl = "http://127.0.0.1:8000/api/mensajes/resenas/";

  useEffect(() => {
    obtenerReseñas();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => obtenerReseñas(), 300);
    return () => clearTimeout(t);
  }, [page, filtroRating, busqueda, ordenamiento]);

  const obtenerReseñas = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiUrl);
      let allReseñas = response.data || [];

      // Filtrar por búsqueda
      if (busqueda) {
        allReseñas = allReseñas.filter((r) =>
          r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          r.comentario.toLowerCase().includes(busqueda.toLowerCase())
        );
      }

      // Filtrar por rating
      if (filtroRating > 0) {
        allReseñas = allReseñas.filter((r) => r.calificacion >= filtroRating);
      }

      // Ordenar
      if (ordenamiento === "reciente") {
        allReseñas.sort((a, b) => new Date(b.id) - new Date(a.id));
      } else if (ordenamiento === "top-rating") {
        allReseñas.sort((a, b) => b.calificacion - a.calificacion);
      } else if (ordenamiento === "bajo-rating") {
        allReseñas.sort((a, b) => a.calificacion - b.calificacion);
      }

      setTotalCount(allReseñas.length);

      // Aplicar paginación
      const inicio = (page - 1) * pageSize;
      const fin = inicio + pageSize;
      setReseñas(allReseñas.slice(inicio, fin));
      setError(null);
    } catch (error) {
      console.error("❌ Error al cargar reseñas:", error);
      setError("No se pudieron cargar las reseñas. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && reseñas.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
          className="text-lg text-gray-600"
        >
          Cargando reseñas...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-50">
        <p className="text-red-600 text-lg font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="reseñas-page">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="reseñas-title"
      >
        Lo Que Dicen Nuestros Clientes
      </motion.h1>

      <p className="reseñas-subtitle">
        La satisfacción de nuestros clientes es nuestra mayor recompensa.
      </p>

      {/* Filtros y búsqueda */}
      <div className="max-w-6xl mx-auto px-4 mb-8 space-y-4">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre o comentario..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
          className="w-full px-4 py-2 border rounded-lg"
        />
        
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={filtroRating}
            onChange={(e) => { setFiltroRating(Number(e.target.value)); setPage(1); }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value={0}>Todas las calificaciones</option>
            <option value={5}>⭐⭐⭐⭐⭐ 5 estrellas</option>
            <option value={4}>⭐⭐⭐⭐ 4+ estrellas</option>
            <option value={3}>⭐⭐⭐ 3+ estrellas</option>
            <option value={2}>⭐⭐ 2+ estrellas</option>
            <option value={1}>⭐ 1+ estrellas</option>
          </select>

          <select
            value={ordenamiento}
            onChange={(e) => { setOrdenamiento(e.target.value); setPage(1); }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="reciente">Más reciente</option>
            <option value="top-rating">Mejor calificadas</option>
            <option value="bajo-rating">Menor calificadas</option>
          </select>

          <button
            onClick={() => { setBusqueda(""); setFiltroRating(0); setOrdenamiento("reciente"); setPage(1); }}
            className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Reset
          </button>
        </div>

        <div className="text-sm text-slate-600">
          Total: {totalCount} reseña{totalCount !== 1 ? "s" : ""}
          {filtroRating > 0 && ` - Filtrando por ${filtroRating}+ estrellas`}
        </div>
      </div>

      <div className="reseñas-grid">
        {reseñas.length > 0 ? (
          reseñas.map((reseña) => (
            <motion.div
              key={reseña.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="reseña-card"
            >
              <div className="quote-icon">“</div>
              
              <div className="stars-container">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={`star ${i < reseña.calificacion ? "" : "empty"}`}
                    fill={i < reseña.calificacion ? "currentColor" : "none"}
                    strokeWidth={2}
                  />
                ))}
              </div>

              <p className="reseña-text">{reseña.comentario}</p>

              <div className="client-info">
                <div className="client-avatar">
                  {reseña.nombre.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div className="client-name">{reseña.nombre}</div>
                  <div className="client-role">{reseña.rol || "Cliente"}</div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full py-8">
            No hay reseñas que coincidan con tu búsqueda.
          </p>
        )}
      </div>

      {/* Paginación */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="px-4 py-2">
            Página {page} de {Math.ceil(totalCount / pageSize)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(totalCount / pageSize)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      )}
      </div>
    );
  }
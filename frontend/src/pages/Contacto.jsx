import { useState, useRef } from "react";
import axios from "axios";

export default function Contacto() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [calificacion, setCalificacion] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimer = useRef(null);

  const validarEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!nombre.trim()) {
      setError("❌ Por favor ingresa tu nombre");
      return;
    }
    if (!correo.trim()) {
      setError("❌ Por favor ingresa tu correo");
      return;
    }
    if (!validarEmail(correo)) {
      setError("❌ Por favor ingresa un correo válido");
      return;
    }
    if (!asunto.trim()) {
      setError("❌ Por favor ingresa un asunto");
      return;
    }
    if (!mensaje.trim()) {
      setError("❌ Por favor ingresa tu mensaje");
      return;
    }
    if (mensaje.length < 10) {
      setError("❌ El mensaje debe tener al menos 10 caracteres");
      return;
    }
    if (calificacion === 0) {
      setError("❌ Por favor califica tu experiencia");
      return;
    }

    setEnviando(true);
    setExito(false);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("correo", correo);
      formData.append("asunto", asunto);
      formData.append("mensaje", mensaje);
      formData.append("calificacion", calificacion);

      await axios.post(
        "http://127.0.0.1:8000/api/mensajes/mensajes/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setExito(true);
      setNombre("");
      setCorreo("");
      setAsunto("");
      setMensaje("");
      setCalificacion(0);
      setError(null);
    } catch (err) {
      console.error("Error al enviar:", err);
      setError("❌ Hubo un problema al enviar tu mensaje. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="card mx-auto max-w-2xl my-12 p-6 font-sans">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Contáctanos
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="input-default"
            aria-label="Nombre"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Correo electrónico
          </label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            className="input-default"
            aria-label="Correo electrónico"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Asunto
          </label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            required
            className="input-default"
            aria-label="Asunto"
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Mensaje
          </label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            required
            rows="5"
            className="input-default resize-vertical"
            aria-label="Mensaje"
          />
        </div>

        {/* Calificación con estrellas */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              color: "#333",
            }}
          >
            Calificación
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setCalificacion(star)}
                style={{
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: star <= calificacion ? "#FFD700" : "#ccc",
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="btn-primary w-full"
          aria-label="Enviar mensaje"
        >
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </form>

      {exito && (
        <p
          style={{
            color: "green",
            marginTop: "1rem",
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          ✅ Mensaje enviado correctamente.
        </p>
      )}
      {error && (
        <p
          style={{
            color: "red",
            marginTop: "1rem",
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          {error}
        </p>
      )}

      <div className="mt-6 p-4 bg-slate-50 rounded-lg shadow-sm">
        <h3 style={{ marginBottom: "1rem", color: "#333", fontWeight: "600" }}>Información de Contacto</h3>
        <p style={{ marginBottom: "0.5rem", color: "#555" }}>
          <strong>Dirección:</strong> Av. Principal 123, Centro Comercial Plaza, Quito, Ecuador
        </p>
        <p style={{ marginBottom: "0.5rem", color: "#555" }}>
          <strong>Teléfono:</strong> +593 2 123 4567, +593 99 999 9999
        </p>
        <p style={{ marginBottom: "0.5rem", color: "#555" }}>
          <strong>Email:</strong>
          <span className="ml-2">
            <a href="mailto:info@farmacia.com" className="text-blue-600 hover:underline">info@farmacia.com</a>
            {" | "}
            <a href="mailto:ventas@farmacia.com" className="text-blue-600 hover:underline">ventas@farmacia.com</a>
          </span>
        </p>
        <p style={{ marginBottom: "0.5rem", color: "#555" }}>
          <strong>Horario de Atención:</strong>
          <br />
          Lunes a Viernes: 8:00 AM - 8:00 PM
          <br />
          Sábados: 9:00 AM - 6:00 PM
          <br />
          Domingos: 10:00 AM - 2:00 PM
        </p>

        {/* CTA rápido al final: llamar / enviar correo / ver mapa */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
            <a href="tel:+573201234567" className="btn-primary">Llamar</a>
            <a href="mailto:info@farmacia.com?subject=Consulta%20desde%20sitio" className="btn-primary bg-green-600 hover:bg-green-700">Enviar correo</a>
            <a target="_blank" rel="noreferrer" href="https://www.google.com/maps/search/?api=1&query=Av.+Principal+123" className="btn-secondary">Ver en mapa</a>
        </div>
      </div>

      {/* Sección de documentos de soporte */}
      <div className="mt-12 border-t pt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Documentos de Soporte</h3>
        <p className="text-gray-600 mb-4">Descarga nuestros manuales y guías:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Botón de Manual de Usuario */}
          <a 
            href="/api/documentos/manual-usuario.pdf" 
            download="Manual-de-Usuario-MIMS.pdf" 
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar Manual de Usuario
          </a>
          
          {/* Botón de Guía de Soporte */}
          <a 
            href="/api/documentos/guia-soporte.pdf" 
            download="Guia-de-Soporte-MIMS.pdf" 
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Guía de Soporte Técnico
          </a>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          ¿Neitas ayuda con algún documento? Contáctanos y con gusto te ayudaremos.
        </p>
      </div>
    </div>
  );
}

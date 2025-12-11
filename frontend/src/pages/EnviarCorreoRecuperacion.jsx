import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function EnviarCorreoRecuperacion() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validarEmail = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!validarEmail(email)) {
      setError("Ingresa un correo válido como ejemplo@dominio.com");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:8000/api/usuarios/recuperar/",
        { email },
        { headers: { "Content-Type": "application/json" } }
      );

      setMensaje(
        res.data.mensaje ||
          `Se ha enviado un código de recuperación a ${email}. Por favor revisa tu bandeja de entrada.`
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo enviar el correo de recuperación."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-teal-50">
      
      {/* Card */}
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-teal-200">
        
        {/* Encabezado */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm-4 4v4m0-4a4 4 0 100-8 4 4 0 000 8zm0-4H8m4 0h4"
              />
            </svg>
          </div>

          <h2 className="text-center text-2xl font-bold mt-4 text-teal-700">
            Recuperar contraseña
          </h2>
          <p className="text-gray-500 text-sm text-center mt-1">
            Ingresa tu correo para enviarte un código seguro.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="text-gray-700 text-sm font-semibold">
            Correo registrado
          </label>

          <input
            type="email"
            placeholder="ejemplo@correo.com"
            className="w-full px-4 py-2 border rounded-md bg-teal-50/40 focus:ring-2 focus:ring-teal-300 outline-none transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold shadow-md transition ${
              loading
                ? "bg-teal-300"
                : "bg-teal-600 hover:bg-teal-700"
            }`}
          >
            {loading ? "Enviando..." : "Enviar código de recuperación"}
          </button>
        </form>

        {/* Mensajes */}
        {mensaje && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <p className="text-green-800">{mensaje}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Volver */}
        <p
          onClick={() => navigate("/cambiar-contrasena")}
          className="text-center text-sm text-teal-700 mt-6 cursor-pointer hover:underline"
        >
          Ya tengo un código, cambiar contraseña
        </p>
      </div>
    </div>
  );
}

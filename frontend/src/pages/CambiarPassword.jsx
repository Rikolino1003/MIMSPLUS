import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function CambiarPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from location state or use empty string
  const initialEmail = location.state?.email || "";

  const [formData, setFormData] = useState({
    email: initialEmail,
    codigo: "",
    nueva_contrasena: "",
    confirmar_contrasena: "",
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  const evaluarFortaleza = (value) => {
    let puntos = 0;

    if (value.length >= 8) puntos += 25;
    if (/[A-Z]/.test(value)) puntos += 25;
    if (/[0-9]/.test(value)) puntos += 25;
    if (/[@$!%*?&#]/.test(value)) puntos += 25;

    setPasswordStrength(puntos);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setMensaje("");

    if (name === "nueva_contrasena") {
      evaluarFortaleza(value);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleResendCode = async () => {
    if (!canResend) return;
    
    try {
      setLoading(true);
      await axios.post(
        "http://localhost:8000/api/usuarios/recuperar/",
        { email: formData.email },
        { headers: { "Content-Type": "application/json" } }
      );
      
      setMensaje("Se ha enviado un nuevo código a tu correo.");
      setTimeLeft(300); // Reset timer to 5 minutes
      setCanResend(false);
    } catch (err) {
      setError("No se pudo reenviar el código. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // evita cualquier GET del navegador por defecto

    // Validaciones
    if (!formData.email.trim()) {
      setError("Por favor ingresa tu correo");
      return;
    }
    if (!formData.codigo.trim()) {
      setError("Por favor ingresa el código de recuperación");
      return;
    }
    if (formData.nueva_contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!/[A-Z]/.test(formData.nueva_contrasena)) {
      setError("La contraseña debe contener al menos una mayúscula");
      return;
    }
    if (!/[0-9]/.test(formData.nueva_contrasena)) {
      setError("La contraseña debe contener al menos un número");
      return;
    }
    if (formData.nueva_contrasena !== formData.confirmar_contrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      // Preparamos los datos exactamente como los espera el backend
      const requestData = {
        email: formData.email.trim(),
        codigo: formData.codigo.trim(),
        nueva_contrasena: formData.nueva_contrasena,
        confirmar_contrasena: formData.confirmar_contrasena,
      };

      console.log('Enviando datos al servidor:', JSON.stringify(requestData, null, 2));
      
      // Hacemos la petición POST
      const res = await axios.post(
        "http://localhost:8000/api/usuarios/cambiar-contrasena/",
        requestData, // No necesitamos JSON.stringify aquí, axios lo hace automáticamente
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
          },
          withCredentials: true
        }
      );

      console.log('Respuesta del servidor:', res.data);
      
      setMensaje(res.data.mensaje || "¡Contraseña actualizada correctamente! Redirigiendo al inicio de sesión...");
      setError("");

      // Redirigir después de 2 segundos
      setTimeout(() => {
        // Limpiar el estado antes de redirigir
        setFormData({
          email: formData.email, // Mantenemos el email por si necesitan iniciar sesión
          codigo: "",
          nueva_contrasena: "",
          confirmar_contrasena: "",
        });
        navigate("/login", { 
          state: { 
            message: "Tu contraseña ha sido actualizada con éxito. Por favor inicia sesión con tu nueva contraseña." 
          } 
        });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo cambiar la contraseña. Verifica los datos."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-blue-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-xl border-t-4 border-blue-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">
            Cambiar contraseña
          </h2>
          {timeLeft > 0 && (
            <div className="text-sm text-gray-600">
              Código expira en: {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Correo registrado"
            value={formData.email}
            onChange={handleChange}
            required
            className="input-default"
            aria-label="Correo registrado"
          />

          <input
            type="text"
            name="codigo"
            placeholder="Código enviado al correo"
            value={formData.codigo}
            onChange={handleChange}
            required
            className="input-default"
            aria-label="Código de recuperación"
          />
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={!canResend || loading}
              className={`text-sm ${canResend ? 'text-blue-600 hover:underline' : 'text-gray-400'} ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {canResend ? 'Reenviar código' : 'Espera para reenviar'}
            </button>
          </div>

          <input
            type="password"
            name="nueva_contrasena"
            placeholder="Nueva contraseña"
            value={formData.nueva_contrasena}
            onChange={handleChange}
            required
            className="input-default"
            aria-label="Nueva contraseña"
          />

          {/* Barra de seguridad */}
          <div className="w-full bg-gray-200 h-2 rounded">
            <div
              className="h-full rounded"
              style={{
                width: `${passwordStrength}%`,
                backgroundColor:
                  passwordStrength < 50
                    ? "red"
                    : passwordStrength < 75
                    ? "orange"
                    : "green",
              }}
            ></div>
          </div>

          <input
            type="password"
            name="confirmar_contrasena"
            placeholder="Confirmar contraseña"
            value={formData.confirmar_contrasena}
            onChange={handleChange}
            required
            className="input-default"
            aria-label="Confirmar contraseña"
          />

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            aria-label="Cambiar contraseña"
          >
            {loading ? "Cambiando..." : "Cambiar contraseña"}
          </button>
        </form>

        {mensaje && (
          <p className="text-green-600 mt-4 text-center">{mensaje}</p>
        )}
        {error && <p className="text-red-600 mt-4 text-center">{error}</p>}

        <p
          onClick={() => navigate("/login")}
          className="text-center text-sm text-blue-600 mt-4 cursor-pointer hover:underline"
        >
          Volver al login
        </p>
      </div>
    </div>
  );
}
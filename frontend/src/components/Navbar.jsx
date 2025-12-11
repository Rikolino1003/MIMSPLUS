// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Pill, ShoppingCart } from "lucide-react";

export default function Navbar({ carrito = [], carritoOpen, setCarritoOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    // Guardar razón del cierre de sesión
    sessionStorage.setItem('logoutReason', 'success');
    
    // Limpiar datos de autenticación
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    
    // Redirigir al login
    navigate("/login");
  };

  // 🔴 Solo ocultar navbar en login y registro
  const ocultarEn = ["/login", "/registro"];
  if (ocultarEn.includes(location.pathname)) return null;

  const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);

  // Redirigir según rol
  const getPerfilPath = () => {
    switch (usuario.rol) {
      case "empleado":
        return "/panelempleado";
      case "admin":
        return "/paneladmin";
      default:
        return "/perfilcliente";
    }
  };

  return (
    <nav className="bg-blue-700 text-white px-8 py-4 flex justify-between items-center shadow-md sticky top-0 z-50">
      {/* Logo y nombre */}
      <div className="flex items-center gap-2 text-xl font-bold">
        <Pill size={24} className="text-pink-300" />
        Droguería MIMS
      </div>

      {/* Enlaces principales */}
      <div className="flex gap-6 text-sm font-medium">
        <Link to="/home" className="hover:text-blue-200 transition-colors">
          Inicio
        </Link>
        <Link to="/ofertas" className="hover:text-blue-200 transition">
          Ofertas
        </Link>
        <Link to="/acerca" className="hover:text-pink-200 transition">
          Acerca de Nosotros
        </Link>
        <Link to="/reseñas" className="hover:text-pink-200 transition">
          Reseñas
        </Link>
        <Link to="/contacto" className="hover:text-pink-200 transition">
          Contacto
        </Link>

        {/* Carrito */}
        <button
          onClick={() => setCarritoOpen(!carritoOpen)}
          className="flex items-center gap-1 hover:text-pink-200 transition relative"
          aria-label="Ver carrito de compras"
          title="Abrir carrito de compras"
        >
          <ShoppingCart size={20} />
          <span className="hidden sm:inline">Carrito</span>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>

        <Link to="/catalogo" className="hover:text-pink-200 transition">
          Catálogo
        </Link>

        {usuario.rol === "admin" && (
          <Link to="/mensajes" className="hover:text-pink-200 transition">
            Mensajes
          </Link>
        )}
      </div>

      {/* Avatar + Cerrar sesión */}
      <div className="flex items-center gap-3">
        {token ? (
          <>
            {/* Avatar: al hacer clic, va al perfil/panel */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => navigate(getPerfilPath())}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-blue-700 font-semibold text-sm hover:bg-blue-100 transition cursor-pointer"
                  aria-label="Ir a tu perfil"
                >
                  {usuario.nombre?.charAt(0).toUpperCase() || "U"}
                </button>
                {/* Indicador de rol */}
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  usuario.rol === 'admin' ? 'bg-red-500' : 
                  usuario.rol === 'empleado' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {usuario.rol === 'admin' ? 'A' : 
                   usuario.rol === 'empleado' ? 'E' : 'C'}
                </span>
              </div>
              <span className="text-sm font-medium hidden md:inline">
                {usuario.nombre?.split(' ')[0] || 'Usuario'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-primary bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded-lg text-white text-sm transition"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/login")}
              className="btn-secondary"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate("/registro")}
              className="btn-primary"
            >
              Registro
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
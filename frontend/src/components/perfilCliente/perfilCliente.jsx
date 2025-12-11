import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SidebarPerfil from "./sidebarPerfil";
import PerfilClienteContent from "./perfilClienteContent";
import { obtenerPerfil } from "../../services/perfilServices";
import { obtenerPedidosUsuario } from "../../services/pedidosService";
import "../../styles/pages/perfilCliente.css";

export default function PerfilCliente() {
  const [activeTab, setActiveTab] = useState("info");
  const [usuario, setUsuario] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  // Cargar datos del perfil, pedidos y facturas
  useEffect(() => {
    let isMounted = true;
    
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener perfil del usuario
        console.log('Obteniendo perfil del usuario...');
        const perfil = await obtenerPerfil();
        console.log('Perfil obtenido:', perfil);
        
        if (isMounted) {
          setUsuario(perfil);
        }
        
        // Obtener pedidos del usuario
        console.log('Obteniendo pedidos del usuario...');
        const listaPedidos = await obtenerPedidosUsuario();
        console.log('Pedidos obtenidos:', listaPedidos);
        
        if (isMounted) {
          setPedidos(Array.isArray(listaPedidos) ? listaPedidos : []);
        }
        
        // Si no hay facturas, usar los pedidos como facturas temporalmente
        // En una implementación real, deberías tener un endpoint específico para facturas
        if (isMounted) {
          setFacturas(Array.isArray(listaPedidos) ? listaPedidos : []);
        }
        
      } catch (err) {
        console.error("Error al cargar datos del perfil:", err);
        
        if (isMounted) {
          // Si es un error 404, mostrar un mensaje más amigable
          if (err.response?.status === 404) {
            setError("No se encontraron datos. Por favor, intente más tarde.");
          } else if (err.response?.status === 401) {
            // Redirigir a login si hay error de autenticación
            navigate("/login");
            return;
          } else {
            setError("Ocurrió un error al cargar los datos. Por favor, intente de nuevo.");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    cargarDatos();
    
    // Auto-actualizar pedidos cada 5 segundos
    intervalRef.current = setInterval(async () => {
      if (isMounted) {
        try {
          const listaPedidos = await obtenerPedidosUsuario();
          if (isMounted) {
            setPedidos(Array.isArray(listaPedidos) ? listaPedidos : []);
            setFacturas(Array.isArray(listaPedidos) ? listaPedidos : []);
          }
        } catch (err) {
          console.error("Error actualizando pedidos:", err);
        }
      }
    }, 5000);
    
    // Limpieza al desmontar el componente
    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [navigate]);

  // Función para formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="perfil-layout">
      <SidebarPerfil activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="perfil-main">
        <PerfilClienteContent
          usuario={usuario}
          pedidos={pedidos}
          facturas={facturas}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currencyFormatter={formatCurrency}
        />
      </main>
    </div>
  );
}
// src/components/Layout.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Cart from "./Cart.jsx";

export default function Layout({ carrito = [], carritoOpen, setCarritoOpen, agregarAlCarrito, reducirCantidad, eliminar, enviarPedido, estadisticasCarrito, setCarrito }) {
  const location = useLocation();

  // Rutas donde no debe mostrarse el menú ni el carrito
  const rutasOcultas = ["/login", "/registro", "/404", "/error", "/recuperar"];
  const ocultarMenu = rutasOcultas.includes(location.pathname);
  
  // Mostrar carrito solo si el usuario está autenticado y no está en una ruta oculta
  const mostrarCarrito = !ocultarMenu && localStorage.getItem("token");

  return (
    <>
      {!ocultarMenu && (
        <Navbar
          carrito={carrito}
          carritoOpen={carritoOpen}
          setCarritoOpen={setCarritoOpen}
        />
      )}
      {/* Cart global - solo visible en rutas permitidas */}
      {mostrarCarrito && (
        <Cart
          carrito={carrito}
          carritoOpen={carritoOpen}
          setCarritoOpen={setCarritoOpen}
          agregarAlCarrito={agregarAlCarrito}
          reducirCantidad={reducirCantidad}
          eliminar={eliminar}
          enviarPedido={enviarPedido}
          estadisticasCarrito={estadisticasCarrito}
          setCarrito={setCarrito}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </>
  );
}
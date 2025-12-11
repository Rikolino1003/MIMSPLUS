import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Award, Users, Heart, Zap, Globe, Target } from "lucide-react";

export default function Acerca() {
  const [expandedSection, setExpandedSection] = useState("quienes-somos");

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const valores = [
    {
      icon: <Heart size={32} className="text-red-500" />,
      titulo: "Compromiso",
      descripcion: "Con la salud y calidad de vida de nuestros clientes",
    },
    {
      icon: <Award size={32} className="text-blue-500" />,
      titulo: "Calidad",
      descripcion: "Productos verificados y certificados internacionalmente",
    },
    {
      icon: <Zap size={32} className="text-yellow-500" />,
      titulo: "Eficiencia",
      descripcion: "Atención rápida y entregas oportunas en todos los pedidos",
    },
    {
      icon: <Globe size={32} className="text-green-500" />,
      titulo: "Responsabilidad",
      descripcion: "Social y ambiental en cada una de nuestras operaciones",
    },
  ];

  const hitos = [
    {
      año: "2015",
      evento: "Fundación",
      descripcion: "Inicio de operaciones en Bogotá con visión de expansión",
    },
    {
      año: "2017",
      evento: "Crecimiento",
      descripcion: "Apertura de sucursales en principales ciudades",
    },
    {
      año: "2020",
      evento: "Transformación Digital",
      descripcion: "Lanzamiento de plataforma e-commerce",
    },
    {
      año: "2023",
      evento: "Innovación",
      descripcion: "Sistema MIMS de gestión y seguimiento en tiempo real",
    },
    {
      año: "2025",
      evento: "Presente",
      descripcion: "Líder en la distribución de medicamentos",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-10 px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-4">
          Acerca de MIMS
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Una empresa comprometida con la salud, la calidad y la excelencia en el servicio
        </p>
      </motion.div>

      {/* Secciones expandibles */}
      <div className="max-w-4xl mx-auto space-y-4 mb-12">
        {/* Quiénes Somos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md border border-blue-100"
        >
          <button
            onClick={() => toggleSection("quienes-somos")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition"
          >
            <h2 className="text-xl font-semibold text-blue-600">¿Quiénes Somos?</h2>
            <ChevronDown
              size={24}
              className={`text-blue-600 transition-transform ${
                expandedSection === "quienes-somos" ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSection === "quienes-somos" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-4 text-gray-700 leading-relaxed"
            >
              <p className="mb-4">
                En <strong>Droguería MIMS</strong> trabajamos día a día para ofrecerte los mejores
                productos farmacéuticos, naturales y de cuidado personal. Somos una empresa
                colombiana con presencia nacional, comprometida con la salud y el bienestar de
                millones de familias.
              </p>
              <p className="mb-4">
                Nuestra experiencia de más de 10 años en el mercado nos ha permitido consolidarnos
                como líderes en la distribución farmacéutica, con un portafolio de más de 5,000
                productos de las mejores marcas internacionales y nacionales.
              </p>
              <p>
                Contamos con un equipo profesional dedicado a garantizar la calidad, disponibilidad
                y accesibilidad de los medicamentos que necesitas para cuidar tu salud.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Misión */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md border border-green-100"
        >
          <button
            onClick={() => toggleSection("mision")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-green-50 transition"
          >
            <h2 className="text-xl font-semibold text-green-600 flex items-center gap-2">
              <Target size={24} /> Nuestra Misión
            </h2>
            <ChevronDown
              size={24}
              className={`text-green-600 transition-transform ${
                expandedSection === "mision" ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSection === "mision" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-4 text-gray-700 leading-relaxed"
            >
              <p className="text-lg font-semibold text-green-700 mb-2">
                Promover el bienestar integral de nuestros clientes mediante la distribución confiable
                de productos farmacéuticos de calidad, con un servicio humanizado y tecnológicamente
                innovador.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Visión */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md border border-purple-100"
        >
          <button
            onClick={() => toggleSection("vision")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-50 transition"
          >
            <h2 className="text-xl font-semibold text-purple-600 flex items-center gap-2">
              <Zap size={24} /> Nuestra Visión
            </h2>
            <ChevronDown
              size={24}
              className={`text-purple-600 transition-transform ${
                expandedSection === "vision" ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedSection === "vision" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-4 text-gray-700 leading-relaxed"
            >
              <p className="text-lg font-semibold text-purple-700 mb-2">
                Ser la drogería líder en Colombia, reconocida por nuestra excelencia operativa, 
                innovación tecnológica y compromiso con la accesibilidad de medicamentos de calidad 
                para todos.
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Valores - Grid */}
      <div className="max-w-6xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-800">Nuestros Valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {valores.map((valor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition text-center"
            >
              <div className="flex justify-center mb-4">{valor.icon}</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{valor.titulo}</h3>
              <p className="text-gray-600 text-sm">{valor.descripcion}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-800">Nuestro Recorrido</h2>
        <div className="space-y-6">
          {hitos.map((hito, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={`flex ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"} items-center gap-6`}
            >
              <div className="flex-1">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg p-6">
                  <div className="text-sm font-semibold text-blue-100">📅 {hito.año}</div>
                  <h3 className="text-xl font-bold mt-2">{hito.evento}</h3>
                  <p className="text-blue-50 mt-2">{hito.descripcion}</p>
                </div>
              </div>
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full border-4 border-white"></div>
              <div className="flex-1"></div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center py-12"
      >
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          ¿Quieres conocer más sobre nosotros?
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Contáctanos y descubre cómo podemos ayudarte con tus necesidades de salud y bienestar.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition font-semibold">
            Contáctanos
          </button>
          <button className="px-8 py-3 bg-white border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-semibold">
            Ver Catálogo
          </button>
        </div>
      </motion.div>
    </div>
  );
}

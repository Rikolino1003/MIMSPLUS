import React from 'react';
import { Link } from 'react-router-dom';

const Ofertas = () => {
  const maintenancePlans = [
    {
      id: 1,
      name: 'Plan Básico',
      price: '49.99',
      period: 'mensual',
      features: [
        'Mantenimiento preventivo mensual',
        'Revisión de sistemas',
        'Limpieza general',
        'Soporte por correo electrónico',
        'Respuesta en 24-48 horas'
      ],
      popular: false
    },
    {
      id: 2,
      name: 'Plan Profesional',
      price: '99.99',
      period: 'mensual',
      features: [
        'Todo lo del Plan Básico',
        'Mantenimiento preventivo quincenal',
        'Soporte telefónico prioritario',
        'Respuesta en 12-24 horas',
        'Descuento en repuestos (10%)',
        'Informe de diagnóstico mensual'
      ],
      popular: true
    },
    {
      id: 3,
      name: 'Plan Empresarial',
      price: '199.99',
      period: 'mensual',
      features: [
        'Todo lo del Plan Profesional',
        'Mantenimiento preventivo semanal',
        'Soporte 24/7',
        'Respuesta en menos de 4 horas',
        'Descuento en repuestos (20%)',
        'Informe detallado semanal',
        'Visita de emergencia incluida (1/mes)'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-6">
            Planes de Mantenimiento
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Mantén tus equipos en óptimas condiciones con nuestros planes de mantenimiento preventivo.
            Elige el que mejor se adapte a tus necesidades.
          </p>
        </div>

        {/* Special Offer Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8 mb-16 text-center shadow-lg transform hover:scale-101 transition-transform duration-300">
          <h2 className="text-3xl font-bold mb-3">¡Oferta Especial de Lanzamiento!</h2>
          <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
            Contrata cualquiera de nuestros planes anuales y obtén 2 meses GRATIS. 
            Aprovecha esta oferta por tiempo limitado.
          </p>
          <Link
            to="/contacto"
            className="inline-block bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 hover:shadow-md transition-all duration-300 text-lg"
          >
            ¡Solicita tu Oferta Especial!
          </Link>
        </div>

        {/* Pricing Plans */}
        <div className="grid gap-8 md:grid-cols-3 lg:gap-8">
          {maintenancePlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular
                  ? 'ring-2 ring-blue-500 transform scale-105 z-10 shadow-xl'
                  : 'border-2 border-blue-100 shadow-md hover:shadow-lg transition-all duration-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  MÁS POPULAR
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-blue-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-extrabold text-blue-800">${plan.price}</span>
                  <span className="ml-2 text-blue-600">/{plan.period}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent my-6"></div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contacto"
                  className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
                      : 'bg-white text-blue-700 hover:bg-blue-50 border-2 border-blue-200'
                  }`}
                >
                  Contratar Ahora
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Services */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Servicios Adicionales</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Mantenimiento Predictivo',
                description: 'Monitoreo avanzado para anticipar y prevenir fallas antes de que ocurran.'
              },
              {
                title: 'Actualizaciones de Software',
                description: 'Mantén tus sistemas actualizados con las últimas versiones y parches de seguridad.'
              },
              {
                title: 'Capacitación',
                description: 'Entrenamiento para tu personal en el uso y mantenimiento de los equipos.'
              },
              {
                title: 'Monitoreo Remoto',
                description: 'Vigilancia 24/7 de tus equipos para prevenir fallas antes de que ocurran.'
              },
              {
                title: 'Respaldo de Datos',
                description: 'Servicios de copia de seguridad para proteger tu información crítica.'
              },
              {
                title: 'Consultoría Especializada',
                description: 'Asesoramiento experto para optimizar el rendimiento de tus equipos.'
              }
            ].map((service, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-4">¿Neitas un plan personalizado?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Nuestros expertos pueden crear un plan de mantenimiento a medida para satisfacer las necesidades específicas de tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/contacto"
              className="bg-white text-blue-700 font-semibold px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Solicitar Cotización
            </Link>
            <a
              href="tel:+1234567890"
              className="bg-transparent border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Llamar Ahora
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ofertas;

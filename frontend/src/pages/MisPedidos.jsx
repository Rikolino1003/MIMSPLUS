import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Loader2, CheckCircle, XCircle, Clock, 
  Truck, CheckCircle2, RefreshCw, Package, Search, Calendar
} from 'lucide-react';
import { getMisPedidos } from '../services/pedidosService';

const MisPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener lista de pedidos del usuario
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true);
        const data = await getMisPedidos();
        setPedidos(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar los pedidos:', err);
        setError('No se pudieron cargar los pedidos. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  // Filtrar pedidos por término de búsqueda
  const filteredPedidos = pedidos.filter(pedido => 
    pedido.id.toString().includes(searchTerm) ||
    pedido.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.fecha_creacion.includes(searchTerm)
  );

  // Obtener información del estado
  const getStatusInfo = (status) => {
    const estados = {
      'pendiente': { 
        label: 'Pendiente', 
        icon: <Clock className="w-4 h-4 text-yellow-500" />, 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800'
      },
      'procesado': { 
        label: 'En Proceso', 
        icon: <RefreshCw className="w-4 h-4 text-blue-500" />, 
        bg: 'bg-blue-100', 
        text: 'text-blue-800'
      },
      'en_camino': { 
        label: 'En Camino', 
        icon: <Truck className="w-4 h-4 text-indigo-500" />, 
        bg: 'bg-indigo-100', 
        text: 'text-indigo-800'
      },
      'entregado': { 
        label: 'Entregado', 
        icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, 
        bg: 'bg-green-100', 
        text: 'text-green-800'
      },
      'completado': { 
        label: 'Completado', 
        icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, 
        bg: 'bg-green-50', 
        text: 'text-green-700'
      },
      'cancelado': { 
        label: 'Cancelado', 
        icon: <XCircle className="w-4 h-4 text-red-500" />, 
        bg: 'bg-red-100', 
        text: 'text-red-800'
      }
    };
    
    return estados[status] || { 
      label: status, 
      icon: <Package className="w-4 h-4 text-gray-500" />, 
      bg: 'bg-gray-100', 
      text: 'text-gray-800'
    };
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(price || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link 
          to="/mi-cuenta" 
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver a mi cuenta
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
          <div className="mt-4 md:mt-0 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar pedidos..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : null}

        {filteredPedidos.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'No se encontraron pedidos que coincidan con la búsqueda.' : 'Aún no has realizado ningún pedido.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Link
                    to="/productos"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Ver productos
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredPedidos.map((pedido) => {
                const statusInfo = getStatusInfo(pedido.estado);
                const total = pedido.productos?.reduce((sum, item) => sum + (item.precio * item.cantidad), 0) || 0;
                
                return (
                  <li key={pedido.id}>
                    <Link 
                      to={`/mis-pedidos/${pedido.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            Pedido #{pedido.id}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                              {statusInfo.icon}
                              <span className="ml-1">{statusInfo.label}</span>
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {formatDate(pedido.fecha_creacion)}
                            </p>
                            {pedido.fecha_entrega_estimada && (
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <Truck className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                Entrega: {formatDate(pedido.fecha_entrega_estimada)}
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p className="font-medium text-gray-900">
                              {formatPrice(total)}
                            </p>
                            <p className="ml-1">• {pedido.productos?.length || 0} {pedido.productos?.length === 1 ? 'producto' : 'productos'}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisPedidos;

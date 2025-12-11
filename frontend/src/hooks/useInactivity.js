import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUsuario } from '../services/api.js';

/**
 * Hook para detectar inactividad del usuario y cerrar sesión automáticamente
 * @param {number} timeout - Tiempo en milisegundos antes de cerrar sesión (default: 15000 = 15 segundos)
 * @param {boolean} enabled - Si está habilitado el detector de inactividad
 */
export const useInactivity = (timeout = 15000, enabled = true) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const enabledRef = useRef(enabled);
  const timeoutRefValue = useRef(timeout);

  // Actualizar refs cuando cambian los valores
  useEffect(() => {
    enabledRef.current = enabled;
    timeoutRefValue.current = timeout;
  }, [enabled, timeout]);

  const resetTimer = useCallback(() => {
    if (!enabledRef.current) return;
    
    lastActivityRef.current = Date.now();
    
    // Limpiar timer anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Crear nuevo timer
    timeoutRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      // Solo cerrar si realmente pasó el tiempo sin actividad
      if (timeSinceLastActivity >= timeoutRefValue.current) {
        // Guardar flag de inactividad antes de cerrar sesión
        sessionStorage.setItem('logoutReason', 'inactivity');
        
        logoutUsuario();
        navigate('/login', { 
          state: { 
            message: 'Tu sesión se cerró por inactividad. Por favor, inicia sesión nuevamente.' 
          } 
        });
      }
    }, timeoutRefValue.current);
  }, [navigate]);

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Eventos que indican actividad del usuario
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown'
    ];

    // Inicializar timer
    resetTimer();

    // Agregar listeners de eventos
    events.forEach(event => {
      window.addEventListener(event, resetTimer, true);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [timeout, enabled, resetTimer]);

  return { resetTimer };
};


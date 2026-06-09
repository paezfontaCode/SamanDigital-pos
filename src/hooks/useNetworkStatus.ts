'use client';

import { useEffect, useState } from 'react';

/**
 * Hook para detectar el estado de conexión a la red
 * Útil para aplicaciones LAN que funcionan sin internet
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isLAN, setIsLAN] = useState<boolean>(false);

  useEffect(() => {
    // Verificar estado inicial
    updateNetworkStatus();

    // Escuchar eventos de cambio de conexión
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar periódicamente si estamos en LAN
    const interval = setInterval(checkLANStatus, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updateNetworkStatus = () => {
    setIsOnline(navigator.onLine);
    
    // Detectar si estamos en red local
    const hostname = window.location.hostname;
    const isLocalIP = 
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.');
    
    setIsLAN(isLocalIP);
  };

  const handleOnline = () => {
    setIsOnline(true);
    updateNetworkStatus();
  };

  const handleOffline = () => {
    setIsOnline(false);
  };

  const checkLANStatus = () => {
    // Intentar hacer fetch al propio servidor para verificar conectividad LAN
    fetch(window.location.origin, { 
      method: 'HEAD',
      cache: 'no-cache'
    })
      .then(() => {
        setIsLAN(true);
      })
      .catch(() => {
        // Si falla, podríamos estar offline pero aún en LAN
        // No cambiamos el estado LAN automáticamente
      });
  };

  return { isOnline, isLAN };
}

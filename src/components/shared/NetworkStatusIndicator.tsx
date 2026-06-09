'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Componente que muestra el estado de la conexión de red
 * Se recomienda colocar en el header o barra de estado de la aplicación
 */
export function NetworkStatusIndicator() {
  const { isOnline, isLAN } = useNetworkStatus();

  // No mostrar si estamos online y en LAN (estado normal)
  if (isOnline && isLAN) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg bg-white border">
      {/* Indicador de estado */}
      <span
        className={`w-3 h-3 rounded-full ${
          isLAN ? 'bg-green-500' : 'bg-yellow-500'
        }`}
      />
      
      {/* Mensaje */}
      <span className="text-sm font-medium text-gray-700">
        {isLAN && !isOnline && 'Modo sin conexión - Funcionalidad local activa'}
        {!isLAN && 'Verificando conexión...'}
      </span>
    </div>
  );
}

/**
 * Versión simplificada como badge para incluir en headers
 */
export function NetworkStatusBadge() {
  const { isOnline, isLAN } = useNetworkStatus();

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
      title={
        isLAN && isOnline
          ? 'Conectado a red local'
          : isLAN && !isOnline
          ? 'Modo sin conexión'
          : 'Verificando conexión'
      }
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isLAN && isOnline
            ? 'bg-green-500'
            : isLAN && !isOnline
            ? 'bg-yellow-500'
            : 'bg-gray-400'
        }`}
      />
      <span className="hidden sm:inline text-gray-600">
        {isLAN && isOnline
          ? 'LAN'
          : isLAN && !isOnline
          ? 'Offline'
          : 'Conectando...'}
      </span>
    </div>
  );
}

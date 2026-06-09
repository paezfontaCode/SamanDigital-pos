'use client';

import React from 'react';

interface PrintWrapperProps {
  children: React.ReactNode;
  format?: 'thermal-80mm' | 'thermal-58mm' | 'a4';
  className?: string;
}

/**
 * Componente wrapper para impresión térmica y formatos personalizados
 * 
 * @param format - Tipo de formato de impresión:
 *   - 'thermal-80mm': Impresora térmica estándar (80mm de ancho)
 *   - 'thermal-58mm': Impresora térmica pequeña (58mm de ancho)
 *   - 'a4': Formato carta/A4 estándar
 */
export function PrintWrapper({ 
  children, 
  format = 'thermal-80mm',
  className = ''
}: PrintWrapperProps) {
  const formatClass = {
    'thermal-80mm': 'print-thermal-80mm',
    'thermal-58mm': 'print-thermal-58mm',
    'a4': 'print-a4'
  }[format];

  return (
    <div className={`print-area ${formatClass} ${className}`}>
      {children}
    </div>
  );
}

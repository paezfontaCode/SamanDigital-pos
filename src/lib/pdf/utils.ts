/**
 * Utilidades para generación de PDFs
 */
import { pdf } from '@react-pdf/renderer';
import { DocumentProps } from '@react-pdf/types';

/**
 * Genera un blob PDF desde un documento React
 */
export const generatePdfBlob = async (document: React.ReactElement<DocumentProps>): Promise<Blob> => {
  const blob = await pdf(document).toBlob();
  return blob;
};

/**
 * Descarga un PDF con el nombre especificado
 */
export const downloadPdf = async (
  document: React.ReactElement<DocumentProps>,
  filename: string
): Promise<void> => {
  const blob = await generatePdfBlob(document);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Imprime un PDF directamente
 */
export const printPdf = async (document: React.ReactElement<DocumentProps>): Promise<void> => {
  const blob = await generatePdfBlob(document);
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

/**
 * Obtiene datos del negocio desde localStorage o config
 */
export const getBusinessInfo = (): {
  name: string;
  address: string;
  phone: string;
  rif: string;
} => {
  const defaultInfo = {
    name: 'Mi Negocio',
    address: 'Dirección del negocio',
    phone: '0000-0000000',
    rif: 'J-00000000-0',
  };

  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('business_info');
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (error) {
    console.error('Error getting business info:', error);
  }

  return defaultInfo;
};

/**
 * Formatea una fecha para mostrar en PDFs
 */
export const formatDateForPdf = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formatea la hora para mostrar en PDFs
 */
export const formatTimeForPdf = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Genera número correlativo para recibos
 */
export const generateReceiptNumber = (prefix: string, number: number): string => {
  const padded = String(number).padStart(6, '0');
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  return `${prefix}-${dateStr}-${padded}`;
};

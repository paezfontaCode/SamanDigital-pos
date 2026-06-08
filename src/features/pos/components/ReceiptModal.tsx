'use client';

import { useState } from 'react';
import { X, Printer } from 'lucide-react';

interface SaleData {
  number: string;
  total: number;
  items: any[];
  customer?: { name: string };
  paymentMethod: string;
  createdAt: string;
}

interface ReceiptModalProps {
  sale: SaleData | null;
  onClose: () => void;
  onPrint: () => void;
}

export default function ReceiptModal({ sale, onClose, onPrint }: ReceiptModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
    onPrint();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900 print:shadow-none">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between no-print">
          <h2 className="text-xl font-bold">Recibo de Venta</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido del recibo */}
        <div className="space-y-4">
          {/* Encabezado de la empresa */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold">Saman Digital</h1>
            <p className="text-sm text-muted-foreground">Reparación de Celulares y Accesorios</p>
          </div>

          {/* Información de la venta */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Número:</span>
              <span className="font-medium">{sale.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span>{new Date(sale.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hora:</span>
              <span>{new Date(sale.createdAt).toLocaleTimeString('es-ES')}</span>
            </div>
            {sale.customer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span>{sale.customer.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Método de Pago:</span>
              <span>
                {sale.paymentMethod === 'CASH' && 'Efectivo'}
                {sale.paymentMethod === 'CARD' && 'Tarjeta'}
                {sale.paymentMethod === 'TRANSFER' && 'Transferencia'}
                {sale.paymentMethod === 'CREDIT' && 'Crédito'}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="border-t pt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-center">Cant.</th>
                  <th className="pb-2 text-right">Precio</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="border-t">
                {sale.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2">{item.product.name}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                    <td className="py-2 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${sale.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Pie de página */}
          <div className="border-t pt-4 text-center text-xs text-muted-foreground">
            <p>¡Gracias por su compra!</p>
            <p>Este recibo es su comprobante de garantía</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}

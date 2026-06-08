'use client';

import { useState } from 'react';
import { Wallet, CreditCard, Banknote, HandCoins } from 'lucide-react';

interface PaymentSectionProps {
  total: number;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  amountReceived: number;
  onAmountReceivedChange: (amount: number) => void;
  onCompleteSale: () => void;
  isProcessing: boolean;
  customerCreditLimit?: number;
  customerDebt?: number;
}

export default function PaymentSection({
  total,
  paymentMethod,
  onPaymentMethodChange,
  amountReceived,
  onAmountReceivedChange,
  onCompleteSale,
  isProcessing,
  customerCreditLimit,
  customerDebt,
}: PaymentSectionProps) {
  const [partialPayment, setPartialPayment] = useState(false);

  const change = paymentMethod === 'CASH' && amountReceived >= total
    ? amountReceived - total
    : 0;

  const canComplete = () => {
    if (total <= 0) return false;
    
    if (paymentMethod === 'CASH') {
      if (partialPayment) {
        return amountReceived > 0 && amountReceived <= total;
      }
      return amountReceived >= total;
    }
    
    if (paymentMethod === 'CREDIT') {
      // Verificar límite de crédito
      if (customerCreditLimit && customerCreditLimit > 0) {
        const availableCredit = customerCreditLimit - (customerDebt || 0);
        return total <= availableCredit;
      }
      return true; // Si no hay límite, permitir crédito
    }
    
    return true; // CARD, TRANSFER, MIXED
  };

  const getCompleteButtonText = () => {
    if (!canComplete()) {
      if (paymentMethod === 'CASH' && !partialPayment && amountReceived < total) {
        return 'Ingrese monto recibido';
      }
      if (paymentMethod === 'CREDIT' && customerCreditLimit && customerCreditLimit > 0) {
        const availableCredit = customerCreditLimit - (customerDebt || 0);
        if (total > availableCredit) {
          return 'Excede límite de crédito';
        }
      }
    }
    return 'COMPLETAR VENTA';
  };

  return (
    <div className="space-y-4">
      {/* Método de pago */}
      <div>
        <label className="mb-2 block text-sm font-medium">Método de Pago</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onPaymentMethodChange('CASH')}
            className={`flex items-center justify-center gap-2 rounded-md border p-3 transition-colors ${
              paymentMethod === 'CASH'
                ? 'border-primary bg-primary/10 text-primary'
                : 'hover:bg-accent'
            }`}
          >
            <Banknote className="h-5 w-5" />
            <span>Efectivo</span>
          </button>
          
          <button
            onClick={() => onPaymentMethodChange('CARD')}
            className={`flex items-center justify-center gap-2 rounded-md border p-3 transition-colors ${
              paymentMethod === 'CARD'
                ? 'border-primary bg-primary/10 text-primary'
                : 'hover:bg-accent'
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span>Tarjeta</span>
          </button>
          
          <button
            onClick={() => onPaymentMethodChange('TRANSFER')}
            className={`flex items-center justify-center gap-2 rounded-md border p-3 transition-colors ${
              paymentMethod === 'TRANSFER'
                ? 'border-primary bg-primary/10 text-primary'
                : 'hover:bg-accent'
            }`}
          >
            <Wallet className="h-5 w-5" />
            <span>Transferencia</span>
          </button>
          
          <button
            onClick={() => onPaymentMethodChange('CREDIT')}
            className={`flex items-center justify-center gap-2 rounded-md border p-3 transition-colors ${
              paymentMethod === 'CREDIT'
                ? 'border-primary bg-primary/10 text-primary'
                : 'hover:bg-accent'
            }`}
          >
            <HandCoins className="h-5 w-5" />
            <span>Crédito</span>
          </button>
        </div>
      </div>

      {/* Monto recibido (solo para efectivo) */}
      {paymentMethod === 'CASH' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Monto Recibido</label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={partialPayment}
                onChange={(e) => setPartialPayment(e.target.checked)}
                className="rounded border-gray-300"
              />
              Pago parcial
            </label>
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amountReceived || ''}
            onChange={(e) => onAmountReceivedChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full rounded-md border border-input bg-background px-4 py-3 text-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          
          {/* Cambio */}
          {change > 0 && (
            <div className="rounded-md bg-green-50 p-3 dark:bg-green-950">
              <div className="text-sm text-green-800 dark:text-green-200">
                Cambio a devolver:
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${change.toFixed(2)}
              </div>
            </div>
          )}
          
          {/* Advertencia si el monto es insuficiente */}
          {!partialPayment && amountReceived > 0 && amountReceived < total && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
              El monto recibido es insuficiente. Faltan ${(total - amountReceived).toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Información de crédito */}
      {paymentMethod === 'CREDIT' && customerCreditLimit && customerCreditLimit > 0 && (
        <div className="rounded-md border bg-muted/50 p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Límite de crédito:</span>
            <span>${customerCreditLimit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Deuda actual:</span>
            <span className={customerDebt && customerDebt > 0 ? 'text-red-500' : ''}>
              ${(customerDebt || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Crédito disponible:</span>
            <span className={
              customerCreditLimit - (customerDebt || 0) < total ? 'text-red-500' : 'text-green-600'
            }>
              ${Math.max(0, customerCreditLimit - (customerDebt || 0)).toFixed(2)}
            </span>
          </div>
          {total > customerCreditLimit - (customerDebt || 0) && (
            <div className="text-xs text-red-500">
              ⚠️ Esta venta excede el crédito disponible del cliente
            </div>
          )}
        </div>
      )}

      {/* Botón completar venta */}
      <button
        onClick={onCompleteSale}
        disabled={!canComplete() || isProcessing}
        className={`w-full py-4 text-lg font-bold rounded-md transition-colors ${
          canComplete() && !isProcessing
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isProcessing ? 'Procesando...' : getCompleteButtonText()}
      </button>
      
      {/* Total a pagar */}
      <div className="text-center">
        <div className="text-sm text-muted-foreground">Total a Pagar</div>
        <div className="text-3xl font-bold text-primary">${total.toFixed(2)}</div>
      </div>
    </div>
  );
}

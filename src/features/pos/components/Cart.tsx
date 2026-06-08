'use client';

import { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';

interface CartItem {
  product: {
    id: string;
    name: string;
    sellPrice: number;
    stock: number;
  };
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  discount: number;
  onDiscountChange: (discount: number) => void;
}

export default function Cart({
  items,
  onRemoveItem,
  onUpdateQuantity,
  discount,
  onDiscountChange,
}: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="flex flex-col h-full">
      {/* Header del carrito */}
      <div className="border-b pb-3 mb-3">
        <h2 className="text-xl font-bold">Carrito de Venta</h2>
        <p className="text-sm text-muted-foreground">{items.length} productos</p>
      </div>

      {/* Lista de items */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {items.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>El carrito está vacío</p>
            <p className="text-sm">Agrega productos para comenzar la venta</p>
          </div>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onRemove={() => onRemoveItem(item.product.id)}
              onUpdateQuantity={(qty) => onUpdateQuantity(item.product.id, qty)}
            />
          ))
        )}
      </div>

      {/* Resumen y descuento */}
      <div className="border-t pt-3 mt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm items-center">
          <span className="text-muted-foreground">Descuento</span>
          <input
            type="number"
            min="0"
            max={subtotal}
            value={discount}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            className="w-24 rounded-md border border-input bg-background px-2 py-1 text-right text-sm"
          />
        </div>
        
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function CartItem({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      {/* Información del producto */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.product.name}</div>
        <div className="text-xs text-muted-foreground">
          ${item.product.sellPrice.toFixed(2)} c/u
        </div>
      </div>

      {/* Controles de cantidad */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => {
            if (item.quantity < item.product.stock) {
              onUpdateQuantity(item.quantity + 1);
            }
          }}
          disabled={item.quantity >= item.product.stock}
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-background hover:bg-accent disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Subtotal del item */}
      <div className="text-right w-20">
        <div className="font-bold text-sm">
          ${(item.product.sellPrice * item.quantity).toFixed(2)}
        </div>
      </div>

      {/* Botón eliminar */}
      <button
        onClick={onRemove}
        className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

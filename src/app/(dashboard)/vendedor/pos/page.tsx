/**
 * Página principal del POS (Punto de Venta)
 */
'use client';

import { useState, useEffect } from 'react';
import { getProducts, getProductCategories } from '@/server/actions/product.actions';
import { createSale, getCurrentCashRegister } from '@/server/actions/sale.actions';
import ProductSearch from '@/features/pos/components/ProductSearch';
import ProductGrid from '@/features/pos/components/ProductGrid';
import Cart from '@/features/pos/components/Cart';
import CustomerSelector from '@/features/pos/components/CustomerSelector';
import PaymentSection from '@/features/pos/components/PaymentSection';
import ReceiptModal from '@/features/pos/components/ReceiptModal';

interface CartItem {
  product: {
    id: string;
    name: string;
    sellPrice: number;
    stock: number;
  };
  quantity: number;
}

export default function POSPage() {
  // Estado de productos
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Estado del carrito
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  // Estado del cliente
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Estado del pago
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT'>('CASH');
  const [amountReceived, setAmountReceived] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estado del recibo
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any | null>(null);

  // Estado de la caja
  const [cashRegister, setCashRegister] = useState<any | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // Cargar productos disponibles
    const productsData = await getProducts({ page: 1, limit: 100, type: 'ACCESORIO', availability: 'in-stock' });
    setProducts(productsData.products.filter((p: any) => p.stock > 0));

    // Cargar categorías
    const categoriesData = await getProductCategories('ACCESORIO');
    setCategories(categoriesData);

    // Cargar caja abierta
    // En producción, obtener userId de la sesión
    const cashReg = await getCurrentCashRegister('user-id-placeholder');
    setCashRegister(cashReg);
  };

  // Agregar producto al carrito
  const handleAddToCart = (product: any) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('No hay más stock disponible');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Remover producto del carrito
  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Actualizar cantidad
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const product = cartItems.find((item) => item.product.id === productId)?.product;
    if (!product) return;

    if (quantity > product.stock) {
      alert('No hay más stock disponible');
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Calcular total
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  // Completar venta
  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setIsProcessing(true);

    try {
      // Preparar datos para la venta
      const saleData = {
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.sellPrice,
        })),
        customerId: selectedCustomer?.id,
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? amountReceived : total,
        discount,
        cashRegisterId: cashRegister?.id,
        userId: 'user-id-placeholder', // En producción, obtener de la sesión
      };

      const result = await createSale(saleData);

      if (result.success) {
        // Mostrar recibo
        setLastSale({
          number: result.data.number,
          total,
          items: cartItems.map((item) => ({
            product: { name: item.product.name },
            quantity: item.quantity,
            price: item.product.sellPrice,
          })),
          customer: selectedCustomer,
          paymentMethod,
          createdAt: new Date().toISOString(),
        });
        setShowReceipt(true);

        // Limpiar carrito
        setCartItems([]);
        setDiscount(0);
        setSelectedCustomer(null);
        setAmountReceived(0);
        setPaymentMethod('CASH');

        // Recargar productos
        loadInitialData();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error completando venta:', error);
      alert('Error al completar la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex">
      {/* Panel Izquierdo (60%) - Búsqueda y Productos */}
      <div className="w-[60%] border-r flex flex-col">
        {/* Header con búsqueda */}
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold mb-4">Punto de Venta</h1>
          <ProductSearch onProductSelect={handleAddToCart} type="ACCESORIO" />
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto p-4">
          <ProductGrid
            products={
              selectedCategory
                ? products.filter((p) => p.categoryId === selectedCategory)
                : products
            }
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            onProductClick={handleAddToCart}
          />
        </div>
      </div>

      {/* Panel Derecho (40%) - Carrito y Pago */}
      <div className="w-[40%] flex flex-col bg-card">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Selector de cliente */}
          <CustomerSelector
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setSelectedCustomer}
          />

          {/* Carrito */}
          <div className="border-t pt-4">
            <Cart
              items={cartItems}
              onRemoveItem={handleRemoveFromCart}
              onUpdateQuantity={handleUpdateQuantity}
              discount={discount}
              onDiscountChange={setDiscount}
            />
          </div>
        </div>

        {/* Sección de pago */}
        <div className="border-t p-4 bg-muted/30">
          <PaymentSection
            total={total}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={(method) => setPaymentMethod(method as any)}
            amountReceived={amountReceived}
            onAmountReceivedChange={setAmountReceived}
            onCompleteSale={handleCompleteSale}
            isProcessing={isProcessing}
            customerCreditLimit={selectedCustomer?.creditLimit}
            customerDebt={selectedCustomer?.debtBalance}
          />
        </div>
      </div>

      {/* Modal de recibo */}
      {showReceipt && lastSale && (
        <ReceiptModal
          sale={lastSale}
          onClose={() => setShowReceipt(false)}
          onPrint={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}

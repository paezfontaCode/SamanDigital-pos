'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@prisma/client';
import { Pencil, PackagePlus, History, MoreHorizontal } from 'lucide-react';

interface ProductTableProps {
  products: (Product & { category?: { name: string }; supplier?: { name: string } })[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export default function ProductTable({ products, pagination }: ProductTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingStock, setAdjustingStock] = useState<{ id: string; name: string } | null>(null);

  const getStockBadge = (stock: number, minStock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
          Agotado
        </span>
      );
    }
    if (stock <= minStock) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Stock Bajo ({stock})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
        En Stock ({stock})
      </span>
    );
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const calculateMargin = (cost: number, sell: number) => {
    if (sell === 0) return '0%';
    return (((sell - cost) / sell) * 100).toFixed(1) + '%';
  };

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="h-12 px-4 text-left align-middle font-medium">Nombre</th>
            <th className="h-12 px-4 text-left align-middle font-medium">Categoría</th>
            <th className="h-12 px-4 text-right align-middle font-medium">Costo</th>
            <th className="h-12 px-4 text-right align-middle font-medium">Venta</th>
            <th className="h-12 px-4 text-right align-middle font-medium">Margen</th>
            <th className="h-12 px-4 text-center align-middle font-medium">Stock</th>
            <th className="h-12 px-4 text-center align-middle font-medium">Mínimo</th>
            <th className="h-12 px-4 text-right align-middle font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={8} className="h-24 text-center text-muted-foreground">
                No hay productos registrados
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product.id} className="border-t hover:bg-muted/30">
                <td className="p-4 align-middle">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    {product.barcode && (
                      <div className="text-xs text-muted-foreground">
                        SKU: {product.barcode}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <span className="text-muted-foreground">
                    {product.category?.name || 'Sin categoría'}
                  </span>
                </td>
                <td className="p-4 align-middle text-right">
                  ${product.costPrice.toFixed(2)}
                </td>
                <td className="p-4 align-middle text-right">
                  ${product.sellPrice.toFixed(2)}
                </td>
                <td className="p-4 align-middle text-right">
                  <span className="text-xs font-medium text-blue-600">
                    {calculateMargin(product.costPrice, product.sellPrice)}
                  </span>
                </td>
                <td className="p-4 align-middle text-center">
                  {getStockBadge(product.stock, product.minStock)}
                </td>
                <td className="p-4 align-middle text-center">{product.minStock}</td>
                <td className="p-4 align-middle text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setAdjustingStock({ id: product.id, name: product.name })}
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted"
                      title="Ajustar Stock"
                    >
                      <PackagePlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/inventario/accesorios/${product.id}`)}
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted"
                      title="Ver Historial"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Mostrando {products.length} de {pagination.totalItems} productos
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
            >
              Anterior
            </button>
            <span className="text-sm">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      {editingProduct && (
        <NewProductModal
          type="ACCESORIO"
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
      {adjustingStock && (
        <AdjustStockModal
          productId={adjustingStock.id}
          productName={adjustingStock.name}
          onClose={() => setAdjustingStock(null)}
        />
      )}
    </div>
  );
}

// Componentes modales simplificados (se implementarían en archivos separados)
function NewProductModal({ type, product, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-bold">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        <p className="text-muted-foreground">Formulario aquí...</p>
        <button
          onClick={onClose}
          className="mt-4 rounded-md bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function AdjustStockModal({ productId, productName, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-bold">Ajustar Stock: {productName}</h2>
        <p className="text-muted-foreground">Formulario de ajuste aquí...</p>
        <button
          onClick={onClose}
          className="mt-4 rounded-md bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

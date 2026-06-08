'use client';

import { Package, TrendingDown } from 'lucide-react';

interface ProductGridProps {
  products: any[];
  categories: { id: string; name: string }[];
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
  onProductClick: (product: any) => void;
}

export default function ProductGrid({
  products,
  categories,
  selectedCategory,
  onCategorySelect,
  onProductClick,
}: ProductGridProps) {
  return (
    <div className="space-y-4">
      {/* Filtros rápidos por categoría */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => onCategorySelect('')}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategorySelect(cat.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Package className="mx-auto mb-4 h-12 w-12" />
            <p>No hay productos disponibles</p>
          </div>
        ) : (
          products.map((product) => (
            <button
              key={product.id}
              onClick={() => onProductClick(product)}
              disabled={product.stock === 0}
              className={`relative flex flex-col items-center rounded-lg border p-4 transition-all hover:shadow-md ${
                product.stock === 0 ? 'opacity-50 cursor-not-allowed bg-muted' : 'hover:border-primary cursor-pointer'
              }`}
            >
              {/* Badge de stock bajo */}
              {product.stock > 0 && product.stock <= product.minStock && (
                <div className="absolute right-2 top-2">
                  <TrendingDown className="h-4 w-4 text-yellow-500" />
                </div>
              )}

              {/* Icono de producto */}
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>

              {/* Nombre del producto */}
              <div className="mb-1 text-center text-sm font-medium line-clamp-2">
                {product.name}
              </div>

              {/* Precio */}
              <div className="text-lg font-bold text-primary">
                ${product.sellPrice.toFixed(2)}
              </div>

              {/* Stock */}
              <div className="mt-1 text-xs text-muted-foreground">
                {product.stock === 0 ? (
                  <span className="text-red-500 font-medium">Agotado</span>
                ) : (
                  `Stock: ${product.stock}`
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

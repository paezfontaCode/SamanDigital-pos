/**
 * Página de listado de accesorios (inventario)
 */
import { Suspense } from 'react';
import { getProducts, getLowStockCount, generateRestockCSV } from '@/server/actions/product.actions';
import { getProductCategories, getSuppliers } from '@/server/actions/sale.actions';
import ProductTable from './components/ProductTable';
import ProductFilters from './components/ProductFilters';
import NewProductModal from './components/NewProductModal';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    search?: string;
    availability?: 'in-stock' | 'low-stock' | 'out-of-stock';
  }>;
}

export default async function AccesoriosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const categoryId = params.category;
  const search = params.search;
  const availability = params.availability;

  // Cargar datos en paralelo
  const [productsData, categories, suppliers, lowStockCount] = await Promise.all([
    getProducts({
      page,
      limit: 20,
      type: 'ACCESORIO',
      categoryId,
      search,
      availability,
    }),
    getProductCategories('ACCESORIO'),
    getSuppliers(),
    getLowStockCount('ACCESORIO'),
  ]);

  // Generar CSV de reposición
  const handleExportRestock = async () => {
    'use server';
    const csv = await generateRestockCSV('ACCESORIO');
    return csv;
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario de Accesorios</h1>
          <p className="text-muted-foreground">
            Gestiona el inventario de accesorios y repuestos
          </p>
        </div>
        <div className="flex gap-2">
          <NewProductModal type="ACCESORIO" categories={categories} suppliers={suppliers} />
          <form action={handleExportRestock}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Exportar Reposición
            </button>
          </form>
        </div>
      </div>

      {/* Alerta de stock bajo */}
      {lowStockCount > 0 && (
        <div className="mb-4 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-yellow-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              Hay {lowStockCount} {lowStockCount === 1 ? 'producto con' : 'productos con'} stock bajo
            </span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <ProductFilters categories={categories} currentFilters={{ categoryId, search, availability }} />

      {/* Tabla de productos */}
      <Suspense fallback={<div className="text-center py-8">Cargando productos...</div>}>
        <ProductTable
          products={productsData.products}
          pagination={{
            currentPage: productsData.currentPage,
            totalPages: productsData.pages,
            totalItems: productsData.total,
          }}
        />
      </Suspense>
    </div>
  );
}

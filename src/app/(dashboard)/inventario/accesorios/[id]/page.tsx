/**
 * Página de detalle de producto con historial de movimientos
 */
import { notFound } from 'next/navigation';
import { getProductById, getProductMovements } from '@/server/actions/product.actions';
import { ArrowLeft, PackagePlus, PackageMinus, RotateCcw } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product || product.isDeleted) {
    notFound();
  }

  const movements = await getProductMovements(id);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <PackagePlus className="h-4 w-4 text-green-600" />;
      case 'OUT':
        return <PackageMinus className="h-4 w-4 text-red-600" />;
      case 'ADJUST':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      case 'RETURN':
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'IN':
        return 'Entrada';
      case 'OUT':
        return 'Salida';
      case 'ADJUST':
        return 'Ajuste';
      case 'RETURN':
        return 'Devolución';
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header con botón de regreso */}
      <div className="mb-6">
        <Link
          href="/inventario/accesorios"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inventario
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Información del producto */}
        <div className="rounded-lg border bg-card p-6 md:col-span-1">
          <h1 className="mb-4 text-2xl font-bold">{product.name}</h1>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Código de Barras</label>
              <p className="font-medium">{product.barcode || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Categoría</label>
              <p className="font-medium">{product.category?.name || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Proveedor</label>
              <p className="font-medium">{product.supplier?.name || 'N/A'}</p>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Precio Costo</label>
                  <p className="font-medium">${product.costPrice.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Precio Venta</label>
                  <p className="font-medium">${product.sellPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Stock Actual</label>
                  <p className="font-medium">{product.stock} unidades</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Stock Mínimo</label>
                  <p className="font-medium">{product.minStock} unidades</p>
                </div>
              </div>
            </div>

            {product.description && (
              <div className="border-t pt-4">
                <label className="text-sm text-muted-foreground">Descripción</label>
                <p className="text-sm">{product.description}</p>
              </div>
            )}

            {product.compatibleModels && (
              <div className="border-t pt-4">
                <label className="text-sm text-muted-foreground">Modelos Compatibles</label>
                <p className="text-sm">{product.compatibleModels}</p>
              </div>
            )}
          </div>
        </div>

        {/* Historial de movimientos */}
        <div className="rounded-lg border bg-card p-6 md:col-span-2">
          <h2 className="mb-4 text-xl font-bold">Historial de Movimientos</h2>

          {movements.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay movimientos registrados
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {getMovementIcon(movement.type)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {getMovementTypeLabel(movement.type)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {movement.reason || 'Sin razón especificada'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Usuario: {movement.user?.name || 'Desconocido'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        movement.type === 'IN'
                          ? 'text-green-600'
                          : movement.type === 'OUT'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {movement.type === 'IN' ? '+' : '-'}
                      {movement.quantity}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(movement.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

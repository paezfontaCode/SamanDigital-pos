'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProduct, updateProduct } from '@/server/actions/product.actions';
import { X } from 'lucide-react';

const productFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  supplierId: z.string().optional().nullable(),
  costPrice: z.number().positive('El costo debe ser positivo'),
  sellPrice: z.number().positive('El precio de venta debe ser positivo'),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(5),
  type: z.enum(['ACCESORIO', 'REPUESTO']),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface NewProductModalProps {
  type: 'ACCESORIO' | 'REPUESTO';
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  product?: any;
  onClose?: () => void;
}

export default function NewProductModal({
  type,
  categories,
  suppliers,
  product,
  onClose,
}: NewProductModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [margin, setMargin] = useState<string>('0%');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          ...product,
          costPrice: parseFloat(product.costPrice),
          sellPrice: parseFloat(product.sellPrice),
          stock: parseInt(product.stock),
          minStock: parseInt(product.minStock),
        }
      : {
          type,
          stock: 0,
          minStock: 5,
        },
  });

  // Calcular margen en tiempo real
  const costPrice = watch('costPrice');
  const sellPrice = watch('sellPrice');

  useState(() => {
    if (costPrice && sellPrice && sellPrice > 0) {
      const calculatedMargin = (((sellPrice - costPrice) / sellPrice) * 100).toFixed(1);
      setMargin(`${calculatedMargin}%`);
    } else {
      setMargin('0%');
    }
  });

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const onSubmit = async (data: ProductFormData) => {
    startTransition(async () => {
      let result;
      if (product) {
        result = await updateProduct(product.id, data);
      } else {
        result = await createProduct(data);
      }

      if (result.success) {
        alert(result.message);
        handleClose();
      } else {
        alert(result.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button onClick={handleClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre y Código de Barras */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Nombre *</label>
              <input
                {...register('name')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Código de Barras</label>
              <input
                {...register('barcode')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {errors.barcode && <p className="mt-1 text-xs text-red-500">{errors.barcode.message}</p>}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-2 block text-sm font-medium">Descripción</label>
            <textarea
              {...register('description')}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Categoría y Proveedor */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Categoría *</label>
              <select
                {...register('categoryId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Proveedor</label>
              <select
                {...register('supplierId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Sin proveedor</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Precios */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">Precio Costo *</label>
              <input
                type="number"
                step="0.01"
                {...register('costPrice', { valueAsNumber: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {errors.costPrice && (
                <p className="mt-1 text-xs text-red-500">{errors.costPrice.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Precio Venta *</label>
              <input
                type="number"
                step="0.01"
                {...register('sellPrice', { valueAsNumber: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {errors.sellPrice && (
                <p className="mt-1 text-xs text-red-500">{errors.sellPrice.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Margen</label>
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-blue-600">
                {margin}
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Stock Actual</label>
              <input
                type="number"
                {...register('stock', { valueAsNumber: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Stock Mínimo</label>
              <input
                type="number"
                {...register('minStock', { valueAsNumber: true })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

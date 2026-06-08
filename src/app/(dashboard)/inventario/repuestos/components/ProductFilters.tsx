'use client';

import { useRouter } from 'next/navigation';

interface ProductFiltersProps {
  categories: { id: string; name: string }[];
  currentFilters: {
    categoryId?: string;
    search?: string;
    availability?: 'in-stock' | 'low-stock' | 'out-of-stock';
  };
}

export default function ProductFilters({ categories, currentFilters }: ProductFiltersProps) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const category = formData.get('category') as string;
    const search = formData.get('search') as string;
    const availability = formData.get('availability') as string;

    if (category) params.set('category', category);
    if (search) params.set('search', search);
    if (availability) params.set('availability', availability as any);

    router.push(`?${params.toString()}`);
  };

  const handleClear = () => {
    router.push('?');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-lg border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-4">
        {/* Búsqueda por nombre */}
        <div>
          <label className="mb-2 block text-sm font-medium">Buscar</label>
          <input
            type="text"
            name="search"
            defaultValue={currentFilters.search}
            placeholder="Nombre o código..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {/* Filtro por categoría */}
        <div>
          <label className="mb-2 block text-sm font-medium">Categoría</label>
          <select
            name="category"
            defaultValue={currentFilters.categoryId}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por disponibilidad */}
        <div>
          <label className="mb-2 block text-sm font-medium">Disponibilidad</label>
          <select
            name="availability"
            defaultValue={currentFilters.availability}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Todos</option>
            <option value="in-stock">En Stock</option>
            <option value="low-stock">Stock Bajo</option>
            <option value="out-of-stock">Agotados</option>
          </select>
        </div>

        {/* Botones de acción */}
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex h-10 flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Limpiar
          </button>
        </div>
      </div>
    </form>
  );
}

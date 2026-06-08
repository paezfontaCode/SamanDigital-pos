/**
 * Página de gestión de categorías de productos
 */
'use client';

import { useState, useEffect } from 'react';
import { prisma } from '@/lib/db/prisma';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  type: 'ACCESORIO' | 'REPUESTO' | 'SERVICIO';
}

export default function CategoriasPage() {
  const [activeTab, setActiveTab] = useState<'ACCESORIO' | 'REPUESTO'>('ACCESORIO');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Cargar categorías
  useEffect(() => {
    loadCategories();
  }, [activeTab]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/categories?type=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías de Productos</h1>
          <p className="text-muted-foreground">
            Gestiona las categorías de accesorios y repuestos
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('ACCESORIO')}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === 'ACCESORIO'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Categorías de Accesorios
          </button>
          <button
            onClick={() => setActiveTab('REPUESTO')}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === 'REPUESTO'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Categorías de Repuestos
          </button>
        </div>
      </div>

      {/* Lista de categorías */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          <p>No hay categorías registradas</p>
          <p className="text-sm">Crea la primera categoría para comenzar</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-lg border bg-card p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowModal(true);
                    }}
                    className="rounded-md p-1 hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="rounded-md p-1 hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Tipo: {category.type === 'ACCESORIO' ? 'Accesorio' : 'Repuesto'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          type={activeTab}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadCategories();
          }}
        />
      )}
    </div>
  );

  async function handleDelete(id: string) {
    if (!confirm('¿Está seguro de eliminar esta categoría?')) return;

    try {
      const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        loadCategories();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Error al eliminar la categoría');
    }
  }
}

function CategoryModal({
  category,
  type,
  onClose,
  onSave,
}: {
  category: Category | null;
  type: 'ACCESORIO' | 'REPUESTO';
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/categories', {
        method: category ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: category?.id,
          name,
          description,
          type,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSave();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Error al guardar la categoría');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-bold">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { searchClient, quickCreateClient } from '@/server/actions/sale.actions';
import { User, UserPlus, AlertCircle } from 'lucide-react';

interface CustomerSelectorProps {
  selectedCustomer: any | null;
  onSelectCustomer: (customer: any) => void;
}

export default function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
}: CustomerSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        const clients = await searchClient(query);
        setResults(clients);
        setIsLoading(false);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (client: any) => {
    onSelectCustomer(client);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const availableCredit = selectedCustomer
    ? selectedCustomer.creditLimit - selectedCustomer.debtBalance
    : null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Cliente</label>
      
      {/* Selector de cliente */}
      <div className="relative">
        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={selectedCustomer ? selectedCustomer.name : query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!selectedCustomer) {
              // Si no hay cliente seleccionado, buscar
            }
          }}
          placeholder="Buscar cliente por nombre o teléfono..."
          className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onFocus={() => {
            if (!selectedCustomer && query.length >= 2) setIsOpen(true);
          }}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        
        {/* Botón para limpiar selección */}
        {selectedCustomer && (
          <button
            onClick={() => {
              onSelectCustomer(null);
              setQuery('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}

        {/* Resultados de búsqueda */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
            {results.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelect(client)}
                className="flex w-full items-center justify-between p-3 hover:bg-accent border-b last:border-0"
              >
                <div className="text-left">
                  <div className="font-medium">{client.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {client.phone}
                  </div>
                </div>
                {client.debtBalance > 0 && (
                  <div className="text-xs text-red-500 font-medium">
                    Deuda: ${client.debtBalance.toFixed(2)}
                  </div>
                )}
              </button>
            ))}
            
            {/* Opción para crear nuevo cliente */}
            <button
              onClick={() => {
                setShowCreateModal(true);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 p-3 text-primary hover:bg-accent"
            >
              <UserPlus className="h-4 w-4" />
              <span>Crear cliente "{query}"</span>
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Información del cliente seleccionado */}
      {selectedCustomer && (
        <div className="rounded-md border bg-muted/50 p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Teléfono:</span>
            <span>{selectedCustomer.phone}</span>
          </div>
          {selectedCustomer.email && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email:</span>
              <span>{selectedCustomer.email}</span>
            </div>
          )}
          {selectedCustomer.creditLimit > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Límite de crédito:</span>
                <span>${selectedCustomer.creditLimit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deuda actual:</span>
                <span className={selectedCustomer.debtBalance > 0 ? 'text-red-500' : ''}>
                  ${selectedCustomer.debtBalance.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Crédito disponible:</span>
                <span className={availableCredit! <= 0 ? 'text-red-500' : 'text-green-600'}>
                  ${Math.max(0, availableCredit!).toFixed(2)}
                </span>
              </div>
            </>
          )}
          {selectedCustomer.debtBalance > 0 && (
            <div className="flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              <span>El cliente tiene deuda pendiente</span>
            </div>
          )}
        </div>
      )}

      {/* Modal de creación rápida */}
      {showCreateModal && (
        <QuickCreateCustomerModal
          initialName={query}
          onCreate={(client) => {
            handleSelect(client);
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

function QuickCreateCustomerModal({
  initialName,
  onCreate,
  onClose,
}: {
  initialName: string;
  onCreate: (client: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await quickCreateClient({ name, phone, email: email || null, creditLimit: 0 });

    if (result.success && result.data) {
      onCreate(result.data);
    } else {
      alert(result.message);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-bold">Crear Cliente Rápido</h2>
        
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
            <label className="mb-2 block text-sm font-medium">Teléfono *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              {isSubmitting ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

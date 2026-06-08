/**
 * Página de Gastos Fijos Recurrentes
 */
'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

// Nota: Esta funcionalidad requiere una tabla FixedExpense en la BD
// Por ahora es un placeholder para futura implementación

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  frequency: 'WEEKLY' | 'MONTHLY';
  dueDay: number;
  category: string;
  description?: string | null;
  isActive: boolean;
  lastPaid?: string | null;
  nextDue?: string | null;
}

export default function GastosFijosPage() {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [dueDay, setDueDay] = useState('1');
  const [category, setCategory] = useState('RENT');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    // TODO: Implementar server action para obtener gastos fijos
    // Por ahora, datos dummy para demostración
    setTimeout(() => {
      setExpenses([
        {
          id: '1',
          name: 'Alquiler Local',
          amount: 500,
          frequency: 'MONTHLY',
          dueDay: 5,
          category: 'RENT',
          description: 'Alquiler del local comercial',
          isActive: true,
          lastPaid: '2024-01-05',
          nextDue: '2024-02-05',
        },
        {
          id: '2',
          name: 'Internet',
          amount: 50,
          frequency: 'MONTHLY',
          dueDay: 15,
          category: 'UTILITIES',
          description: 'Servicio de internet empresarial',
          isActive: true,
          lastPaid: '2024-01-15',
          nextDue: '2024-02-15',
        },
        {
          id: '3',
          name: 'Servicio de Limpieza',
          amount: 80,
          frequency: 'WEEKLY',
          dueDay: 1,
          category: 'SERVICES',
          description: 'Limpieza semanal del local',
          isActive: true,
          lastPaid: '2024-01-22',
          nextDue: '2024-01-29',
        },
      ]);
      setIsLoading(false);
    }, 500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar server action para guardar gasto fijo
    alert('Funcionalidad pendiente de implementar - requiere migración de BD');
    setShowModal(false);
    resetForm();
  };

  const handleEdit = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setName(expense.name);
    setAmount(expense.amount.toString());
    setFrequency(expense.frequency);
    setDueDay(expense.dueDay.toString());
    setCategory(expense.category);
    setDescription(expense.description || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este gasto fijo?')) return;
    // TODO: Implementar server action para eliminar
    alert('Funcionalidad pendiente de implementar');
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setFrequency('MONTHLY');
    setDueDay('1');
    setCategory('RENT');
    setDescription('');
    setEditingExpense(null);
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      RENT: 'Alquiler',
      UTILITIES: 'Servicios',
      SALARY: 'Salarios',
      INTERNET: 'Internet',
      INSURANCE: 'Seguros',
      SERVICES: 'Servicios',
      OTHER: 'Otro',
    };
    return labels[cat] || cat;
  };

  const getNextDueDate = (expense: FixedExpense) => {
    // Cálculo simplificado de próxima fecha de vencimiento
    const now = new Date();
    let nextDue = new Date(now.getFullYear(), now.getMonth(), expense.dueDay);
    
    if (nextDue < now) {
      if (expense.frequency === 'MONTHLY') {
        nextDue.setMonth(nextDue.getMonth() + 1);
      } else {
        nextDue.setDate(nextDue.getDate() + 7);
      }
    }
    
    return nextDue.toLocaleDateString('es-VE');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gastos Fijos Recurrentes</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Nuevo Gasto Fijo
        </button>
      </div>

      {/* Info box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Los gastos fijos generan recordatorios automáticos cuando se acerca su fecha de vencimiento.
          Debes registrar manualmente el pago desde la caja cuando corresponda.
        </p>
      </div>

      {/* Lista de gastos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenses.map((expense) => (
          <div key={expense.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{expense.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                expense.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {expense.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            
            <p className="text-2xl font-bold text-blue-600 mb-2">
              {formatCurrency(expense.amount)}
            </p>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Frecuencia:</span>
                <span className="font-medium">
                  {expense.frequency === 'MONTHLY' ? 'Mensual' : 'Semanal'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Categoría:</span>
                <span className="font-medium">{getCategoryLabel(expense.category)}</span>
              </div>
              <div className="flex justify-between">
                <span>Día de pago:</span>
                <span className="font-medium">Día {expense.dueDay}</span>
              </div>
              <div className="flex justify-between">
                <span>Próximo vencimiento:</span>
                <span className="font-medium text-orange-600">{getNextDueDate(expense)}</span>
              </div>
            </div>
            
            {expense.description && (
              <p className="text-xs text-gray-500 mt-2">{expense.description}</p>
            )}
            
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => handleEdit(expense)}
                className="flex-1 py-2 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(expense.id)}
                className="flex-1 py-2 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay gastos fijos registrados
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {editingExpense ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}
            </h3>
            
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  placeholder="Ej: Alquiler, Internet, etc."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  min="0.01"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="WEEKLY">Semanal</option>
                    <option value="MONTHLY">Mensual</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Día de vencimiento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="RENT">Alquiler</option>
                  <option value="UTILITIES">Servicios Públicos</option>
                  <option value="SALARY">Salarios</option>
                  <option value="INTERNET">Internet/Telefonía</option>
                  <option value="INSURANCE">Seguros</option>
                  <option value="SERVICES">Otros Servicios</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingExpense ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

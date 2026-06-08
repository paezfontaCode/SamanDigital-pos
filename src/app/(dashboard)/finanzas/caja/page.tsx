/**
 * Página de gestión de caja
 */
'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { 
  getCurrentCashRegister, 
  openCashRegister, 
  closeCashRegister, 
  registerExpense,
  getCashRegisterSummary 
} from '@/server/actions/cash-register.actions';

interface CashMovement {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description: string;
  createdAt: string;
  user: {
    name: string;
  };
}

interface CashRegisterSummary {
  cashRegister: any;
  summary: {
    openingBalance: number;
    totalIncome: number;
    totalExpenses: number;
    currentBalance: number;
    incomeByCategory: Array<{ category: string; total: number }>;
    expenseByCategory: Array<{ category: string; total: number }>;
  };
  recentMovements: CashMovement[];
}

export default function CajaPage() {
  const [cashRegister, setCashRegister] = useState<any | null>(null);
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para modales
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  
  // Form states
  const [openingAmount, setOpeningAmount] = useState('');
  const [openingNotes, setOpeningNotes] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('OTHER');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Usuario actual (en producción obtener de la sesión)
  const userId = 'user-id-placeholder';
  const userRole = 'ADMIN'; // En producción obtener de la sesión

  useEffect(() => {
    loadCashRegister();
  }, []);

  const loadCashRegister = async () => {
    setIsLoading(true);
    try {
      const current = await getCurrentCashRegister(userId);
      setCashRegister(current);
      
      if (current) {
        const summaryData = await getCashRegisterSummary(current.id);
        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Error cargando caja:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCashRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const result = await openCashRegister(
      {
        openingAmount: parseFloat(openingAmount),
        notes: openingNotes || null,
      },
      userId
    );
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setShowOpenModal(false);
      setOpeningAmount('');
      setOpeningNotes('');
      loadCashRegister();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setIsProcessing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRegisterExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const result = await registerExpense(
      {
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
        description: expenseDescription,
      },
      userId
    );
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setShowExpenseModal(false);
      setExpenseAmount('');
      setExpenseCategory('OTHER');
      setExpenseDescription('');
      loadCashRegister();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setIsProcessing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCloseCashRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const result = await closeCashRegister(
      cashRegister.id,
      {
        closingAmount: parseFloat(closingAmount),
        notes: closingNotes || null,
      },
      userId
    );
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setShowCloseModal(false);
      setClosingAmount('');
      setClosingNotes('');
      setCashRegister(null);
      setSummary(null);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setIsProcessing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si no hay caja abierta, mostrar formulario de apertura
  if (!cashRegister) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Gestión de Caja</h1>
        
        {message && (
          <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}
        
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">No hay caja abierta</h2>
          <p className="text-gray-600 mb-6 text-center">
            Debes abrir una caja al inicio del turno con el monto físico inicial.
          </p>
          
          <button
            onClick={() => setShowOpenModal(true)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Abrir Caja
          </button>
        </div>

        {/* Modal de Apertura */}
        {showOpenModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Abrir Caja</h3>
              
              <form onSubmit={handleOpenCashRegister}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Monto de Apertura</label>
                  <input
                    type="number"
                    step="0.01"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
                  <textarea
                    value={openingNotes}
                    onChange={(e) => setOpeningNotes(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowOpenModal(false)}
                    className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isProcessing ? 'Abriendo...' : 'Abrir Caja'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard de caja abierta
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Caja Abierta</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
          >
            Registrar Gasto
          </button>
          {userRole === 'ADMIN' && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
            >
              Cerrar Caja
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Panel Superior - KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Saldo Actual</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary?.summary.currentBalance || 0)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Total Ingresos</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(summary?.summary.totalIncome || 0)}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            {summary?.summary.incomeByCategory.map((cat) => (
              <div key={cat.category}>{cat.category}: {formatCurrency(cat.total)}</div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Total Egresos</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(summary?.summary.totalExpenses || 0)}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            {summary?.summary.expenseByCategory.map((cat) => (
              <div key={cat.category}>{cat.category}: {formatCurrency(cat.total)}</div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-600 mb-1">Apertura</h3>
          <p className="text-2xl font-bold text-gray-700">
            {formatCurrency(summary?.summary.openingBalance || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Esperado al cerrar: {formatCurrency(summary?.summary.expectedClosing || 0)}
          </p>
        </div>
      </div>

      {/* Movimientos Recientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Movimientos Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summary?.recentMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      movement.type === 'INCOME' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {movement.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{movement.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{movement.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{movement.user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(movement.createdAt).toLocaleTimeString()}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium text-right ${
                    movement.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {movement.type === 'INCOME' ? '+' : '-'}{formatCurrency(movement.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Gasto */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Registrar Gasto</h3>
            
            <form onSubmit={handleRegisterExpense}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
                  required
                  min="0.01"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
                >
                  <option value="FIXED_EXPENSE">Gasto Fijo</option>
                  <option value="SALARY">Salario</option>
                  <option value="SUPPLIES">Insumos</option>
                  <option value="MAINTENANCE">Mantenimiento</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cierre */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Cerrar Caja</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Saldo esperado:</span>
                <span className="font-semibold">{formatCurrency(summary?.summary.expectedClosing || 0)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total ingresos:</span>
                <span className="text-green-600">{formatCurrency(summary?.summary.totalIncome || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total egresos:</span>
                <span className="text-red-600">{formatCurrency(summary?.summary.totalExpenses || 0)}</span>
              </div>
            </div>
            
            <form onSubmit={handleCloseCashRegister}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Conteo Físico Real</label>
                <input
                  type="number"
                  step="0.01"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500"
                  required
                  min="0"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notas del Cierre</label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500"
                  rows={3}
                />
              </div>
              
              {closingAmount && summary && (
                <div className="mb-4 p-3 bg-yellow-50 rounded">
                  <p className="text-sm">
                    Diferencia (arqueo): 
                    <span className={`font-bold ml-2 ${
                      parseFloat(closingAmount) - (summary?.summary.expectedClosing || 0) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(parseFloat(closingAmount) - (summary?.summary.expectedClosing || 0))}
                    </span>
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Cerrando...' : 'Cerrar Caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

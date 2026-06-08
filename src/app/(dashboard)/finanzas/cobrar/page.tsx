/**
 * Página de Cuentas por Cobrar
 */
'use client';

import { useState, useEffect } from 'react';
import { 
  getAccountsReceivable, 
  registerPayment,
  getAccountDetail 
} from '@/server/actions/payment.actions';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AccountReceivable {
  id: string;
  amount: number;
  balance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  dueDate?: string | null;
  referenceType: string;
  referenceId: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  daysUntilDue: number | null;
  isOverdue: boolean;
  urgency: 'ok' | 'warning' | 'danger';
  client: {
    id: string;
    name: string;
    phone: string;
    creditLimit: number;
    debtBalance: number;
  };
}

export default function CobrarPage() {
  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<AccountReceivable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIAL' | 'PAID'>('ALL');
  const [clientFilter, setClientFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  
  // Modal de abono
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountReceivable | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Usuario actual (en producción obtener de la sesión)
  const userId = 'user-id-placeholder';

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [accounts, statusFilter, clientFilter, overdueOnly]);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await getAccountsReceivable();
      setAccounts(data);
    } catch (error) {
      console.error('Error cargando cuentas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...accounts];
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    if (clientFilter) {
      filtered = filtered.filter(a => 
        a.client.name.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }
    
    if (overdueOnly) {
      filtered = filtered.filter(a => a.isOverdue && a.status !== 'PAID');
    }
    
    // Ordenar: vencidas primero, luego por fecha de vencimiento
    filtered.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      return 0;
    });
    
    setFilteredAccounts(filtered);
  };

  const handleOpenPaymentModal = (account: AccountReceivable) => {
    setSelectedAccount(account);
    setPaymentAmount(account.balance.toString());
    setPaymentMethod('CASH');
    setPaymentReference('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    if (!selectedAccount) return;
    
    const result = await registerPayment(
      {
        accountId: selectedAccount.id,
        accountType: 'RECEIVABLE',
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        reference: paymentReference || null,
        notes: paymentNotes || null,
      },
      userId
    );
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setShowPaymentModal(false);
      loadAccounts();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setIsProcessing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Pagado</span>;
      case 'PARTIAL':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Parcial</span>;
      case 'PENDING':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pendiente</span>;
      default:
        return null;
    }
  };

  const getUrgencyBadge = (account: AccountReceivable) => {
    if (account.status === 'PAID') return null;
    
    if (account.urgency === 'danger') {
      return (
        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Vencida ({Math.abs(account.daysUntilDue || 0)} días)
        </span>
      );
    }
    
    if (account.urgency === 'warning') {
      return (
        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Próxima a vencer ({account.daysUntilDue} días)
        </span>
      );
    }
    
    if (account.daysUntilDue !== null && account.daysUntilDue > 0) {
      return (
        <span className="ml-2 text-xs text-gray-500">
          Vence en {account.daysUntilDue} días
        </span>
      );
    }
    
    return null;
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
      <h1 className="text-2xl font-bold mb-6">Cuentas por Cobrar</h1>
      
      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="PARTIAL">Parcial</option>
              <option value="PAID">Pagado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <input
              type="text"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Solo vencidas</span>
            </label>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setClientFilter('');
                setOverdueOnly(false);
              }}
              className="w-full py-2 px-4 border rounded-lg hover:bg-gray-100 text-sm"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de cuentas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAccounts.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{account.client.name}</div>
                  <div className="text-xs text-gray-500">{account.client.phone}</div>
                  {getUrgencyBadge(account)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatCurrency(account.amount)}
                </td>
                <td className="px-4 py-3 text-sm text-green-600">
                  {formatCurrency(account.amount - account.balance)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  {formatCurrency(account.balance)}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(account.status)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {account.dueDate ? formatDate(account.dueDate) : 'Sin fecha'}
                </td>
                <td className="px-4 py-3 text-right">
                  {account.status !== 'PAID' && (
                    <button
                      onClick={() => handleOpenPaymentModal(account)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Registrar Abono
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredAccounts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No se encontraron cuentas por cobrar
          </div>
        )}
      </div>

      {/* Modal de Abono */}
      {showPaymentModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Registrar Abono</h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="text-sm text-gray-600 mb-1">Cliente:</div>
              <div className="font-semibold">{selectedAccount.client.name}</div>
              <div className="mt-2 flex justify-between">
                <span className="text-gray-600">Saldo pendiente:</span>
                <span className="font-bold text-red-600">{formatCurrency(selectedAccount.balance)}</span>
              </div>
            </div>
            
            <form onSubmit={handleRegisterPayment}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Monto del Abono</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                  min="0.01"
                  max={selectedAccount.balance}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Referencia (opcional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Nro de transferencia / último 4 dígitos"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 px-4 border rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Registrando...' : 'Confirmar Abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

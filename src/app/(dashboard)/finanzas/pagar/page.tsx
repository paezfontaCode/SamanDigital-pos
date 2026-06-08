/**
 * Página de Cuentas por Pagar
 */
'use client';

import { useState, useEffect } from 'react';
import { 
  getAccountsPayable, 
  createAccountPayable,
  paySupplier,
  getSuppliers 
} from '@/server/actions/supplier.actions';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AccountPayable {
  id: string;
  amount: number;
  balance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  dueDate?: string | null;
  description: string;
  supplierId: string;
  createdAt: string;
  daysUntilDue: number | null;
  isOverdue: boolean;
  urgency: 'ok' | 'warning' | 'danger';
  supplier: {
    id: string;
    name: string;
    phone?: string | null;
    contact?: string | null;
  };
}

export default function PagarPage() {
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<AccountPayable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PARTIAL' | 'PAID'>('ALL');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  
  // Modales
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null);
  
  // Form invoice
  const [invoiceSupplier, setInvoiceSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  
  // Form payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const userId = 'user-id-placeholder';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [accounts, statusFilter, supplierFilter, overdueOnly]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [accountsData, suppliersData] = await Promise.all([
        getAccountsPayable(),
        getSuppliers()
      ]);
      setAccounts(accountsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...accounts];
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    if (supplierFilter) {
      filtered = filtered.filter(a => 
        a.supplier.name.toLowerCase().includes(supplierFilter.toLowerCase())
      );
    }
    
    if (overdueOnly) {
      filtered = filtered.filter(a => a.isOverdue && a.status !== 'PAID');
    }
    
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

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const result = await createAccountPayable(
      {
        supplierId: invoiceSupplier,
        invoiceNumber,
        amount: parseFloat(invoiceAmount),
        dueDate: new Date(invoiceDueDate),
        description: invoiceDescription,
      },
      userId
    );
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setShowInvoiceModal(false);
      resetInvoiceForm();
      loadInitialData();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setIsProcessing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    if (!selectedAccount) return;
    
    const result = await paySupplier(
      selectedAccount.id,
      parseFloat(paymentAmount),
      paymentMethod,
      paymentReference || null,
      userId
    );
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setShowPaymentModal(false);
      loadInitialData();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setIsProcessing(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const resetInvoiceForm = () => {
    setInvoiceSupplier('');
    setInvoiceNumber('');
    setInvoiceAmount('');
    setInvoiceDueDate('');
    setInvoiceDescription('');
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

  const getUrgencyBadge = (account: AccountPayable) => {
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
          Próxima ({account.daysUntilDue} días)
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cuentas por Pagar</h1>
        <button
          onClick={() => setShowInvoiceModal(true)}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Registrar Factura
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="PARTIAL">Parcial</option>
              <option value="PAID">Pagado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Proveedor</label>
            <input
              type="text"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              placeholder="Buscar..."
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Solo vencidas</span>
            </label>
            
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSupplierFilter('');
                setOverdueOnly(false);
              }}
              className="py-2 px-4 border rounded-lg hover:bg-gray-100 text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
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
                  <div className="font-medium">{account.supplier.name}</div>
                  {getUrgencyBadge(account)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{account.description}</td>
                <td className="px-4 py-3 text-sm">{formatCurrency(account.amount)}</td>
                <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(account.balance)}</td>
                <td className="px-4 py-3">{getStatusBadge(account.status)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {account.dueDate ? formatDate(account.dueDate) : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  {account.status !== 'PAID' && (
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setPaymentAmount(account.balance.toString());
                        setShowPaymentModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Pagar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredAccounts.length === 0 && (
          <div className="p-8 text-center text-gray-500">No hay cuentas por pagar</div>
        )}
      </div>

      {/* Modal Nueva Factura */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Registrar Factura de Proveedor</h3>
            
            <form onSubmit={handleCreateInvoice}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Proveedor</label>
                <select
                  value={invoiceSupplier}
                  onChange={(e) => setInvoiceSupplier(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Número de Factura</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Monto Total</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  min="0.01"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-100">Cancelar</button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{isProcessing ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPaymentModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Pagar a Proveedor</h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="font-semibold">{selectedAccount.supplier.name}</div>
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">Saldo pendiente:</span>
                <span className="font-bold text-red-600">{formatCurrency(selectedAccount.balance)}</span>
              </div>
            </div>
            
            <form onSubmit={handlePaySupplier}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  min="0.01"
                  max={selectedAccount.balance}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Método</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Referencia</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Opcional"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-100">Cancelar</button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{isProcessing ? 'Procesando...' : 'Confirmar Pago'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

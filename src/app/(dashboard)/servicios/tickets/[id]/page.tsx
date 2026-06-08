'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getTicketById, 
  updateTicketStatus, 
  addTicketDiagnosis,
  getSpareParts,
} from '@/server/actions/ticket.actions';
import { BUSINESS_CONSTANTS, TICKET_STATUS } from '@/lib/constants/business-constants';

const STATUS_LABELS: Record<string, string> = {
  'PENDING': 'Recibido',
  'IN_PROGRESS': 'En Revisión',
  'READY': 'Reparado',
  'DELIVERED': 'Entregado',
  'CANCELLED': 'Cancelado',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  
  // Estado para diagnóstico
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number; price: number }[]>([]);
  const [laborCost, setLaborCost] = useState(0);

  useEffect(() => {
    const loadTicket = async () => {
      if (params.id) {
        const data = await getTicketById(params.id as string);
        setTicket(data);
        
        // Cargar repuestos si el ticket está en progreso
        if (data && ['PENDING', 'IN_PROGRESS'].includes(data.status)) {
          const parts = await getSpareParts();
          setSpareParts(parts);
        }
        
        setLoading(false);
      }
    };
    loadTicket();
  }, [params.id]);

  const photos = ticket?.photos ? JSON.parse(ticket.photos) : [];
  
  const canChangeStatus = (currentStatus: string, newStatus: string): boolean => {
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['PENDING', 'READY', 'CANCELLED'],
      'READY': ['DELIVERED'],
      'DELIVERED': [],
      'CANCELLED': [],
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    if (!canChangeStatus(ticket.status, newStatus)) {
      setMessage({ type: 'error', text: 'Transición de estado inválida' });
      return;
    }

    const result = await updateTicketStatus(ticket.id, newStatus);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setTicket(result.data);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleAddDiagnosis = async () => {
    if (!ticket) return;

    const result = await addTicketDiagnosis(
      ticket.id,
      diagnosis,
      technicianNotes,
      selectedItems,
      laborCost
    );

    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setShowDiagnosisForm(false);
      // Recargar ticket
      const updatedTicket = await getTicketById(ticket.id);
      setTicket(updatedTicket);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleSelectPart = (part: any) => {
    const existing = selectedItems.find(item => item.productId === part.id);
    if (existing) {
      setSelectedItems(selectedItems.filter(item => item.productId !== part.id));
    } else {
      setSelectedItems([...selectedItems, { productId: part.id, quantity: 1, price: part.sellPrice }]);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-red-600">Ticket no encontrado</div>;
  }

  const elapsedTime = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="container mx-auto py-6">
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Encabezado */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{ticket.number}</h1>
          <p className="text-muted-foreground">
            {ticket.deviceBrand} {ticket.deviceModel} - {STATUS_LABELS[ticket.status]}
          </p>
          <p className="text-sm text-muted-foreground">
            {elapsedTime} {elapsedTime === 1 ? 'día' : 'días'} en taller
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/servicios/tickets/${ticket.id}/print`)}
            className="px-4 py-2 border rounded-md hover:bg-muted"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-md hover:bg-muted"
          >
            ← Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Información del ticket */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline de estados */}
          <section className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Estado Actual</h2>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 rounded-full font-bold ${
                ticket.status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                ticket.status === 'READY' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {STATUS_LABELS[ticket.status]}
              </span>
              {ticket.queuePosition && ticket.status === 'PENDING' && (
                <span className="text-sm text-muted-foreground">
                  Posición en cola: #{ticket.queuePosition}
                </span>
              )}
            </div>

            {/* Botones de cambio de estado */}
            <div className="mt-4 flex flex-wrap gap-2">
              {ticket.status === 'PENDING' && (
                <button
                  onClick={() => handleStatusChange('IN_PROGRESS')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ▶️ Iniciar Revisión
                </button>
              )}
              {ticket.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => handleStatusChange('READY')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    ✅ Marcar como Reparado
                  </button>
                  <button
                    onClick={() => handleStatusChange('PENDING')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    ⏸️ Pausar
                  </button>
                </>
              )}
              {ticket.status === 'READY' && (
                <p className="text-green-600 font-medium">
                  Equipo listo para entrega. Notificar al vendedor.
                </p>
              )}
              {!['DELIVERED', 'CANCELLED'].includes(ticket.status) && (
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  ❌ Cancelar
                </button>
              )}
            </div>
          </section>

          {/* Datos del cliente y equipo */}
          <section className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Información del Servicio</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Cliente</h3>
                <p className="text-sm"><strong>Nombre:</strong> {ticket.client.name}</p>
                <p className="text-sm"><strong>Teléfono:</strong> {ticket.client.phone}</p>
                {ticket.client.email && (
                  <p className="text-sm"><strong>Email:</strong> {ticket.client.email}</p>
                )}
                {ticket.client.debtBalance > 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Deuda pendiente: ${ticket.client.debtBalance}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Equipo</h3>
                <p className="text-sm"><strong>Marca:</strong> {ticket.deviceBrand}</p>
                <p className="text-sm"><strong>Modelo:</strong> {ticket.deviceModel}</p>
                {ticket.deviceSerial && (
                  <p className="text-sm"><strong>IMEI/Serie:</strong> {ticket.deviceSerial}</p>
                )}
                {ticket.devicePassword && (
                  <p className="text-sm"><strong>Contraseña:</strong> {'•'.repeat(ticket.devicePassword.length)}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold mb-2">Problema Reportado</h3>
              <p className="text-sm whitespace-pre-wrap">{ticket.issue}</p>
              {ticket.problemType && (
                <p className="text-sm mt-2"><strong>Tipo:</strong> {ticket.problemType}</p>
              )}
              {ticket.isWarrantyService && (
                <p className="text-sm text-red-600 font-bold mt-2">⚠️ SERVICIO POR GARANTÍA</p>
              )}
            </div>
          </section>

          {/* Fotos */}
          {photos.length > 0 && (
            <section className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Fotos del Equipo</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo: string, index: number) => (
                  <div key={index} className="aspect-square border rounded-md overflow-hidden">
                    <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Diagnóstico del técnico */}
          <section className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Diagnóstico Técnico</h2>
              {['PENDING', 'IN_PROGRESS'].includes(ticket.status) && !showDiagnosisForm && (
                <button
                  onClick={() => setShowDiagnosisForm(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Agregar Diagnóstico
                </button>
              )}
            </div>

            {showDiagnosisForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Diagnóstico Detallado</label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Describa el problema encontrado..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Repuestos Necesarios</label>
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                    {spareParts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay repuestos disponibles</p>
                    ) : (
                      spareParts.map(part => (
                        <label key={part.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedItems.some(item => item.productId === part.id)}
                              onChange={() => handleSelectPart(part)}
                              className="h-4 w-4"
                            />
                            <span>{part.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">${part.sellPrice}</div>
                            <div className={`text-xs ${part.stock <= part.minStock ? 'text-red-600' : 'text-green-600'}`}>
                              Stock: {part.stock}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Costo Mano de Obra ($)</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notas Internas (no visible para cliente)</label>
                  <textarea
                    value={technicianNotes}
                    onChange={(e) => setTechnicianNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Notas internas..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddDiagnosis}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Guardar Diagnóstico
                  </button>
                  <button
                    onClick={() => setShowDiagnosisForm(false)}
                    className="px-4 py-2 border rounded-md hover:bg-muted"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : ticket.notes ? (
              <div>
                <p className="whitespace-pre-wrap">{ticket.notes}</p>
                {ticket.items && ticket.items.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Repuestos y Costos</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Item</th>
                          <th className="text-right">Cantidad</th>
                          <th className="text-right">Precio</th>
                          <th className="text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticket.items.map((item: any) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-2">{item.product.name}</td>
                            <td className="text-right">{item.quantity}</td>
                            <td className="text-right">${item.price.toFixed(2)}</td>
                            <td className="text-right">${item.subtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="text-right font-bold py-2">Total Estimado:</td>
                          <td className="text-right font-bold">${ticket.finalCost.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Sin diagnóstico registrado</p>
            )}
          </section>
        </div>

        {/* Columna derecha: Resumen */}
        <div className="space-y-6">
          {/* Resumen económico */}
          <section className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Resumen Económico</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo Estimado:</span>
                <span className="font-medium">${parseFloat(ticket.estimatedCost || 0).toFixed(2)}</span>
              </div>
              {ticket.finalCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costo Final:</span>
                  <span className="font-medium">${ticket.finalCost.toFixed(2)}</span>
                </div>
              )}
              {ticket.amountPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagado:</span>
                  <span className="font-medium text-green-600">${ticket.amountPaid.toFixed(2)}</span>
                </div>
              )}
              {(ticket.finalCost > 0 || parseFloat(ticket.estimatedCost || 0) > 0) && (
                <div className="pt-2 border-t flex justify-between font-bold">
                  <span>Pendiente:</span>
                  <span>${(ticket.finalCost || parseFloat(ticket.estimatedCost || 0)) - ticket.amountPaid}</span>
                </div>
              )}
            </div>
          </section>

          {/* Información de garantía */}
          {ticket.warranties && ticket.warranties.length > 0 && (
            <section className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Garantía</h2>
              {ticket.warranties.map((warranty: any) => (
                <div key={warranty.id}>
                  <p className={`font-medium ${warranty.status === 'ACTIVE' ? 'text-green-600' : ''}`}>
                    {warranty.status === 'ACTIVE' ? '✅ Activa' : warranty.status}
                  </p>
                  <p className="text-sm">
                    Vence: {new Date(warranty.endDate).toLocaleDateString('es-ES')}
                  </p>
                </div>
              ))}
            </section>
          )}

          {/* Timeline */}
          <section className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5"></div>
                <div>
                  <p className="font-medium">Ticket Creado</p>
                  <p className="text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {ticket.deliveredAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5"></div>
                  <div>
                    <p className="font-medium">Entregado</p>
                    <p className="text-muted-foreground">
                      {new Date(ticket.deliveredAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTicketById } from '@/server/actions/ticket.actions';

export default function TicketPrintPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState<'thermal' | 'a4'>('thermal');

  useEffect(() => {
    const loadTicket = async () => {
      if (params.id) {
        const data = await getTicketById(params.id as string);
        setTicket(data);
        setLoading(false);
      }
    };
    loadTicket();
  }, [params.id]);

  useEffect(() => {
    // Imprimir automáticamente al cargar
    if (ticket && !loading) {
      window.print();
    }
  }, [ticket, loading]);

  if (loading) {
    return <div className="p-8 text-center">Cargando ticket...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-red-600">Ticket no encontrado</div>;
  }

  const photos = ticket.photos ? JSON.parse(ticket.photos) : [];
  const formattedDate = new Date(ticket.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: ${printMode === 'thermal' ? '80mm auto' : 'A4'};
            margin: ${printMode === 'thermal' ? '5mm' : '10mm'};
          }
          
          body * {
            visibility: hidden;
          }
          
          #print-content, #print-content * {
            visibility: visible;
          }
          
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-8">
        {/* Controles antes de imprimir */}
        <div className="no-print max-w-4xl mx-auto mb-6 px-4">
          <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Vista Previa de Impresión</h1>
              <p className="text-sm text-muted-foreground">Ticket #{ticket.number}</p>
            </div>
            <div className="flex gap-4">
              <select
                value={printMode}
                onChange={(e) => setPrintMode(e.target.value as 'thermal' | 'a4')}
                className="px-3 py-2 border rounded-md"
              >
                <option value="thermal">Formato Térmico (80mm)</option>
                <option value="a4">Formato A4</option>
              </select>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Imprimir
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border rounded-md hover:bg-muted"
              >
                Volver
              </button>
            </div>
          </div>
        </div>

        {/* Contenido a imprimir */}
        <div id="print-content" className={`${printMode === 'thermal' ? 'max-w-[80mm]' : 'max-w-4xl'} mx-auto bg-white p-6 shadow-lg`}>
          {/* Encabezado */}
          <div className={`text-center mb-4 ${printMode === 'thermal' ? 'border-b-2 border-black pb-4' : 'border-b pb-6'}`}>
            <h1 className={`font-bold ${printMode === 'thermal' ? 'text-lg' : 'text-2xl'}`}>SERVICIO TÉCNICO</h1>
            <p className="text-xs mt-1">Saman Digital POS</p>
            <p className="text-xs">Ticket de Reparación</p>
          </div>

          {/* Número de Ticket */}
          <div className={`text-center mb-4 ${printMode === 'thermal' ? '' : 'py-4'}`}>
            <p className={`font-bold ${printMode === 'thermal' ? 'text-xl' : 'text-4xl'}`}>{ticket.number}</p>
            {printMode === 'thermal' && <p className="text-xs">{formattedDate}</p>}
          </div>

          {/* Datos del Cliente */}
          <div className={`mb-4 ${printMode === 'thermal' ? 'text-xs' : 'mb-6'}`}>
            <h2 className={`font-bold mb-2 ${printMode === 'thermal' ? 'text-sm underline' : 'text-lg'}`}>DATOS DEL CLIENTE</h2>
            <p><strong>Nombre:</strong> {ticket.client.name}</p>
            <p><strong>Teléfono:</strong> {ticket.client.phone}</p>
            {ticket.client.email && <p><strong>Email:</strong> {ticket.client.email}</p>}
          </div>

          {/* Datos del Equipo */}
          <div className={`mb-4 ${printMode === 'thermal' ? 'text-xs' : 'mb-6'}`}>
            <h2 className={`font-bold mb-2 ${printMode === 'thermal' ? 'text-sm underline' : 'text-lg'}`}>DATOS DEL EQUIPO</h2>
            <p><strong>Marca:</strong> {ticket.deviceBrand}</p>
            <p><strong>Modelo:</strong> {ticket.deviceModel}</p>
            {ticket.deviceSerial && <p><strong>IMEI/Serie:</strong> {ticket.deviceSerial}</p>}
            {ticket.devicePassword && <p><strong>Contraseña:</strong> {'•'.repeat(ticket.devicePassword.length)}</p>}
          </div>

          {/* Problema Reportado */}
          <div className={`mb-4 ${printMode === 'thermal' ? 'text-xs' : 'mb-6'}`}>
            <h2 className={`font-bold mb-2 ${printMode === 'thermal' ? 'text-sm underline' : 'text-lg'}`}>PROBLEMA REPORTADO</h2>
            <p className="whitespace-pre-wrap">{ticket.issue}</p>
            {ticket.problemType && (
              <p className="mt-2"><strong>Tipo:</strong> {ticket.problemType}</p>
            )}
            {ticket.isWarrantyService && (
              <p className="text-red-600 font-bold">⚠️ SERVICIO POR GARANTÍA</p>
            )}
          </div>

          {/* Estimado */}
          <div className={`mb-4 ${printMode === 'thermal' ? 'text-xs' : 'mb-6'}`}>
            <h2 className={`font-bold mb-2 ${printMode === 'thermal' ? 'text-sm underline' : 'text-lg'}`}>ESTIMADO</h2>
            <p><strong>Costo Estimado:</strong> ${parseFloat(ticket.estimatedCost || 0).toFixed(2)}</p>
            <p><strong>Tiempo Estimado:</strong> {ticket.warrantyExpiry ? new Date(ticket.warrantyExpiry).toLocaleDateString('es-ES') : '3-5 días hábiles'}</p>
          </div>

          {/* Fotos (solo en A4) */}
          {printMode === 'a4' && photos.length > 0 && (
            <div className="mb-6">
              <h2 className="font-bold mb-2 text-lg">FOTOS DEL EQUIPO</h2>
              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo: string, index: number) => (
                  <div key={index} className="border rounded overflow-hidden">
                    <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-32 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {ticket.notes && (
            <div className={`mb-4 ${printMode === 'thermal' ? 'text-xs' : 'mb-6'}`}>
              <h2 className={`font-bold mb-2 ${printMode === 'thermal' ? 'text-sm underline' : 'text-lg'}`}>NOTAS</h2>
              <p className="whitespace-pre-wrap">{ticket.notes}</p>
            </div>
          )}

          {/* Pie de página */}
          <div className={`mt-6 pt-4 ${printMode === 'thermal' ? 'border-t-2 border-black text-xs text-center' : 'border-t text-center'}`}>
            {printMode === 'thermal' ? (
              <>
                <p className="font-bold">Garantía: 8 días</p>
                <p>Conserve este ticket para su garantía</p>
                <p className="mt-2">{formattedDate}</p>
              </>
            ) : (
              <>
                <p className="mb-2"><strong>Fecha de Ingreso:</strong> {formattedDate}</p>
                <p className="mb-2"><strong>Garantía:</strong> 8 días desde la entrega</p>
                <p className="text-sm text-muted-foreground">
                  Términos: La garantía cubre defectos de fabricación. No cubre daños por mal uso, líquidos o golpes.
                </p>
                <div className="mt-8 flex justify-between">
                  <div className="text-center">
                    <div className="border-t border-black w-48 pt-2">Firma del Cliente</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-black w-48 pt-2">Recibido por</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

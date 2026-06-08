'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTicket, searchClient, quickCreateClient } from '@/server/actions/ticket.actions';
import { BUSINESS_CONSTANTS } from '@/lib/constants/business-constants';

const COMMON_BRANDS = ['Samsung', 'Apple', 'Huawei', 'Xiaomi', 'Motorola', 'LG', 'Otros'];
const PROBLEM_TYPES = [
  { value: 'PANTALLA', label: 'Cambio de Pantalla' },
  { value: 'PIN_CARGA', label: 'Pin de Carga' },
  { value: 'REVISION_GENERAL', label: 'Revisión General' },
  { value: 'OTRO', label: 'Otro' },
];

export default function IngresarEquipoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Datos del cliente
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', address: '' });
  const [clientDebtAlert, setClientDebtAlert] = useState<string | null>(null);

  // Datos del equipo
  const [formData, setFormData] = useState({
    deviceBrand: '',
    deviceModel: '',
    deviceColor: '',
    deviceSerial: '',
    devicePassword: '',
    problemType: '',
    isWarranty: false,
    issueDescription: '',
    estimatedCost: '',
    estimatedDays: '3',
    notes: '',
  });

  // Fotos
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Búsqueda de clientes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2 && !selectedClient) {
        const results = await searchClient(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedClient]);

  // Manejar selección de cliente
  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    setSearchQuery('');
    setSearchResults([]);
    if (client.debtBalance > 0) {
      setClientDebtAlert(`⚠️ El cliente tiene una deuda pendiente de $${client.debtBalance}`);
    } else {
      setClientDebtAlert(null);
    }
  };

  // Crear nuevo cliente
  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.phone) {
      setMessage({ type: 'error', text: 'Nombre y teléfono son requeridos' });
      return;
    }

    const result = await quickCreateClient(newClient);
    if (result.success) {
      setSelectedClient(result.data);
      setShowNewClientForm(false);
      setMessage({ type: 'success', text: 'Cliente creado exitosamente' });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  // Manejar cambio en inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Manejar subida de fotos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 4 - photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotos(prev => [...prev, base64]);
        setPhotoPreviews(prev => [...prev, URL.createObjectURL(file)]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remover foto
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      setMessage({ type: 'error', text: 'Debe seleccionar o crear un cliente' });
      return;
    }

    if (!formData.deviceBrand || !formData.deviceModel || !formData.issueDescription) {
      setMessage({ type: 'error', text: 'Complete los campos obligatorios del equipo' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await createTicket({
      clientId: selectedClient.id,
      deviceBrand: formData.deviceBrand,
      deviceModel: formData.deviceModel,
      deviceSerial: formData.deviceSerial || null,
      devicePassword: formData.devicePassword || null,
      issue: formData.issueDescription,
      problemType: formData.problemType || null,
      isWarrantyService: formData.isWarranty,
      estimatedCost: parseFloat(formData.estimatedCost) || 0,
      estimatedDays: parseInt(formData.estimatedDays) || 3,
      notes: formData.notes || null,
      photos: photos,
    });

    setLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: 'Ticket creado exitosamente' });
      // Redirigir a la vista del ticket
      setTimeout(() => {
        router.push(`/servicios/tickets/${result.data.id}`);
      }, 1000);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ingreso de Equipo</h1>
        <p className="text-muted-foreground">Registrar nuevo equipo para reparación</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* DATOS DEL CLIENTE */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Datos del Cliente</h2>

          {!selectedClient ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Buscar Cliente</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nombre o teléfono..."
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={showNewClientForm}
                />

                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
                    {searchResults.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full p-3 text-left hover:bg-muted border-b last:border-b-0"
                      >
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.phone}</div>
                        {client.debtBalance > 0 && (
                          <div className="text-xs text-red-600 mt-1">Deuda: ${client.debtBalance}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">¿Cliente nuevo?</span>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="text-sm text-primary underline"
                >
                  {showNewClientForm ? 'Cancelar' : 'Crear nuevo cliente'}
                </button>
              </div>

              {showNewClientForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-muted/50">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre *</label>
                    <input
                      type="text"
                      value={newClient.name}
                      onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Teléfono *</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Dirección</label>
                    <input
                      type="text"
                      value={newClient.address}
                      onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleCreateClient}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Guardar Cliente
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 border rounded-md bg-muted/50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{selectedClient.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                  {selectedClient.email && (
                    <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                  )}
                  {selectedClient.debtBalance > 0 && (
                    <p className="text-sm text-red-600 mt-2">⚠️ Deuda pendiente: ${selectedClient.debtBalance}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientDebtAlert(null);
                  }}
                  className="text-sm text-destructive underline"
                >
                  Cambiar
                </button>
              </div>
            </div>
          )}

          {clientDebtAlert && (
            <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              {clientDebtAlert}
            </div>
          )}
        </section>

        {/* DATOS DEL EQUIPO */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Datos del Equipo</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Marca *</label>
              <input
                type="text"
                name="deviceBrand"
                value={formData.deviceBrand}
                onChange={handleChange}
                list="brands-list"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
              <datalist id="brands-list">
                {COMMON_BRANDS.map(brand => (
                  <option key={brand} value={brand} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Modelo *</label>
              <input
                type="text"
                name="deviceModel"
                value={formData.deviceModel}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <input
                type="text"
                name="deviceColor"
                value={formData.deviceColor}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">IMEI / Número de Serie</label>
              <input
                type="text"
                name="deviceSerial"
                value={formData.deviceSerial}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contraseña del Equipo</label>
              <input
                type="text"
                name="devicePassword"
                value={formData.devicePassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Opcional"
              />
            </div>
          </div>
        </section>

        {/* TIPO DE PROBLEMA */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Tipo de Problema</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Problema</label>
              <select
                name="problemType"
                value={formData.problemType}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Seleccione...</option>
                {PROBLEM_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {formData.problemType === 'PANTALLA' && (
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  name="isWarranty"
                  checked={formData.isWarranty}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">¿Es por garantía?</label>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Descripción del Problema *</label>
            <textarea
              name="issueDescription"
              value={formData.issueDescription}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Describa detalladamente el problema reportado por el cliente..."
              required
            />
          </div>
        </section>

        {/* FOTOS DEL EQUIPO */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Fotos del Equipo</h2>
          <p className="text-sm text-muted-foreground mb-4">Suba hasta 4 fotos como evidencia de daños previos</p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Seleccionar Fotos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              disabled={photos.length >= 4}
              className="w-full px-3 py-2 border rounded-md"
            />
            {photos.length >= 4 && (
              <p className="text-xs text-muted-foreground mt-1">Máximo 4 fotos permitidas</p>
            )}
          </div>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square border rounded-md overflow-hidden">
                  <img src={preview} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* EVALUACIÓN */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Evaluación Inicial</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Estimado de Costo ($)</label>
              <input
                type="number"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tiempo Estimado (días)</label>
              <input
                type="number"
                name="estimatedDays"
                value={formData.estimatedDays}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Notas Adicionales</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Observaciones adicionales..."
            />
          </div>
        </section>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !selectedClient}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar Ticket'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-md hover:bg-muted"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Utilidades comunes - Saman Digital POS
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind de forma inteligente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como moneda (Bolívares o Dólares)
 */
export function formatCurrency(amount: number, currency: 'VES' | 'USD' = 'USD'): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formatea una fecha en formato local
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  return new Intl.DateTimeFormat('es-VE', options ?? defaultOptions).format(dateObj)
}

/**
 * Formatea una fecha y hora
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Genera un número secuencial con ceros a la izquierda
 * Ej: padNumber(1, 3) => "001"
 */
export function padNumber(num: number, length: number = 3): string {
  return String(num).padStart(length, '0')
}

/**
 * Genera el número de ticket con formato TK-YYYYMMDD-NNN
 */
export function generateTicketNumber(date: Date, sequence: number): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = padNumber(sequence, 3)
  
  return `TK-${year}${month}${day}-${seq}`
}

/**
 * Genera el número de venta con formato V-YYYYMMDD-NNN
 */
export function generateSaleNumber(date: Date, sequence: number): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = padNumber(sequence, 3)
  
  return `V-${year}${month}${day}-${seq}`
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Verifica si una garantía está dentro del período válido
 */
export function isWarrantyValid(deliveryDate: Date | string, warrantyDays: number): boolean {
  const delivery = typeof deliveryDate === 'string' ? new Date(deliveryDate) : deliveryDate
  const today = new Date()
  const endDate = new Date(delivery)
  endDate.setDate(endDate.getDate() + warrantyDays)
  
  return today <= endDate
}

/**
 * Obtiene los días restantes de garantía
 */
export function getRemainingWarrantyDays(deliveryDate: Date | string, warrantyDays: number): number {
  const delivery = typeof deliveryDate === 'string' ? new Date(deliveryDate) : deliveryDate
  const today = new Date()
  const endDate = new Date(delivery)
  endDate.setDate(endDate.getDate() + warrantyDays)
  
  const diffTime = endDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Trunca un texto y añade puntos suspensivos
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Genera un link de WhatsApp pre-redactado
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  // Eliminar caracteres no numéricos del teléfono
  const cleanPhone = phone.replace(/\D/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Valida que un email sea válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida que un teléfono venezolano sea válido (formato simple)
 */
export function isValidVenezuelanPhone(phone: string): boolean {
  // Eliminar espacios y caracteres especiales
  const cleanPhone = phone.replace(/\D/g, '')
  // Debe tener 10 o 11 dígitos (con o sin el 0 inicial)
  return /^\d{10,11}$/.test(cleanPhone)
}

/**
 * Convierte un objeto a query string para URLs
 */
export function objectToQueryString(obj: Record<string, string | number | boolean | null>): string {
  return Object.entries(obj)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

/**
 * Parsea un query string a objeto
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {}
  const search = queryString.startsWith('?') ? queryString.slice(1) : queryString
  
  search.split('&').forEach(pair => {
    const [key, value] = pair.split('=')
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
  })
  
  return params
}

/**
 * Debounce para funciones asíncronas
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Obtiene el initials de un nombre para avatares
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Sleep utility para delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

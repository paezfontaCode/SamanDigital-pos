/**
 * Template para Recibo de Servicio (ServiceReceipt)
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface ServiceReceiptProps {
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    rif: string;
  };
  ticketNumber: string;
  date: string;
  client: {
    name: string;
    document?: string;
    phone: string;
    email?: string;
  };
  device: {
    brand: string;
    model: string;
    serial?: string;
    password?: string;
  };
  issue: string;
  diagnosis?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    type: 'repuesto' | 'mano_obra';
  }>;
  estimatedTotal?: number;
  finalTotal?: number;
  warrantyInfo: {
    days: number;
    expiryDate: string;
    conditions: string;
  };
  status: 'estimated' | 'final';
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #000',
    paddingBottom: 10,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  businessInfo: {
    fontSize: 9,
    textAlign: 'center',
    color: '#666',
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  ticketNumber: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  section: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionData: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    color: '#fff',
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    fontSize: 9,
    borderBottom: '1 solid #ddd',
  },
  tableColDesc: { width: '40%' },
  tableColQty: { width: '12%', textAlign: 'center' as const },
  tableColPrice: { width: '18%', textAlign: 'right' as const },
  tableColSubtotal: { width: '18%', textAlign: 'right' as const },
  tableColType: { width: '12%', textAlign: 'center' as const },
  totals: {
    marginTop: 15,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    fontSize: 9,
    marginBottom: 3,
  },
  totalLabel: {
    width: 120,
    textAlign: 'right',
    marginRight: 10,
  },
  totalValue: {
    width: 80,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 11,
    fontWeight: 'bold',
    borderTop: '2 solid #000',
    paddingTop: 5,
    marginTop: 5,
  },
  warrantySection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    border: '1 solid #ffc107',
  },
  warrantyTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  warrantyData: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
  statusBadge: {
    fontSize: 9,
    padding: '3 8',
    borderRadius: 3,
    backgroundColor: '#007bff',
    color: '#fff',
    textAlign: 'center' as const,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
});

export const ServiceReceipt: React.FC<ServiceReceiptProps> = ({
  businessInfo,
  ticketNumber,
  date,
  client,
  device,
  issue,
  diagnosis,
  items,
  estimatedTotal,
  finalTotal,
  warrantyInfo,
  status,
}) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.businessName}>{businessInfo.name}</Text>
        <Text style={styles.businessInfo}>{businessInfo.address}</Text>
        <Text style={styles.businessInfo}>Teléfono: {businessInfo.phone}</Text>
        <Text style={styles.businessInfo}>RIF/NIT: {businessInfo.rif}</Text>
      </View>

      {/* Title */}
      <Text style={styles.receiptTitle}>RECIBO DE SERVICIO TÉCNICO</Text>
      <Text style={styles.ticketNumber}>Ticket N°: {ticketNumber}</Text>
      
      {/* Status Badge */}
      <View style={styles.statusBadge}>
        <Text>{status === 'estimated' ? 'PRESUPUESTO' : 'SERVICIO COMPLETADO'}</Text>
      </View>

      {/* Date */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 9 }}>Fecha: {date}</Text>
      </View>

      {/* Client Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del Cliente:</Text>
        <Text style={styles.sectionData}>Nombre: {client.name}</Text>
        {client.document && <Text style={styles.sectionData}>Documento: {client.document}</Text>}
        <Text style={styles.sectionData}>Teléfono: {client.phone}</Text>
        {client.email && <Text style={styles.sectionData}>Email: {client.email}</Text>}
      </View>

      {/* Device Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del Equipo:</Text>
        <Text style={styles.sectionData}>Marca: {device.brand}</Text>
        <Text style={styles.sectionData}>Modelo: {device.model}</Text>
        {device.serial && <Text style={styles.sectionData}>Serial: {device.serial}</Text>}
        {device.password && <Text style={styles.sectionData}>Contraseña: {device.password}</Text>}
      </View>

      {/* Issue / Diagnosis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Problema Reportado:</Text>
        <Text style={styles.sectionData}>{issue}</Text>
        {diagnosis && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Diagnóstico:</Text>
            <Text style={styles.sectionData}>{diagnosis}</Text>
          </>
        )}
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableColDesc}>Descripción</Text>
          <Text style={styles.tableColQty}>Cant.</Text>
          <Text style={styles.tableColPrice}>P. Unit</Text>
          <Text style={styles.tableColSubtotal}>Subtotal</Text>
          <Text style={styles.tableColType}>Tipo</Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableColDesc}>{item.description}</Text>
            <Text style={styles.tableColQty}>{item.quantity}</Text>
            <Text style={styles.tableColPrice}>{item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.tableColSubtotal}>{item.subtotal.toFixed(2)}</Text>
            <Text style={styles.tableColType}>{item.type === 'repuesto' ? 'Repuesto' : 'M.O.'}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.totalLabel}>
            {status === 'estimated' ? 'TOTAL ESTIMADO:' : 'TOTAL FINAL:'}
          </Text>
          <Text style={styles.totalValue}>
            {(status === 'estimated' ? estimatedTotal : finalTotal)?.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Warranty Info */}
      <View style={styles.warrantySection}>
        <Text style={styles.warrantyTitle}>INFORMACIÓN DE GARANTÍA</Text>
        <Text style={styles.warrantyData}>Duración: {warrantyInfo.days} días</Text>
        <Text style={styles.warrantyData}>Vence: {warrantyInfo.expiryDate}</Text>
        <Text style={styles.warrantyData}>Condiciones: {warrantyInfo.conditions}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Gracias por confiar en nuestros servicios técnicos.</Text>
        <Text>La garantía cubre defectos de fabricación, no daños por mal uso.</Text>
      </View>
    </Page>
  </Document>
);

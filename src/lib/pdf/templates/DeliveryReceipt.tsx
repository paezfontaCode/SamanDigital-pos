/**
 * Template para Comprobante de Entrega (DeliveryReceipt)
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface DeliveryReceiptProps {
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    rif: string;
  };
  ticketNumber: string;
  deliveryDate: string;
  client: {
    name: string;
    document?: string;
    phone: string;
  };
  device: {
    brand: string;
    model: string;
    serial?: string;
  };
  repairDetails: {
    issue: string;
    diagnosis: string;
    workDone: string;
  };
  totalCost: number;
  amountPaid: number;
  pendingBalance: number;
  warrantyInfo: {
    days: number;
    expiryDate: string;
    conditions: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000',
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
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    backgroundColor: '#28a745',
    color: '#fff',
    padding: 10,
    borderRadius: 4,
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
  financialBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#fff',
    border: '2 solid #28a745',
    borderRadius: 4,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    marginBottom: 8,
  },
  financialLabel: {
    fontWeight: 'normal',
  },
  financialValue: {
    fontWeight: 'bold',
  },
  totalHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #28a745',
  },
  pendingHighlight: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  warrantySection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    border: '1 solid #28a745',
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
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1 solid #000',
  },
  signatureLine: {
    marginTop: 40,
    borderTop: '1 solid #000',
    paddingTop: 5,
    fontSize: 9,
    textAlign: 'center' as const,
  },
  signatureText: {
    fontSize: 9,
    textAlign: 'center' as const,
    marginTop: 5,
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
});

export const DeliveryReceipt: React.FC<DeliveryReceiptProps> = ({
  businessInfo,
  ticketNumber,
  deliveryDate,
  client,
  device,
  repairDetails,
  totalCost,
  amountPaid,
  pendingBalance,
  warrantyInfo,
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
      <Text style={styles.receiptTitle}>COMPROBANTE DE ENTREGA</Text>

      {/* Ticket Number and Date */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
        <Text style={{ fontSize: 10 }}>Ticket N°: {ticketNumber}</Text>
        <Text style={{ fontSize: 10 }}>Fecha de Entrega: {deliveryDate}</Text>
      </View>

      {/* Client Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del Cliente:</Text>
        <Text style={styles.sectionData}>Nombre: {client.name}</Text>
        {client.document && <Text style={styles.sectionData}>Documento: {client.document}</Text>}
        <Text style={styles.sectionData}>Teléfono: {client.phone}</Text>
      </View>

      {/* Device Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del Equipo Reparado:</Text>
        <Text style={styles.sectionData}>Marca: {device.brand}</Text>
        <Text style={styles.sectionData}>Modelo: {device.model}</Text>
        {device.serial && <Text style={styles.sectionData}>Serial: {device.serial}</Text>}
      </View>

      {/* Repair Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalle de la Reparación:</Text>
        <Text style={styles.sectionData}>Problema Reportado: {repairDetails.issue}</Text>
        <Text style={styles.sectionData}>Diagnóstico: {repairDetails.diagnosis}</Text>
        <Text style={styles.sectionData}>Trabajo Realizado: {repairDetails.workDone}</Text>
      </View>

      {/* Financial Information */}
      <View style={styles.financialBox}>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Costo Total de Reparación:</Text>
          <Text style={styles.financialValue}>{totalCost.toFixed(2)}</Text>
        </View>
        <View style={styles.financialRow}>
          <Text style={styles.financialLabel}>Monto Pagado:</Text>
          <Text style={[styles.financialValue, { color: '#28a745' }]}>{amountPaid.toFixed(2)}</Text>
        </View>
        {pendingBalance > 0 ? (
          <>
            <View style={[styles.financialRow, styles.totalHighlight]}>
              <Text style={[styles.financialLabel, { fontSize: 11 }]}>SALDO PENDIENTE:</Text>
              <Text style={[styles.financialValue, { fontSize: 14, color: '#dc3545' }]}>
                {pendingBalance.toFixed(2)}
              </Text>
            </View>
            <View style={styles.pendingHighlight}>
              <Text style={{ fontSize: 9, color: '#856404' }}>
                ⚠ El cliente tiene un saldo pendiente de {pendingBalance.toFixed(2)}
              </Text>
            </View>
          </>
        ) : (
          <View style={[styles.financialRow, styles.totalHighlight]}>
            <Text style={[styles.financialLabel, { fontSize: 11 }]}>ESTADO:</Text>
            <Text style={[styles.financialValue, { fontSize: 14, color: '#28a745' }]}>
              PAGADO COMPLETO ✓
            </Text>
          </View>
        )}
      </View>

      {/* Warranty Info */}
      <View style={styles.warrantySection}>
        <Text style={styles.warrantyTitle}>GARANTÍA DEL SERVICIO</Text>
        <Text style={styles.warrantyData}>Duración: {warrantyInfo.days} días calendario</Text>
        <Text style={styles.warrantyData}>Vence: {warrantyInfo.expiryDate}</Text>
        <Text style={styles.warrantyData}>Condiciones: {warrantyInfo.conditions}</Text>
        <Text style={[styles.warrantyData, { marginTop: 5, fontStyle: 'italic' }]}>
          * La garantía no cubre daños por mal uso, golpes, líquidos o manipulación por terceros.
        </Text>
      </View>

      {/* Signature Section */}
      <View style={styles.signatureSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ width: '40%' }}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureText}>Recibido por (Cliente)</Text>
            </View>
            <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 5 }}>
              Nombre y Firma
            </Text>
          </View>
          <View style={{ width: '40%' }}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureText}>Entregado por (Técnico)</Text>
            </View>
            <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 5 }}>
              Nombre y Firma
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Gracias por confiar en nuestros servicios.</Text>
        <Text>Para cualquier reclamo dentro de garantía, presente este comprobante.</Text>
      </View>
    </Page>
  </Document>
);

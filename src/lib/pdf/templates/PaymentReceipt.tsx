/**
 * Template para Recibo de Abono/Pago (PaymentReceipt)
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PaymentReceiptProps {
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    rif: string;
  };
  receiptNumber: string;
  date: string;
  time: string;
  client: {
    name: string;
    document?: string;
    phone?: string;
  };
  paymentAmount: number;
  paymentMethod: string;
  previousBalance: number;
  newBalance: number;
  concept: {
    type: 'venta' | 'ticket';
    referenceId: string;
    description: string;
  };
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
  receiptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    fontSize: 9,
  },
  clientSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  clientTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  clientData: {
    fontSize: 9,
  },
  conceptSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#e8f4fd',
    borderRadius: 4,
  },
  conceptTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  conceptData: {
    fontSize: 9,
  },
  balanceBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#fff',
    border: '2 solid #007bff',
    borderRadius: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 10,
    marginBottom: 8,
  },
  balanceLabel: {
    fontWeight: 'normal',
  },
  balanceValue: {
    fontWeight: 'bold',
  },
  paymentHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1 solid #ddd',
  },
  paymentLabel: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  paymentValue: {
    fontWeight: 'bold',
    color: '#28a745',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
    borderTop: '1 solid #ddd',
    paddingTop: 10,
  },
});

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  businessInfo,
  receiptNumber,
  date,
  time,
  client,
  paymentAmount,
  paymentMethod,
  previousBalance,
  newBalance,
  concept,
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
      <Text style={styles.receiptTitle}>RECIBO DE ABONO</Text>

      {/* Receipt Meta */}
      <View style={styles.receiptMeta}>
        <Text>Número: {receiptNumber}</Text>
        <Text>Fecha: {date}</Text>
        <Text>Hora: {time}</Text>
      </View>

      {/* Client Info */}
      <View style={styles.clientSection}>
        <Text style={styles.clientTitle}>Datos del Cliente:</Text>
        <Text style={styles.clientData}>Nombre: {client.name}</Text>
        {client.document && <Text style={styles.clientData}>Documento: {client.document}</Text>}
        {client.phone && <Text style={styles.clientData}>Teléfono: {client.phone}</Text>}
      </View>

      {/* Concept Info */}
      <View style={styles.conceptSection}>
        <Text style={styles.conceptTitle}>Concepto del Pago:</Text>
        <Text style={styles.conceptData}>
          Tipo: {concept.type === 'venta' ? 'Venta' : 'Servicio Técnico'}
        </Text>
        <Text style={styles.conceptData}>Referencia: {concept.referenceId}</Text>
        <Text style={styles.conceptData}>{concept.description}</Text>
      </View>

      {/* Balance Information */}
      <View style={styles.balanceBox}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Saldo Anterior:</Text>
          <Text style={styles.balanceValue}>{previousBalance.toFixed(2)}</Text>
        </View>
        <View style={[styles.balanceRow, styles.paymentHighlight]}>
          <Text style={styles.paymentLabel}>Abono Realizado:</Text>
          <Text style={styles.paymentValue}>+ {paymentAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Método de Pago:</Text>
          <Text style={styles.balanceValue}>{paymentMethod}</Text>
        </View>
        <View style={[styles.balanceRow, { marginTop: 10, paddingTop: 10, borderTop: '2 solid #007bff' }]}>
          <Text style={[styles.balanceLabel, { fontSize: 11 }]}>NUEVO SALDO:</Text>
          <Text style={[styles.balanceValue, { fontSize: 14, color: newBalance > 0 ? '#dc3545' : '#28a745' }]}>
            {newBalance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Este recibo es un comprobante de pago parcial o total.</Text>
        <Text>Consérvelo para cualquier reclamación.</Text>
      </View>
    </Page>
  </Document>
);

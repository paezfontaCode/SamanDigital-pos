/**
 * Template para Recibo de Venta (SaleReceipt)
 */
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

interface SaleReceiptProps {
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    rif: string;
    logo?: string;
  };
  receiptNumber: string;
  date: string;
  time: string;
  client?: {
    name: string;
    document?: string;
    phone?: string;
  };
  items: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
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
    marginBottom: 10,
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
  tableColProduct: { width: '45%' },
  tableColQty: { width: '15%', textAlign: 'center' as const },
  tableColPrice: { width: '20%', textAlign: 'right' as const },
  tableColSubtotal: { width: '20%', textAlign: 'right' as const },
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
    width: 100,
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
  paymentMethod: {
    marginTop: 15,
    fontSize: 9,
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

export const SaleReceipt: React.FC<SaleReceiptProps> = ({
  businessInfo,
  receiptNumber,
  date,
  time,
  client,
  items,
  subtotal,
  discount,
  total,
  paymentMethod,
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
      <Text style={styles.receiptTitle}>RECIBO DE VENTA</Text>

      {/* Receipt Meta */}
      <View style={styles.receiptMeta}>
        <Text>Número: {receiptNumber}</Text>
        <Text>Fecha: {date}</Text>
        <Text>Hora: {time}</Text>
      </View>

      {/* Client Info */}
      {client && (
        <View style={styles.clientSection}>
          <Text style={styles.clientTitle}>Datos del Cliente:</Text>
          <Text style={styles.clientData}>Nombre: {client.name}</Text>
          {client.document && <Text style={styles.clientData}>Documento: {client.document}</Text>}
          {client.phone && <Text style={styles.clientData}>Teléfono: {client.phone}</Text>}
        </View>
      )}

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableColProduct}>Producto</Text>
          <Text style={styles.tableColQty}>Cant.</Text>
          <Text style={styles.tableColPrice}>P. Unit</Text>
          <Text style={styles.tableColSubtotal}>Subtotal</Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableColProduct}>{item.product}</Text>
            <Text style={styles.tableColQty}>{item.quantity}</Text>
            <Text style={styles.tableColPrice}>{item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.tableColSubtotal}>{item.subtotal.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{subtotal.toFixed(2)}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Descuento:</Text>
            <Text style={styles.totalValue}>-{discount.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalValue}>{total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Payment Method */}
      <View style={styles.paymentMethod}>
        <Text>Método de Pago: {paymentMethod}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>¡Gracias por su compra!</Text>
      </View>
    </Page>
  </Document>
);

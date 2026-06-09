/**
 * Template para Ticket de Ingreso (TicketPrint)
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface TicketPrintProps {
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    rif: string;
  };
  ticketNumber: string;
  ingressDate: string;
  ingressTime: string;
  client: {
    name: string;
    document?: string;
    phone: string;
  };
  device: {
    brand: string;
    model: string;
    serial?: string;
    password?: string;
    accessories?: string[];
  };
  issue: string;
  estimatedCost?: number;
  estimatedTime?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 15,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  businessInfo: {
    fontSize: 8,
    textAlign: 'center',
    color: '#666',
  },
  ticketNumberBox: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  ticketNumberLabel: {
    fontSize: 10,
    color: '#fff',
    marginBottom: 5,
  },
  ticketNumberValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 3,
  },
  section: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  sectionData: {
    fontSize: 8,
    lineHeight: 1.3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 8,
  },
  estimateBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    border: '1 dashed #ffc107',
  },
  estimateTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#856404',
  },
  estimateData: {
    fontSize: 8,
    color: '#856404',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 7,
    color: '#666',
    borderTop: '1 solid #ddd',
    paddingTop: 8,
  },
  warningText: {
    fontSize: 7,
    color: '#dc3545',
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export const TicketPrint: React.FC<TicketPrintProps> = ({
  businessInfo,
  ticketNumber,
  ingressDate,
  ingressTime,
  client,
  device,
  issue,
  estimatedCost,
  estimatedTime,
}) => {
  // Extract short code from ticket number for display
  const shortCode = ticketNumber.split('-').pop() || ticketNumber;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.businessName}>{businessInfo.name}</Text>
          <Text style={styles.businessInfo}>{businessInfo.address}</Text>
          <Text style={styles.businessInfo}>Teléfono: {businessInfo.phone}</Text>
          <Text style={styles.businessInfo}>RIF/NIT: {businessInfo.rif}</Text>
        </View>

        {/* Big Ticket Number */}
        <View style={styles.ticketNumberBox}>
          <Text style={styles.ticketNumberLabel}>NÚMERO DE TICKET</Text>
          <Text style={styles.ticketNumberValue}>{shortCode}</Text>
        </View>

        {/* Date and Time */}
        <View style={styles.infoRow}>
          <Text>Fecha de Ingreso: {ingressDate}</Text>
          <Text>Hora: {ingressTime}</Text>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
          <Text style={styles.sectionData}>Nombre: {client.name}</Text>
          {client.document && (
            <Text style={styles.sectionData}>Documento: {client.document}</Text>
          )}
          <Text style={styles.sectionData}>Teléfono: {client.phone}</Text>
        </View>

        {/* Device Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL EQUIPO</Text>
          <Text style={styles.sectionData}>Marca: {device.brand}</Text>
          <Text style={styles.sectionData}>Modelo: {device.model}</Text>
          {device.serial && (
            <Text style={styles.sectionData}>Serial/IMEI: {device.serial}</Text>
          )}
          {device.password && (
            <Text style={styles.sectionData}>Contraseña/Patrón: {device.password}</Text>
          )}
          {device.accessories && device.accessories.length > 0 && (
            <Text style={styles.sectionData}>
              Accesorios dejados: {device.accessories.join(', ')}
            </Text>
          )}
        </View>

        {/* Issue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROBLEMA REPORTADO</Text>
          <Text style={styles.sectionData}>{issue}</Text>
        </View>

        {/* Estimates */}
        {(estimatedCost || estimatedTime) && (
          <View style={styles.estimateBox}>
            <Text style={styles.estimateTitle}>ESTIMADO INICIAL</Text>
            {estimatedCost && (
              <Text style={styles.estimateData}>
                Costo Aproximado: ${estimatedCost.toFixed(2)}
              </Text>
            )}
            {estimatedTime && (
              <Text style={styles.estimateData}>
                Tiempo Estimado: {estimatedTime}
              </Text>
            )}
            <Text style={[styles.estimateData, styles.warningText]}>
              * Este estimado puede variar según diagnóstico final
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Conserve este ticket para reclamar su equipo.</Text>
          <Text>Tiempo máximo de almacenamiento sin retirar: 30 días.</Text>
          <Text style={styles.warningText}>
            Después de 30 días se cobrará $1/día por almacenamiento.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

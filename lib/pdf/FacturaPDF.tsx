import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Helvetica",
    padding: "30px 36px",
    color: "#111113",
    backgroundColor: "#ffffff",
  },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, alignItems: "flex-start" },
  logo:   { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#E84040", letterSpacing: 1 },
  logoSub:{ fontSize: 9, color: "#6b7280", marginTop: 2 },
  docTitle: { textAlign: "right" },
  docTitleText: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#111113" },
  docNumero: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#E84040", marginTop: 2 },
  // Divider
  divider: { borderBottom: "1.5px solid #e5e7eb", marginBottom: 16 },
  // Info grid
  infoRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  infoBox: { flex: 1, backgroundColor: "#f8f8fa", borderRadius: 6, padding: "10px 12px" },
  infoLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111113" },
  infoValueSm: { fontSize: 9, color: "#374151" },
  // Table
  table: { marginTop: 8, marginBottom: 16 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0A0A0B", padding: "6px 8px", borderRadius: "4px 4px 0 0" },
  tableHeaderText: { fontSize: 9, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  tableRow: { flexDirection: "row", padding: "7px 8px", borderBottom: "1px solid #f3f4f6" },
  tableRowAlt: { backgroundColor: "#f9fafb" },
  tableCell: { fontSize: 9.5, color: "#374151" },
  // Totals
  totalsBox: { marginLeft: "auto", width: 220, marginTop: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 8 },
  totalLabel: { fontSize: 9.5, color: "#6b7280" },
  totalValue: { fontSize: 9.5, color: "#111113" },
  totalFinal: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#E84040", padding: "8px 10px", borderRadius: 6, marginTop: 4 },
  totalFinalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  totalFinalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  // Pagos
  pagosTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111113", marginBottom: 6, marginTop: 16 },
  pagoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 8, borderBottom: "1px solid #f3f4f6" },
  // Footer
  footer: { position: "absolute", bottom: 30, left: 36, right: 36, borderTop: "1px solid #e5e7eb", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 9 },
  // Notas
  notasBox: { backgroundColor: "#f8f8fa", borderRadius: 6, padding: "8px 12px", marginTop: 12 },
  notasLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 3, textTransform: "uppercase" },
  notasText: { fontSize: 9, color: "#374151" },
});

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "#f59e0b",
  pagada:    "#22c55e",
  parcial:   "#3b82f6",
  anulada:   "#ef4444",
  vencida:   "#f97316",
};

const TIPO_LABELS: Record<string, string> = {
  factura:      "FACTURA",
  proforma:     "PROFORMA",
  recibo:       "RECIBO",
  nota_credito: "NOTA DE CRÉDITO",
};

const METODO_LABELS: Record<string, string> = {
  efectivo:        "Efectivo",
  tarjeta_credito: "Tarjeta crédito",
  tarjeta_debito:  "Tarjeta débito",
  transferencia:   "Transferencia",
  cheque:          "Cheque",
  otro:            "Otro",
};

interface Linea { descripcion: string; cantidad: number; precio_unitario: number; descuento_pct: number; subtotal: number; }
interface Pago  { fecha: string; metodo: string; monto: number; }

interface FacturaPDFProps {
  factura: {
    numero: string; tipo: string; estado: string; fecha_emision: string;
    sucursal: string; notas?: string; subtotal: number; descuento: number;
    subtotal_neto: number; iva_pct: number; iva_valor: number; total: number;
  };
  cliente: { nombre: string; apellido: string; cedula?: string; telefono?: string; };
  ot?: { numero: number } | null;
  lineas: Linea[];
  pagos: Pago[];
}

function fmt(n: number) {
  return "$" + (n || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFecha(d: string) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function FacturaPDF({ factura, cliente, ot, lineas, pagos }: FacturaPDFProps) {
  const estadoColor = ESTADO_COLORS[factura.estado] || "#6b7280";
  const tipoLabel = TIPO_LABELS[factura.tipo] || factura.tipo.toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>DG MOTORS</Text>
            <Text style={styles.logoSub}>Taller Automotriz · Quito &amp; Guayaquil</Text>
            <Text style={[styles.logoSub, { marginTop: 6 }]}>RUC: 1792XXXXXXXX001</Text>
          </View>
          <View style={styles.docTitle}>
            <Text style={styles.docTitleText}>{tipoLabel}</Text>
            <Text style={styles.docNumero}>{factura.numero}</Text>
            <View style={[styles.badge, { backgroundColor: estadoColor + "22", marginTop: 6, marginLeft: "auto" }]}>
              <Text style={{ fontSize: 9, color: estadoColor, fontFamily: "Helvetica-Bold" }}>
                {factura.estado.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* INFO */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>{cliente.nombre} {cliente.apellido}</Text>
            {cliente.cedula && <Text style={styles.infoValueSm}>CI/RUC: {cliente.cedula}</Text>}
            {cliente.telefono && <Text style={styles.infoValueSm}>Tel: {cliente.telefono}</Text>}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Emisión</Text>
            <Text style={styles.infoValue}>{fmtFecha(factura.fecha_emision)}</Text>
            {ot && <Text style={styles.infoValueSm}>OT-{String(ot.numero).padStart(4, "0")}</Text>}
            <Text style={styles.infoValueSm}>Sucursal: {factura.sucursal === "quito" ? "Quito" : "Guayaquil"}</Text>
          </View>
        </View>

        {/* TABLA DE LÍNEAS */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 4 }]}>Descripción</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>P. Unit.</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>Desc.</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Subtotal</Text>
          </View>
          {lineas.map((l, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, { flex: 4 }]}>{l.descripcion}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>{l.cantidad}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>{fmt(l.precio_unitario)}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>
                {l.descuento_pct > 0 ? `${l.descuento_pct}%` : "—"}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                {fmt(l.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTALES */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(factura.subtotal)}</Text>
          </View>
          {factura.descuento > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: "#22c55e" }]}>Descuento</Text>
              <Text style={[styles.totalValue, { color: "#22c55e" }]}>- {fmt(factura.descuento)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA {factura.iva_pct}%</Text>
            <Text style={styles.totalValue}>{fmt(factura.iva_valor)}</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>TOTAL</Text>
            <Text style={styles.totalFinalValue}>{fmt(factura.total)}</Text>
          </View>
        </View>

        {/* PAGOS */}
        {pagos.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.pagosTitle}>Pagos registrados</Text>
            {pagos.map((p, i) => (
              <View key={i} style={styles.pagoRow}>
                <Text style={{ fontSize: 9, color: "#374151" }}>{fmtFecha(p.fecha)}</Text>
                <Text style={{ fontSize: 9, color: "#374151" }}>{METODO_LABELS[p.metodo] || p.metodo}</Text>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111113" }}>{fmt(p.monto)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* NOTAS */}
        {factura.notas && (
          <View style={styles.notasBox}>
            <Text style={styles.notasLabel}>Notas</Text>
            <Text style={styles.notasText}>{factura.notas}</Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>DG Motors — Taller Automotriz</Text>
          <Text style={styles.footerText}>{factura.numero}</Text>
          <Text style={styles.footerText}>Generado: {fmtFecha(new Date().toISOString())}</Text>
        </View>
      </Page>
    </Document>
  );
}

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", padding: "30px 36px", color: "#111113" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, alignItems: "flex-start" },
  logo: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#E84040" },
  logoSub: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  docTitle: { textAlign: "right" },
  docTitleText: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#111113" },
  docNumero: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#E84040", marginTop: 2 },
  divider: { borderBottom: "1.5px solid #e5e7eb", marginBottom: 14 },
  infoRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  infoBox: { flex: 1, backgroundColor: "#f8f8fa", borderRadius: 6, padding: "10px 12px" },
  infoLabel: { fontSize: 8, color: "#9ca3af", marginBottom: 3, textTransform: "uppercase" },
  infoValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111113" },
  infoValueSm: { fontSize: 9, color: "#374151" },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#111113", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  table: { marginBottom: 12 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0A0A0B", padding: "6px 8px", borderRadius: "4px 4px 0 0" },
  tableHeaderText: { fontSize: 9, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  tableRow: { flexDirection: "row", padding: "7px 8px", borderBottom: "1px solid #f3f4f6" },
  tableRowAlt: { backgroundColor: "#f9fafb" },
  tableCell: { fontSize: 9.5, color: "#374151" },
  totalsBox: { marginLeft: "auto", width: 220, marginTop: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 8 },
  totalLabel: { fontSize: 9.5, color: "#6b7280" },
  totalValue: { fontSize: 9.5, color: "#111113" },
  totalFinal: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#E84040", padding: "8px 10px", borderRadius: 6, marginTop: 4 },
  totalFinalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  totalFinalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  checklistGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 12 },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 4, width: "48%", paddingVertical: 3 },
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#d1d5db", marginRight: 2 },
  checkDotOk:  { backgroundColor: "#22c55e" },
  checkDotDmg: { backgroundColor: "#ef4444" },
  checkLabel: { fontSize: 8.5, color: "#374151" },
  footerBox: { backgroundColor: "#f8f8fa", borderRadius: 6, padding: "12px 16px", marginTop: 16 },
  footerText: { fontSize: 8, color: "#9ca3af" },
  footer: { position: "absolute", bottom: 30, left: 36, right: 36, borderTop: "1px solid #e5e7eb", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerPageText: { fontSize: 8, color: "#9ca3af" },
});

function fmt(n: number) {
  return "$" + (n || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 });
}

function fmtFecha(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface Linea { tipo: string; descripcion: string; cantidad: number; precio_unitario: number; descuento_pct: number; subtotal: number; }
interface ChecklistItem { id: string; label: string; value: boolean | null; }

interface PresupuestoPDFProps {
  ot: {
    numero: number; tipo: string; estado: string; fecha_entrada: string;
    fecha_prometida?: string; km_entrada?: number; descripcion?: string;
    diagnostico?: string; observaciones?: string; sucursal: string;
  };
  cliente: { nombre: string; apellido: string; cedula?: string; telefono?: string; };
  vehiculo: { marca: string; modelo: string; anio: number; placa: string; color?: string; };
  lineas: Linea[];
  checklist?: ChecklistItem[];
  iva_pct?: number;
}

const TIPO_OT: Record<string, string> = {
  preventivo:  "Mantenimiento preventivo",
  correctivo:  "Mantenimiento correctivo",
  revision:    "Revisión general",
  otro:        "Otro servicio",
};

export function PresupuestoPDF({ ot, cliente, vehiculo, lineas, checklist, iva_pct = 15 }: PresupuestoPDFProps) {
  const subtotal = lineas.reduce((a, l) => a + (l.subtotal || 0), 0);
  const iva = subtotal * (iva_pct / 100);
  const total = subtotal + iva;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>DG MOTORS</Text>
            <Text style={styles.logoSub}>Taller Automotriz · Quito &amp; Guayaquil</Text>
          </View>
          <View style={styles.docTitle}>
            <Text style={styles.docTitleText}>PRESUPUESTO / ORDEN DE TRABAJO</Text>
            <Text style={styles.docNumero}>OT-{String(ot.numero).padStart(4, "0")}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* DATOS PRINCIPALES */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>{cliente.nombre} {cliente.apellido}</Text>
            {cliente.cedula   && <Text style={styles.infoValueSm}>CI: {cliente.cedula}</Text>}
            {cliente.telefono && <Text style={styles.infoValueSm}>Tel: {cliente.telefono}</Text>}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Vehículo</Text>
            <Text style={styles.infoValue}>{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}</Text>
            <Text style={styles.infoValueSm}>Placa: {vehiculo.placa}</Text>
            {vehiculo.color && <Text style={styles.infoValueSm}>Color: {vehiculo.color}</Text>}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Fecha entrada</Text>
            <Text style={styles.infoValue}>{fmtFecha(ot.fecha_entrada)}</Text>
            {ot.fecha_prometida && <Text style={styles.infoValueSm}>Entrega: {fmtFecha(ot.fecha_prometida)}</Text>}
            {ot.km_entrada && <Text style={styles.infoValueSm}>KM: {ot.km_entrada.toLocaleString()}</Text>}
            <Text style={styles.infoValueSm}>{ot.sucursal === "quito" ? "Quito" : "Guayaquil"}</Text>
          </View>
        </View>

        {/* DESCRIPCIÓN / DIAGNÓSTICO */}
        {(ot.descripcion || ot.diagnostico) && (
          <View style={{ marginBottom: 12 }}>
            {ot.descripcion && (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.sectionTitle}>Síntoma reportado por el cliente</Text>
                <Text style={[styles.tableCell, { backgroundColor: "#fef9c3", padding: "6px 10px", borderRadius: 4, borderLeft: "3px solid #f59e0b" }]}>
                  {ot.descripcion}
                </Text>
              </View>
            )}
            {ot.diagnostico && (
              <View>
                <Text style={styles.sectionTitle}>Diagnóstico técnico</Text>
                <Text style={[styles.tableCell, { backgroundColor: "#f0f9ff", padding: "6px 10px", borderRadius: 4, borderLeft: "3px solid #3b82f6" }]}>
                  {ot.diagnostico}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TABLA DE SERVICIOS */}
        <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Detalle de servicios y repuestos</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>Tipo</Text>
            <Text style={[styles.tableHeaderText, { flex: 4 }]}>Descripción</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "center" }]}>Cant.</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>P. Unit.</Text>
            <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: "right" }]}>Subtotal</Text>
          </View>
          {lineas.length === 0 ? (
            <View style={[styles.tableRow, { justifyContent: "center" }]}>
              <Text style={[styles.tableCell, { color: "#9ca3af" }]}>Sin líneas agregadas</Text>
            </View>
          ) : (
            lineas.map((l, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "center", color: "#6b7280" }]}>
                  {l.tipo === "servicio" ? "Srv" : l.tipo === "repuesto" ? "Rep" : l.tipo === "mano_obra" ? "M/O" : "Otro"}
                </Text>
                <Text style={[styles.tableCell, { flex: 4 }]}>{l.descripcion}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>{l.cantidad}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right" }]}>{fmt(l.precio_unitario)}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>{fmt(l.subtotal)}</Text>
              </View>
            ))
          )}
        </View>

        {/* TOTALES */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA {iva_pct}%</Text>
            <Text style={styles.totalValue}>{fmt(iva)}</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>TOTAL ESTIMADO</Text>
            <Text style={styles.totalFinalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* CHECKLIST */}
        {checklist && checklist.filter(c => c.value !== null).length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>Checklist de recepción</Text>
            <View style={styles.checklistGrid}>
              {checklist.filter(c => c.value !== null).map((item) => (
                <View key={item.id} style={styles.checkItem}>
                  <View style={[styles.checkDot, item.value === true ? styles.checkDotOk : styles.checkDotDmg]} />
                  <Text style={[styles.checkLabel, item.value === false ? { color: "#ef4444" } : {}]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FIRMA */}
        <View style={{ marginTop: 24, flexDirection: "row", gap: 32 }}>
          <View style={{ flex: 1, borderTop: "1px solid #374151", paddingTop: 6 }}>
            <Text style={{ fontSize: 8.5, color: "#6b7280", textAlign: "center" }}>Firma y sello del taller</Text>
          </View>
          <View style={{ flex: 1, borderTop: "1px solid #374151", paddingTop: 6 }}>
            <Text style={{ fontSize: 8.5, color: "#6b7280", textAlign: "center" }}>Firma de aceptación del cliente</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerPageText}>DG Motors — Taller Automotriz</Text>
          <Text style={styles.footerPageText}>OT-{String(ot.numero).padStart(4, "0")}</Text>
          <Text style={styles.footerPageText}>{fmtFecha(new Date().toISOString())}</Text>
        </View>
      </Page>
    </Document>
  );
}

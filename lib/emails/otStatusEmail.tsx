import * as React from "react";

interface OTStatusEmailProps {
  clienteNombre: string;
  otNumero: string;
  estadoNuevo: string;
  vehiculo: string;
  nota?: string;
  linkOT?: string;
}

const ESTADO_LABELS: Record<string, string> = {
  presupuesto: "Presupuesto generado",
  aprobado:    "Trabajo aprobado",
  en_proceso:  "En proceso de reparación",
  pausado:     "Trabajo pausado",
  completado:  "Trabajo completado",
  facturado:   "Factura generada",
  entregado:   "Vehículo entregado",
  cancelado:   "Orden cancelada",
};

const ESTADO_COLORS: Record<string, string> = {
  presupuesto: "#6366f1",
  aprobado:    "#3b82f6",
  en_proceso:  "#f59e0b",
  pausado:     "#6b7280",
  completado:  "#10b981",
  facturado:   "#8b5cf6",
  entregado:   "#22c55e",
  cancelado:   "#ef4444",
};

const ESTADO_MENSAJES: Record<string, string> = {
  presupuesto: "Hemos generado el presupuesto para su vehículo. Por favor revíselo y comuníquese con nosotros para aprobarlo.",
  aprobado:    "El presupuesto ha sido aprobado y su vehículo está en espera para iniciar el trabajo.",
  en_proceso:  "Su vehículo está siendo atendido por nuestros técnicos especializados.",
  pausado:     "El trabajo en su vehículo ha sido pausado temporalmente. Nos comunicaremos pronto.",
  completado:  "¡Excelente noticia! El trabajo en su vehículo ha sido completado. Puede pasar a retirarlo.",
  facturado:   "Su factura ha sido generada. Puede revisar el detalle en nuestro portal.",
  entregado:   "Su vehículo ha sido entregado. ¡Gracias por confiar en DG Motors!",
  cancelado:   "La orden de trabajo ha sido cancelada. Contáctenos si tiene alguna pregunta.",
};

export function OTStatusEmail({
  clienteNombre,
  otNumero,
  estadoNuevo,
  vehiculo,
  nota,
  linkOT,
}: OTStatusEmailProps) {
  const color  = ESTADO_COLORS[estadoNuevo]  || "#E84040";
  const label  = ESTADO_LABELS[estadoNuevo]  || estadoNuevo;
  const mensaje = ESTADO_MENSAJES[estadoNuevo] || "";

  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#f4f4f5", fontFamily: "Arial, sans-serif" }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#f4f4f5", padding: "32px 0" }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#ffffff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                {/* Header */}
                <tr>
                  <td style={{ backgroundColor: "#0A0A0B", padding: "24px 32px" }}>
                    <table width="100%">
                      <tr>
                        <td>
                          <span style={{ color: "#E84040", fontSize: "22px", fontWeight: "bold", letterSpacing: "1px" }}>DG MOTORS</span>
                          <span style={{ color: "#6b7280", fontSize: "13px", marginLeft: "8px" }}>Taller Automotriz</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Status badge */}
                <tr>
                  <td style={{ padding: "32px 32px 0" }}>
                    <div style={{ display: "inline-block", backgroundColor: color + "1a", border: `1px solid ${color}33`, borderRadius: "24px", padding: "6px 16px" }}>
                      <span style={{ color: color, fontSize: "13px", fontWeight: "600" }}>● {label}</span>
                    </div>
                  </td>
                </tr>

                {/* Body */}
                <tr>
                  <td style={{ padding: "20px 32px 32px" }}>
                    <p style={{ fontSize: "18px", fontWeight: "600", color: "#111113", margin: "0 0 8px" }}>
                      Hola, {clienteNombre}
                    </p>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px" }}>
                      {mensaje}
                    </p>

                    {/* OT info box */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#f8f8fa", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
                      <tr>
                        <td style={{ padding: "4px 0" }}>
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Orden de trabajo</span>
                          <br />
                          <span style={{ fontSize: "16px", fontWeight: "700", color: "#111113", fontFamily: "monospace" }}>OT-{otNumero}</span>
                        </td>
                        <td style={{ padding: "4px 0" }}>
                          <span style={{ fontSize: "12px", color: "#9ca3af" }}>Vehículo</span>
                          <br />
                          <span style={{ fontSize: "14px", fontWeight: "600", color: "#111113" }}>{vehiculo}</span>
                        </td>
                      </tr>
                    </table>

                    {nota && (
                      <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderLeft: "3px solid #E84040", backgroundColor: "#fff5f5", padding: "12px 16px", borderRadius: "0 8px 8px 0", marginBottom: "24px" }}>
                        <tr>
                          <td>
                            <p style={{ fontSize: "13px", color: "#374151", margin: 0, fontStyle: "italic" }}>
                              "{nota}"
                            </p>
                          </td>
                        </tr>
                      </table>
                    )}

                    {linkOT && (
                      <table cellPadding={0} cellSpacing={0}>
                        <tr>
                          <td style={{ backgroundColor: "#E84040", borderRadius: "8px" }}>
                            <a
                              href={linkOT}
                              style={{ display: "block", padding: "12px 24px", color: "#ffffff", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}
                            >
                              Ver estado en línea →
                            </a>
                          </td>
                        </tr>
                      </table>
                    )}
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ borderTop: "1px solid #e5e7eb", padding: "16px 32px", backgroundColor: "#f8f8fa" }}>
                    <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
                      DG Motors — Taller Automotriz | Quito &amp; Guayaquil, Ecuador<br />
                      Este correo es automático, no responder directamente.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

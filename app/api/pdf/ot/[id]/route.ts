import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { PresupuestoPDF } from "@/lib/pdf/PresupuestoPDF";

const CHECKLIST_LABELS: Record<string, string> = {
  tarjeta_circulacion: "Tarjeta de circulación",
  soat:                "SOAT vigente",
  revision_tecnica:    "Revisión técnica",
  golpe_frontal:       "Golpe frontal",
  golpe_trasero:       "Golpe trasero",
  golpe_lateral_izq:   "Golpe lat. izq.",
  golpe_lateral_der:   "Golpe lat. der.",
  rayones:             "Rayones",
  vidrios_ok:          "Vidrios",
  tapiceria_ok:        "Tapicería",
  tablero_ok:          "Tablero",
  radio_ok:            "Radio",
  airbag_ok:           "Airbag",
  nivel_combustible:   "Combustible",
  nivel_aceite:        "Aceite",
  nivel_refrigerante:  "Refrigerante",
  nivel_frenos:        "Líq. frenos",
  gata:                "Gata",
  llanta_repuesto:     "Llanta repuesto",
  herramientas:        "Herramientas",
  extintor:            "Extintor",
  chaleco:             "Chaleco/triángulos",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("No autorizado", { status: 401 });

    const [otRes, linRes] = await Promise.all([
      supabase
        .from("ordenes_trabajo")
        .select(`
          *,
          perfiles!ordenes_trabajo_cliente_id_fkey(nombre, apellido, cedula, telefono),
          vehiculos(marca, modelo, anio, placa, color)
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("ot_lineas")
        .select("tipo, descripcion, cantidad, precio_unitario, descuento_pct, subtotal")
        .eq("ot_id", id)
        .order("created_at"),
    ]);

    if (otRes.error || !otRes.data) {
      return new NextResponse("OT no encontrada", { status: 404 });
    }

    const ot     = otRes.data;
    const perfil = ot.perfiles as any;
    const veh    = ot.vehiculos as any;

    // Parsear checklist
    const checklistRaw = (ot.checklist_entrada as Record<string, any>) || {};
    const checklist = Object.entries(CHECKLIST_LABELS)
      .filter(([k]) => k in checklistRaw && checklistRaw[k] !== null)
      .map(([id, label]) => ({ id, label, value: checklistRaw[id] as boolean }));

    const pdfElement = createElement(PresupuestoPDF, {
        ot: {
          numero:          ot.numero,
          tipo:            ot.tipo,
          estado:          ot.estado,
          fecha_entrada:   ot.fecha_entrada,
          fecha_prometida: ot.fecha_prometida,
          km_entrada:      ot.km_entrada,
          descripcion:     ot.descripcion,
          diagnostico:     ot.diagnostico,
          observaciones:   ot.observaciones,
          sucursal:        ot.sucursal,
        },
        cliente: {
          nombre:   perfil?.nombre || "—",
          apellido: perfil?.apellido || "",
          cedula:   perfil?.cedula,
          telefono: perfil?.telefono,
        },
        vehiculo: {
          marca:  veh?.marca || "—",
          modelo: veh?.modelo || "—",
          anio:   veh?.anio || 0,
          placa:  veh?.placa || "—",
          color:  veh?.color,
        },
        lineas: (linRes.data || []).map((l: any) => ({
          tipo:            l.tipo,
          descripcion:     l.descripcion,
          cantidad:        l.cantidad,
          precio_unitario: l.precio_unitario,
          descuento_pct:   l.descuento_pct || 0,
          subtotal:        l.subtotal || 0,
        })),
        checklist,
        iva_pct: 15,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(pdfElement as any);

    const numero = String(ot.numero).padStart(4, "0");
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `inline; filename="OT-${numero}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: any) {
    console.error("PDF OT error:", err);
    return new NextResponse("Error generando PDF: " + err.message, { status: 500 });
  }
}

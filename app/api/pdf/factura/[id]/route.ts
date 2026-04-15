import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { FacturaPDF } from "@/lib/pdf/FacturaPDF";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("No autorizado", { status: 401 });

    const [facRes, linRes, pagRes] = await Promise.all([
      supabase
        .from("facturas")
        .select(`
          *,
          perfiles!facturas_cliente_id_fkey(nombre, apellido, cedula, telefono),
          ordenes_trabajo(numero)
        `)
        .eq("id", id)
        .single(),
      supabase.from("factura_lineas").select("*").eq("factura_id", id).order("id"),
      supabase.from("pagos").select("fecha, metodo, monto").eq("factura_id", id).order("fecha"),
    ]);

    if (facRes.error || !facRes.data) {
      return new NextResponse("Factura no encontrada", { status: 404 });
    }

    const f = facRes.data;
    const perfil = f.perfiles as any;
    const ot = f.ordenes_trabajo as any;

    const pdfElement = createElement(FacturaPDF, {
        factura: {
          numero:        f.numero,
          tipo:          f.tipo,
          estado:        f.estado,
          fecha_emision: f.fecha_emision,
          sucursal:      f.sucursal,
          notas:         f.notas,
          subtotal:      f.subtotal,
          descuento:     f.descuento || 0,
          subtotal_neto: f.subtotal_neto || f.subtotal,
          iva_pct:       f.iva_pct || 15,
          iva_valor:     f.iva_valor || 0,
          total:         f.total,
        },
        cliente: {
          nombre:   perfil?.nombre || "—",
          apellido: perfil?.apellido || "",
          cedula:   perfil?.cedula,
          telefono: perfil?.telefono,
        },
        ot: ot || null,
        lineas: (linRes.data || []).map((l: any) => ({
          descripcion:     l.descripcion,
          cantidad:        l.cantidad,
          precio_unitario: l.precio_unitario,
          descuento_pct:   l.descuento_pct || 0,
          subtotal:        l.subtotal || 0,
        })),
        pagos: (pagRes.data || []).map((p: any) => ({
          fecha:  p.fecha,
          metodo: p.metodo,
          monto:  p.monto,
        })),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(pdfElement as any);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `inline; filename="factura-${f.numero}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: any) {
    console.error("PDF factura error:", err);
    return new NextResponse("Error generando PDF: " + err.message, { status: 500 });
  }
}

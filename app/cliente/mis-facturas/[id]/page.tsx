import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, ESTADO_FACTURA_LABELS, ESTADO_FACTURA_COLORS, METODO_PAGO_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Factura" };

export default async function MiFacturaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [facRes, linRes, pagRes] = await Promise.all([
    supabase
      .from("facturas")
      .select("*, ordenes_trabajo(numero)")
      .eq("id", id)
      .eq("cliente_id", user.id)
      .single(),
    supabase.from("factura_lineas").select("*").eq("factura_id", id),
    supabase.from("pagos").select("monto, metodo, fecha, referencia").eq("factura_id", id),
  ]);

  if (!facRes.data) notFound();
  const factura = facRes.data;
  const lineas = linRes.data || [];
  const pagos = pagRes.data || [];
  const totalPagado = pagos.reduce((acc, p) => acc + (p.monto || 0), 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/cliente/mis-facturas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">{factura.numero}</h1>
            <Badge variant="secondary" className={ESTADO_FACTURA_COLORS[factura.estado]}>
              {ESTADO_FACTURA_LABELS[factura.estado]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Emitida: {formatDate(factura.fecha_emision)}
            {(factura.ordenes_trabajo as any)?.numero && (
              ` · OT-${String((factura.ordenes_trabajo as any).numero).padStart(4, "0")}`
            )}
          </p>
        </div>
      </div>

      <div className="max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detalle de servicios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lineas.map((l) => (
              <div key={l.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-56">
                  {l.descripcion} × {l.cantidad}
                </span>
                <span>{formatCurrency(l.subtotal)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(factura.subtotal)}</span>
              </div>
              {factura.descuento > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento</span>
                  <span>-{formatCurrency(factura.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA {factura.iva_pct}%</span>
                <span>{formatCurrency(factura.iva_valor)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(factura.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {pagos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pagos realizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pagos.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span>{METODO_PAGO_LABELS[p.metodo] || p.metodo}</span>
                    <span className="text-muted-foreground text-xs ml-2">{formatDate(p.fecha)}</span>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    +{formatCurrency(p.monto)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                <span>Pagado</span>
                <span>{formatCurrency(totalPagado)}</span>
              </div>
              {totalPagado < factura.total && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Saldo</span>
                  <span>{formatCurrency(factura.total - totalPagado)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

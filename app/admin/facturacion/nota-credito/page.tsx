"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { crearNotaCredito } from "@/lib/actions/ventas";
import type { VentasState } from "@/lib/actions/ventas";
import { formatCurrency } from "@/lib/utils";

const initialState: VentasState = {};

export default function NuevoNCPage() {
  const searchParams = useSearchParams();
  const facturaOrigenId = searchParams.get("origen") ?? "";

  const [state, formAction, isPending] = useActionState(crearNotaCredito, initialState);
  const [facturaOrigen, setFacturaOrigen] = useState<any>(null);
  const [monto, setMonto] = useState<string>("");

  useEffect(() => {
    if (!facturaOrigenId) return;
    const supabase = createClient();
    supabase
      .from("facturas")
      .select(`
        id, numero, total, subtotal, iva_valor, iva_pct,
        perfiles!facturas_cliente_id_fkey(nombre, apellido)
      `)
      .eq("id", facturaOrigenId)
      .single()
      .then(({ data }) => {
        setFacturaOrigen(data);
        if (data) setMonto(String(data.total));
      });
  }, [facturaOrigenId]);

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={facturaOrigenId ? `/admin/facturacion/${facturaOrigenId}` : "/admin/facturacion"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Nueva Nota de Crédito
          </h1>
          <p className="text-muted-foreground text-sm">
            Reversar total o parcialmente una factura emitida
          </p>
        </div>
      </div>

      {/* Info factura origen */}
      {facturaOrigen && (
        <Card className="border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  Factura origen: <span className="font-mono">{facturaOrigen.numero}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Cliente: {(facturaOrigen.perfiles as any)?.nombre} {(facturaOrigen.perfiles as any)?.apellido}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency(facturaOrigen.total)} · IVA {facturaOrigen.iva_pct}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!facturaOrigenId && (
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              Accede a esta página desde el detalle de una factura haciendo clic en "Nota de Crédito".
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la Nota de Crédito</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="factura_origen_id" value={facturaOrigenId} />

            {/* Motivo */}
            <div className="space-y-1.5">
              <Label htmlFor="motivo_nc">Motivo de la Nota de Crédito *</Label>
              <Textarea
                id="motivo_nc"
                name="motivo_nc"
                placeholder="Devolución de mercadería, error en facturación, descuento posterior..."
                rows={3}
                required
              />
            </div>

            {/* Monto */}
            <div className="space-y-1.5">
              <Label htmlFor="monto">
                Monto a Reversar ($) *
                {facturaOrigen && (
                  <span className="text-xs text-muted-foreground ml-2">
                    Máximo: {formatCurrency(facturaOrigen.total)}
                  </span>
                )}
              </Label>
              <Input
                id="monto"
                name="monto"
                type="number"
                step="0.01"
                min="0.01"
                max={facturaOrigen?.total}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                required
              />
              {monto && facturaOrigen && (
                <p className="text-xs text-muted-foreground">
                  NC incluye IVA — Subtotal aprox.: {formatCurrency(parseFloat(monto) / (1 + (facturaOrigen.iva_pct || 15) / 100))}
                </p>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-md p-3 text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <p className="font-medium">¿Qué genera esta acción?</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Se crea una factura de tipo "Nota de Crédito" vinculada a la original</li>
                <li>Se genera un asiento contable de reverso automático</li>
                <li>La NC queda en estado "Pagada" (reduce la CxC del cliente)</li>
              </ul>
            </div>

            {state?.error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
                {state.error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isPending || !facturaOrigenId}
                className="flex-1"
              >
                {isPending ? "Procesando..." : "Emitir Nota de Crédito"}
              </Button>
              <Link href={facturaOrigenId ? `/admin/facturacion/${facturaOrigenId}` : "/admin/facturacion"}>
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

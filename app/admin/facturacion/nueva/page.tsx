"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { crearFactura } from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

export default function NuevaFacturaPage() {
  const searchParams = useSearchParams();
  const otIdParam = searchParams.get("ot") || "";
  const [state, action, pending] = useActionState(crearFactura, {});
  const [clientes, setClientes] = useState<any[]>([]);
  const [ot, setOt] = useState<any>(null);
  const [lineas, setLineas] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [descuento, setDescuento] = useState(0);
  const [ivaPct] = useState(15);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("perfiles")
      .select("id, nombre, apellido, cedula")
      .in("rol", ["cliente", "admin"])
      .order("nombre")
      .then(({ data }) => setClientes(data || []));

    if (otIdParam) {
      supabase
        .from("ordenes_trabajo")
        .select(`
          id, numero, sucursal,
          perfiles!ordenes_trabajo_cliente_id_fkey(id, nombre, apellido),
          vehiculos(placa, marca, modelo)
        `)
        .eq("id", otIdParam)
        .single()
        .then(({ data }) => setOt(data));

      supabase
        .from("ot_lineas")
        .select("descripcion, cantidad, precio_unitario, descuento_pct, subtotal")
        .eq("ot_id", otIdParam)
        .then(({ data }) => {
          setLineas(data || []);
          const total = (data || []).reduce((acc: number, l: any) => acc + (l.subtotal || 0), 0);
          setSubtotal(total);
        });
    }
  }, [otIdParam]);

  const subtotalNeto = subtotal - descuento;
  const ivaValor = subtotalNeto * (ivaPct / 100);
  const total = subtotalNeto + ivaValor;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Nueva Factura
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {ot
            ? `Desde OT-${String(ot.numero).padStart(4, "0")}`
            : "Crear factura manual"}
        </p>
      </div>

      <form action={action}>
        <input type="hidden" name="ot_id" value={otIdParam} />
        <input type="hidden" name="subtotal" value={subtotal} />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos de factura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de factura *</Label>
                  <Input
                    name="numero"
                    placeholder="001-001-000000001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select name="tipo" defaultValue="factura">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factura">Factura</SelectItem>
                      <SelectItem value="proforma">Proforma</SelectItem>
                      <SelectItem value="recibo">Recibo</SelectItem>
                      <SelectItem value="nota_credito">Nota de crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select
                    name="cliente_id"
                    required
                    defaultValue={ot ? (ot.perfiles as any)?.id : ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre} {c.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sucursal *</Label>
                  <Select
                    name="sucursal"
                    required
                    defaultValue={ot?.sucursal || "quito"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quito">Quito</SelectItem>
                      <SelectItem value="guayaquil">Guayaquil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de vencimiento</Label>
                  <Input type="date" name="fecha_vence" />
                </div>
                <div className="space-y-2">
                  <Label>Descuento ($)</Label>
                  <Input
                    name="descuento"
                    type="number"
                    step="0.01"
                    min="0"
                    value={descuento}
                    onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea name="notas" placeholder="Notas adicionales..." rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              {lineas.length > 0 && (
                <div className="mb-4 space-y-1">
                  {lineas.map((l, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-72">
                        {l.descripcion} × {l.cantidad}
                      </span>
                      <span>{formatCurrency(l.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento</span>
                    <span>- {formatCurrency(descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA {ivaPct}%</span>
                  <span>{formatCurrency(ivaValor)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {state.error && (
            <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md">
              {state.error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Generando..." : "Generar Factura"}
            </Button>
            <Button type="button" variant="outline" onClick={() => history.back()}>
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { crearRetencion } from "@/lib/actions/ventas";
import type { VentasState } from "@/lib/actions/ventas";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

// Códigos de retención SRI Ecuador más comunes
const CODIGOS_RENTA = [
  { codigo: "303", concepto: "Honorarios profesionales y demás pagos por servicios — 10%", pct: 10 },
  { codigo: "304", concepto: "Servicios predomina mano de obra — 2%", pct: 2 },
  { codigo: "307", concepto: "Servicios de transporte privado — 1%", pct: 1 },
  { codigo: "309", concepto: "Arrendamiento de bienes inmuebles a personas naturales — 8%", pct: 8 },
  { codigo: "312", concepto: "Transferencia de bienes de naturaleza corporal — 1%", pct: 1 },
  { codigo: "319", concepto: "Otras retenciones aplicables el 2%", pct: 2 },
  { codigo: "332", concepto: "Compra de bienes y servicios gravados con IVA — 1%", pct: 1 },
];

const CODIGOS_IVA = [
  { codigo: "721", concepto: "Retención 30% del IVA — Bienes", pct: 30 },
  { codigo: "723", concepto: "Retención 70% del IVA — Servicios", pct: 70 },
  { codigo: "725", concepto: "Retención 100% del IVA — Profesionales", pct: 100 },
];

const initialState: VentasState = {};

export default function NuevaRetencionPage() {
  const [state, formAction, isPending] = useActionState(crearRetencion, initialState);
  const [tipo, setTipo] = useState<"renta" | "iva">("renta");
  const [porcentaje, setPorcentaje] = useState(1);
  const [base, setBase] = useState(0);
  const [facturas, setFacturas] = useState<any[]>([]);

  const codigos = tipo === "renta" ? CODIGOS_RENTA : CODIGOS_IVA;
  const valor = parseFloat((base * porcentaje / 100).toFixed(2));

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("facturas")
      .select("id, numero, total, perfiles!facturas_cliente_id_fkey(nombre, apellido)")
      .in("estado", ["pendiente", "pagada"])
      .eq("tipo", "factura")
      .order("fecha_emision", { ascending: false })
      .limit(50)
      .then(({ data }) => setFacturas(data || []));
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/retenciones">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Nueva Retención
          </h1>
          <p className="text-muted-foreground text-sm">Registrar comprobante de retención SRI</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la Retención</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Factura */}
            <div className="space-y-1.5">
              <Label>Factura *</Label>
              <Select name="factura_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar factura..." />
                </SelectTrigger>
                <SelectContent>
                  {facturas.map((f) => {
                    const p = f.perfiles as any;
                    return (
                      <SelectItem key={f.id} value={f.id}>
                        {f.numero} — {p?.nombre} {p?.apellido} ({formatCurrency(f.total)})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <div className="space-y-1.5">
                <Label>Tipo de Retención *</Label>
                <Select
                  name="tipo"
                  value={tipo}
                  onValueChange={(v) => v && setTipo(v as "renta" | "iva")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="renta">Retención en Renta</SelectItem>
                    <SelectItem value="iva">Retención en IVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha */}
              <div className="space-y-1.5">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {/* Código de retención */}
            <div className="space-y-1.5">
              <Label>Código / Concepto *</Label>
              <Select
                name="codigo_ret"
                onValueChange={(v) => {
                  if (!v) return;
                  const c = codigos.find((x) => x.codigo === v);
                  if (c) setPorcentaje(c.pct);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar código..." />
                </SelectTrigger>
                <SelectContent>
                  {codigos.map((c) => (
                    <SelectItem key={c.codigo} value={c.codigo}>
                      {c.codigo} — {c.concepto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                name="concepto_ret"
                placeholder="Concepto personalizado (opcional)..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Porcentaje */}
              <div className="space-y-1.5">
                <Label htmlFor="porcentaje">Porcentaje (%) *</Label>
                <Input
                  id="porcentaje"
                  name="porcentaje"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              {/* Base imponible */}
              <div className="space-y-1.5">
                <Label htmlFor="base_imponible">Base Imponible ($) *</Label>
                <Input
                  id="base_imponible"
                  name="base_imponible"
                  type="number"
                  step="0.01"
                  min="0"
                  value={base || ""}
                  onChange={(e) => setBase(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Valor calculado */}
              <div className="space-y-1.5">
                <Label>Valor Retenido</Label>
                <div className="h-9 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-bold text-primary">
                  {formatCurrency(valor)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Número del comprobante */}
              <div className="space-y-1.5">
                <Label htmlFor="numero_ret">Nº Comprobante de Retención</Label>
                <Input id="numero_ret" name="numero_ret" placeholder="001-001-000000001" />
              </div>
              {/* Autorización */}
              <div className="space-y-1.5">
                <Label htmlFor="autorizacion">Autorización SRI</Label>
                <Input id="autorizacion" name="autorizacion" placeholder="Número de autorización..." />
              </div>
            </div>

            {state?.error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
                {state.error}
              </div>
            )}
            {state?.success && (
              <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 px-3 py-2 rounded">
                {state.success}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Guardando..." : "Registrar Retención"}
              </Button>
              <Link href="/admin/retenciones">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

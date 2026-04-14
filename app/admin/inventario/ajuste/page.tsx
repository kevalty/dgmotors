"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ajustarStock } from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";

export default function AjusteStockPage() {
  const [state, action, pending] = useActionState(ajustarStock, {});
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [seleccionado, setSeleccionado] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("repuestos")
      .select("id, nombre, codigo, stock_actual, unidad")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => setRepuestos(data || []));
  }, []);

  const handleRepuesto = (id: string) => {
    setSeleccionado(repuestos.find((r) => r.id === id) || null);
  };

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Ajuste de Stock
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registra entradas, salidas o correcciones manuales de inventario
        </p>
      </div>

      <form action={action}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Movimiento de inventario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Repuesto *</Label>
              <Select name="repuesto_id" required onValueChange={(v: any) => { if (v) handleRepuesto(v as string); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar repuesto" />
                </SelectTrigger>
                <SelectContent>
                  {repuestos.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nombre} {r.codigo ? `(${r.codigo})` : ""} — Stock: {r.stock_actual}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {seleccionado && (
                <p className="text-xs text-muted-foreground">
                  Stock actual: <span className="font-semibold">{seleccionado.stock_actual} {seleccionado.unidad}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de movimiento *</Label>
              <Select name="tipo" required defaultValue="entrada">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (suma al stock)</SelectItem>
                  <SelectItem value="salida">Salida (resta al stock)</SelectItem>
                  <SelectItem value="ajuste">Ajuste (establece nuevo valor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input
                name="cantidad"
                type="number"
                step="0.001"
                min="0"
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Notas / Motivo</Label>
              <Textarea
                name="notas"
                placeholder="Ej: Inventario físico, corrección por daño..."
                rows={2}
              />
            </div>

            {state.error && (
              <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md">
                {state.error}
              </p>
            )}
            {state.success && (
              <p className="text-sm text-green-700 dark:text-green-400 bg-green-500/10 px-4 py-2 rounded-md flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {state.success}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? "Registrando..." : "Registrar movimiento"}
              </Button>
              <Button type="button" variant="outline" onClick={() => history.back()}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

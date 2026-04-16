"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { crearAnticipo } from "@/lib/actions/ventas";
import type { VentasState } from "@/lib/actions/ventas";
import { createClient } from "@/lib/supabase/client";

const initialState: VentasState = {};

export default function NuevoAnticipoPage() {
  const [state, formAction, isPending] = useActionState(crearAnticipo, initialState);
  const [clientes, setClientes] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("perfiles")
      .select("id, nombre, apellido, cedula")
      .eq("rol", "cliente")
      .order("nombre")
      .then(({ data }) => setClientes(data || []));
  }, []);

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/anticipos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Nuevo Anticipo
          </h1>
          <p className="text-muted-foreground text-sm">Registrar pago anticipado de un cliente</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Anticipo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Cliente */}
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select name="cliente_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} {c.apellido}
                      {c.cedula && <span className="text-muted-foreground"> · CI {c.cedula}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              {/* Monto */}
              <div className="space-y-1.5">
                <Label htmlFor="monto">Monto ($) *</Label>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Método de pago */}
              <div className="space-y-1.5">
                <Label>Método de Pago</Label>
                <Select name="metodo_pago" defaultValue="efectivo">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Referencia */}
              <div className="space-y-1.5">
                <Label htmlFor="referencia">Referencia</Label>
                <Input id="referencia" name="referencia" placeholder="Nº comprobante..." />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                name="notas"
                placeholder="Motivo del anticipo, observaciones..."
                rows={3}
              />
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
                {isPending ? "Guardando..." : "Registrar Anticipo"}
              </Button>
              <Link href="/admin/anticipos">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

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
import { abrirCaja } from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";

export default function AbrirCajaPage() {
  const searchParams = useSearchParams();
  const cajaParam = searchParams.get("caja") || "";
  const [state, action, pending] = useActionState(abrirCaja, {});
  const [cajas, setCajas] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("cajas")
      .select("id, nombre, sucursal")
      .eq("activa", true)
      .then(({ data }) => setCajas(data || []));
  }, []);

  return (
    <div className="max-w-md">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Abrir Caja
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Inicia el turno de trabajo con el efectivo inicial disponible
        </p>
      </div>

      <form action={action}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apertura de turno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Caja *</Label>
              <Select name="caja_id" required defaultValue={cajaParam}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar caja" />
                </SelectTrigger>
                <SelectContent>
                  {cajas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} — {c.sucursal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monto de apertura (efectivo en caja) *</Label>
              <Input
                name="monto_apertura"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0.00"
                required
              />
              <p className="text-xs text-muted-foreground">
                Ingresa el dinero en efectivo que hay físicamente en la caja al inicio del turno
              </p>
            </div>

            {state.error && (
              <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md">
                {state.error}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? "Abriendo..." : "Abrir turno"}
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

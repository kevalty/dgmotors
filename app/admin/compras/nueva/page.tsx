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
import { crearCompra } from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";

export default function NuevaCompraPage() {
  const [state, action, pending] = useActionState(crearCompra, {});
  const [proveedores, setProveedores] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("proveedores")
      .select("id, nombre, ruc")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => setProveedores(data || []));
  }, []);

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Nueva Orden de Compra
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Crea una orden de compra a un proveedor
        </p>
      </div>

      <form action={action}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de la compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select name="proveedor_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.ruc ? `— ${p.ruc}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sucursal *</Label>
                <Select name="sucursal" required defaultValue="quito">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quito">Quito</SelectItem>
                    <SelectItem value="guayaquil">Guayaquil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha esperada</Label>
                <Input type="date" name="fecha_esperada" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea name="notas" rows={2} placeholder="Notas para el proveedor..." />
            </div>

            {state.error && (
              <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-md">
                {state.error}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? "Creando..." : "Crear orden de compra"}
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

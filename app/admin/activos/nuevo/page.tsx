"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crearActivoFijo } from "@/lib/actions/activos";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Categoria = {
  id: string;
  nombre: string;
  vida_util_anios: number;
  metodo_dep: string;
};

export default function NuevoActivoPage() {
  const [state, action, pending] = useActionState(crearActivoFijo, {});
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    const sb = createClient();
    sb.from("categorias_activo")
      .select("id, nombre, vida_util_anios, metodo_dep")
      .eq("activa", true)
      .order("nombre")
      .then(({ data }) => setCategorias(data ?? []));
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Nuevo Activo Fijo</h1>
        <p className="text-muted-foreground text-sm">Registrar un nuevo activo al sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Activo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            {state.error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">{state.error}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Código *</Label>
                <Input name="codigo" placeholder="ACT-001" required />
              </div>
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select name="categoria_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} ({c.vida_util_anios} años)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Nombre del Activo *</Label>
              <Input name="nombre" placeholder="Ej: Elevador hidráulico marca TW-4000" required />
            </div>

            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea name="descripcion" placeholder="Características, modelo, serie..." rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Fecha de Compra *</Label>
                <Input name="fecha_compra" type="date" required />
              </div>
              <div className="space-y-1">
                <Label>Sucursal</Label>
                <Select name="sucursal">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quito">Quito</SelectItem>
                    <SelectItem value="guayaquil">Guayaquil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Costo Original ($) *</Label>
                <Input name="costo_original" type="number" step="0.01" min="0" placeholder="0.00" required />
              </div>
              <div className="space-y-1">
                <Label>Valor Residual ($)</Label>
                <Input name="valor_residual" type="number" step="0.01" min="0" placeholder="0.00" defaultValue="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Proveedor</Label>
                <Input name="proveedor" placeholder="Nombre del proveedor" />
              </div>
              <div className="space-y-1">
                <Label>Factura de Compra</Label>
                <Input name="factura_ref" placeholder="001-001-000000123" />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Ubicación</Label>
              <Input name="ubicacion" placeholder="Ej: Taller principal, bahía 3" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Guardando..." : "Registrar Activo"}
              </Button>
              <Button type="button" variant="outline" onClick={() => history.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

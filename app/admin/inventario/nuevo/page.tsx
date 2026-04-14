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
import { crearRepuesto } from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";

export default function NuevoRepuestoPage() {
  const [state, action, pending] = useActionState(crearRepuesto, {});
  const [categorias, setCategorias] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categorias_repuesto")
      .select("id, nombre")
      .order("orden")
      .then(({ data }) => setCategorias(data || []));
  }, []);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Nuevo Repuesto
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Agrega un repuesto o material al inventario
        </p>
      </div>

      <form action={action}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nombre *</Label>
                  <Input name="nombre" placeholder="Ej: Filtro de aceite Honda" required />
                </div>
                <div className="space-y-2">
                  <Label>Código / SKU</Label>
                  <Input name="codigo" placeholder="Ej: FOH-001" />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select name="categoria_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea name="descripcion" placeholder="Descripción opcional..." rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stock y precios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unidad de medida</Label>
                  <Select name="unidad" defaultValue="unidad">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidad">Unidad</SelectItem>
                      <SelectItem value="litro">Litro</SelectItem>
                      <SelectItem value="kg">Kilogramo</SelectItem>
                      <SelectItem value="metro">Metro</SelectItem>
                      <SelectItem value="par">Par</SelectItem>
                      <SelectItem value="juego">Juego</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sucursal</Label>
                  <Select name="sucursal" defaultValue="ambos">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambos">Ambas sucursales</SelectItem>
                      <SelectItem value="quito">Quito</SelectItem>
                      <SelectItem value="guayaquil">Guayaquil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Stock inicial</Label>
                  <Input name="stock_actual" type="number" step="0.001" defaultValue="0" min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Stock mínimo (alerta)</Label>
                  <Input name="stock_minimo" type="number" step="0.001" defaultValue="0" min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Precio costo</Label>
                  <Input name="precio_costo" type="number" step="0.01" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Precio venta</Label>
                  <Input name="precio_venta" type="number" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ubicación en bodega</Label>
                <Input name="ubicacion" placeholder="Ej: Estante A-3" />
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
              {pending ? "Guardando..." : "Guardar repuesto"}
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

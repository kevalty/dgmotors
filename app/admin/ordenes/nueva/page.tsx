"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { crearOrdenTrabajo } from "@/lib/actions/erp";
import { createClient } from "@/lib/supabase/client";

export default function NuevaOrdenPage() {
  const [state, action, pending] = useActionState(crearOrdenTrabajo, {});
  const [clientes, setClientes] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("perfiles")
      .select("id, nombre, apellido, cedula")
      .in("rol", ["cliente", "admin"])
      .order("nombre")
      .then(({ data }) => setClientes(data || []));
  }, []);

  useEffect(() => {
    if (!clienteId) return;
    const supabase = createClient();
    supabase
      .from("vehiculos")
      .select("id, placa, marca, modelo, anio")
      .eq("cliente_id", clienteId)
      .then(({ data }) => setVehiculos(data || []));
  }, [clienteId]);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Nueva Orden de Trabajo
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registra la entrada del vehículo al taller
        </p>
      </div>

      <form action={action}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente y Vehículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  name="cliente_id"
                  required
                  onValueChange={(v: any) => { if (v) setClienteId(v as string); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} {c.apellido}
                        {c.cedula && ` — ${c.cedula}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vehículo *</Label>
                <Select name="vehiculo_id" required disabled={!clienteId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        clienteId
                          ? vehiculos.length > 0
                            ? "Seleccionar vehículo"
                            : "Cliente sin vehículos"
                          : "Primero selecciona un cliente"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiculos.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.marca} {v.modelo} {v.anio} — {v.placa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalles de la OT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de trabajo *</Label>
                  <Select name="tipo" required defaultValue="correctivo">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="revision">Revisión</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kilometraje entrada</Label>
                  <Input
                    type="number"
                    name="km_entrada"
                    placeholder="85000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha prometida</Label>
                  <Input type="datetime-local" name="fecha_prometida" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Síntoma / Descripción del cliente</Label>
                <Textarea
                  name="descripcion"
                  placeholder="Describe el problema reportado por el cliente..."
                  rows={3}
                />
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
              {pending ? "Creando..." : "Crear Orden de Trabajo"}
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

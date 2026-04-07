"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { crearCita } from "@/lib/actions/citas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const initialState = {};

export default function NuevaCitaPage() {
  const [state, formAction, isPending] = useActionState(crearCita, initialState);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);

  // Controlled values for selects (fixes UUID display bug in shadcn/ui)
  const [vehiculoId, setVehiculoId] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [sucursal, setSucursal] = useState("");

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("vehiculos")
        .select("id, placa, marca, modelo")
        .order("created_at", { ascending: false }),
      supabase
        .from("servicios")
        .select("id, nombre, categorias_servicio(nombre)")
        .eq("activo", true)
        .order("nombre"),
    ]).then(([v, s]) => {
      setVehiculos(v.data || []);
      setServicios(s.data || []);
    });
  }, []);

  const vehiculoLabel =
    vehiculos.find((v) => v.id === vehiculoId)
      ? `${vehiculos.find((v) => v.id === vehiculoId)!.marca} ${vehiculos.find((v) => v.id === vehiculoId)!.modelo} — ${vehiculos.find((v) => v.id === vehiculoId)!.placa}`
      : "";

  const servicioLabel =
    servicios.find((s) => s.id === servicioId)?.nombre ?? "";

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/cliente/citas">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Agendar Cita
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Completa los datos para agendar tu cita
          </p>
        </div>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Datos de la Cita</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Hidden inputs carry the real values to the server action */}
            <input type="hidden" name="vehiculo_id" value={vehiculoId} />
            <input type="hidden" name="servicio_id" value={servicioId} />
            <input type="hidden" name="sucursal" value={sucursal} />

            {(state as any).error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(state as any).error}
              </div>
            )}

            {/* Vehículo */}
            <div className="space-y-1.5">
              <Label>Vehículo *</Label>
              {vehiculos.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 rounded-md border border-dashed">
                  No tienes vehículos.{" "}
                  <Link
                    href="/cliente/vehiculos/nuevo"
                    className="text-primary hover:underline"
                  >
                    Agrega uno primero
                  </Link>
                </div>
              ) : (
                <Select
                  value={vehiculoId}
                  onValueChange={(v) => setVehiculoId(v || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu vehículo">
                      {vehiculoLabel || "Selecciona tu vehículo"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {vehiculos.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.marca} {v.modelo} — {v.placa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Servicio */}
            <div className="space-y-1.5">
              <Label>Servicio</Label>
              <Select
                value={servicioId}
                onValueChange={(v) => setServicioId(v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio (opcional)">
                    {servicioLabel || "Seleccionar servicio (opcional)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sucursal */}
            <div className="space-y-1.5">
              <Label>Sucursal *</Label>
              <Select
                value={sucursal}
                onValueChange={(v) => setSucursal(v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la sucursal">
                    {sucursal === "quito"
                      ? "Quito"
                      : sucursal === "guayaquil"
                      ? "Guayaquil"
                      : "Selecciona la sucursal"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quito">Quito</SelectItem>
                  <SelectItem value="guayaquil">Guayaquil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha y hora */}
            <div className="space-y-1.5">
              <Label htmlFor="fecha_hora">Fecha y Hora *</Label>
              <Input
                id="fecha_hora"
                name="fecha_hora"
                type="datetime-local"
                min={new Date(Date.now() + 86400000).toISOString().slice(0, 16)}
                required
              />
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label htmlFor="notas_cliente">Notas adicionales</Label>
              <Textarea
                id="notas_cliente"
                name="notas_cliente"
                placeholder="Describe brevemente el problema o servicio que necesitas..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/cliente/citas" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending || vehiculos.length === 0 || !vehiculoId || !sucursal}
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? "Agendando..." : "Agendar Cita"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

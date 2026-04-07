"use client";

import { use, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { editarMantenimiento } from "@/lib/actions/admin";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const TIPOS = ["preventivo", "correctivo", "cambio_aceite", "revision", "emergencia", "garantia", "otro"];

export default function EditarMantenimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(editarMantenimiento, {});
  const [mant, setMant] = useState<any>(null);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [vehiculoId, setVehiculoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [vehiculoLabel, setVehiculoLabel] = useState("");

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("mantenimientos")
        .select("id, tipo, descripcion, fecha, kilometraje, costo, proxima_fecha, proximo_km, observaciones, vehiculo_id")
        .eq("id", id)
        .single(),
      supabase
        .from("vehiculos")
        .select("id, placa, marca, modelo, perfiles(nombre, apellido)")
        .order("created_at", { ascending: false }),
    ]).then(([{ data: m }, { data: v }]) => {
      setVehiculos(v || []);
      if (m) {
        setMant(m);
        setVehiculoId(m.vehiculo_id);
        setTipo(m.tipo);
      }
    });
  }, [id]);

  useEffect(() => {
    const v = vehiculos.find((v) => v.id === vehiculoId);
    if (v) {
      setVehiculoLabel(`${v.marca} ${v.modelo} — ${v.placa} (${(v.perfiles as any)?.nombre} ${(v.perfiles as any)?.apellido})`);
    }
  }, [vehiculoId, vehiculos]);

  useEffect(() => {
    if ((state as any).success) {
      setTimeout(() => router.push("/admin/mantenimiento"), 1200);
    }
  }, [state]);

  if (!mant) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tipoLabel = tipo
    ? tipo.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Seleccionar";

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/mantenimiento">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Editar Mantenimiento
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Modifica los datos del registro</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="vehiculo_id" value={vehiculoId} />

            {(state as any).error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(state as any).error}
              </div>
            )}

            {(state as any).success && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {(state as any).success} Redirigiendo...
              </div>
            )}

            {/* Vehículo */}
            <div className="space-y-1.5">
              <Label>Vehículo *</Label>
              <Select
                value={vehiculoId}
                onValueChange={(v) => setVehiculoId(v || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el vehículo">
                    {vehiculoLabel || "Selecciona el vehículo"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {vehiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.marca} {v.modelo} — {v.placa} ({(v.perfiles as any)?.nombre} {(v.perfiles as any)?.apellido})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo + Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <input type="hidden" name="tipo" value={tipo} />
                <Select
                  value={tipo}
                  onValueChange={(v) => setTipo(String(v ?? ""))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar">
                      {tipoLabel}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  defaultValue={mant.fecha}
                  required
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                defaultValue={mant.descripcion}
                required
              />
            </div>

            {/* Kilometraje, Costo, Próx km */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="kilometraje">Kilometraje</Label>
                <Input
                  id="kilometraje"
                  name="kilometraje"
                  type="number"
                  min="0"
                  defaultValue={mant.kilometraje ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="costo">Costo (USD)</Label>
                <Input
                  id="costo"
                  name="costo"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={mant.costo ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proximo_km">Próx. km</Label>
                <Input
                  id="proximo_km"
                  name="proximo_km"
                  type="number"
                  min="0"
                  defaultValue={mant.proximo_km ?? ""}
                />
              </div>
            </div>

            {/* Próxima fecha */}
            <div className="space-y-1.5">
              <Label htmlFor="proxima_fecha">Próxima fecha</Label>
              <Input
                id="proxima_fecha"
                name="proxima_fecha"
                type="date"
                defaultValue={mant.proxima_fecha ?? ""}
              />
            </div>

            {/* Observaciones */}
            <div className="space-y-1.5">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                rows={2}
                defaultValue={mant.observaciones ?? ""}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin/mantenimiento" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

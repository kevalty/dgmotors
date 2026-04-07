"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Droplets } from "lucide-react";
import { registrarMantenimiento } from "@/lib/actions/admin";
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
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

const initialState = {};
const TIPOS = ["preventivo", "correctivo", "cambio_aceite", "revision", "emergencia", "garantia", "otro"];

export default function NuevoMantenimientoPage() {
  const [state, formAction, isPending] = useActionState(registrarMantenimiento, initialState);
  const searchParams = useSearchParams();
  const citaIdParam = searchParams.get("cita") || "";
  const vehiculoIdParam = searchParams.get("vehiculo") || "";

  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [esAceite, setEsAceite] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("vehiculos")
      .select("id, placa, marca, modelo, perfiles(nombre, apellido)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setVehiculos(data || []));
  }, []);

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
            Registrar Mantenimiento
          </h1>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="cita_id" value={citaIdParam} />

            {(state as any).error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(state as any).error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="vehiculo_id">Vehículo *</Label>
              <Select name="vehiculo_id" defaultValue={vehiculoIdParam} required>
                <SelectTrigger id="vehiculo_id">
                  <SelectValue placeholder="Selecciona el vehículo" />
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select name="tipo" onValueChange={(v) => setEsAceite(v === "cambio_aceite")} required>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Seleccionar" />
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
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea id="descripcion" name="descripcion" rows={3} required placeholder="Detalla el trabajo realizado..." />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="kilometraje">Kilometraje</Label>
                <Input id="kilometraje" name="kilometraje" type="number" min="0" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="costo">Costo (USD)</Label>
                <Input id="costo" name="costo" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proximo_km">Próx. km</Label>
                <Input id="proximo_km" name="proximo_km" type="number" min="0" placeholder="0" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proxima_fecha">Próxima fecha</Label>
              <Input id="proxima_fecha" name="proxima_fecha" type="date" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea id="observaciones" name="observaciones" rows={2} placeholder="Notas adicionales..." />
            </div>

            {/* Cambio de aceite */}
            {esAceite && (
              <>
                <Separator />
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-primary" />
                  <p className="font-medium text-sm">Datos del Aceite</p>
                </div>
                <input type="hidden" name="es_aceite" value="true" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="marca_aceite">Marca del aceite</Label>
                    <Input id="marca_aceite" name="marca_aceite" placeholder="Mobil, Castrol..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="viscosidad">Viscosidad</Label>
                    <Input id="viscosidad" name="viscosidad" placeholder="5W-30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tipo_aceite">Tipo de aceite</Label>
                    <Select name="tipo_aceite">
                      <SelectTrigger id="tipo_aceite">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sintetico">Sintético</SelectItem>
                        <SelectItem value="semisisntetico">Semisintético</SelectItem>
                        <SelectItem value="mineral">Mineral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cantidad_litros">Litros</Label>
                    <Input id="cantidad_litros" name="cantidad_litros" type="number" step="0.5" min="0" placeholder="4.0" />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Link href="/admin/mantenimiento" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? "Guardando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

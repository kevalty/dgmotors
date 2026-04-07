"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Droplets } from "lucide-react";
import { registrarMantenimiento } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

const initialState = {};
const TIPOS = [
  "preventivo",
  "correctivo",
  "cambio_aceite",
  "revision",
  "emergencia",
  "garantia",
  "otro",
];

export default function RegistrarTrabajoPage() {
  const [state, formAction, isPending] = useActionState(
    registrarMantenimiento,
    initialState
  );
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [tipo, setTipo] = useState("");
  const esAceite = tipo === "cambio_aceite";

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("vehiculos")
      .select("id, placa, marca, modelo, anio, perfiles(nombre, apellido)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setVehiculos(data || []));
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/mecanico/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Registrar Trabajo
          </h1>
          <p className="text-sm text-muted-foreground">
            Selecciona el vehículo y documenta el trabajo realizado
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {(state as any).error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(state as any).error}
              </div>
            )}
            {(state as any).success && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {(state as any).success}
              </div>
            )}

            {/* Vehículo */}
            <div className="space-y-1.5">
              <Label htmlFor="vehiculo_id">Vehículo *</Label>
              <Select name="vehiculo_id" required>
                <SelectTrigger id="vehiculo_id">
                  <SelectValue placeholder="Busca por placa, marca o propietario" />
                </SelectTrigger>
                <SelectContent>
                  {vehiculos.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="font-medium">{v.placa}</span>
                      {" — "}
                      {v.marca} {v.modelo} {v.anio}
                      {(v.perfiles as any)?.nombre && (
                        <span className="text-muted-foreground ml-1">
                          ({(v.perfiles as any).nombre}{" "}
                          {(v.perfiles as any).apellido})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo y Fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo de trabajo *</Label>
                <Select
                  name="tipo"
                  onValueChange={(v) => setTipo(String(v ?? ""))}
                  required
                >
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
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

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label htmlFor="descripcion">Descripción del trabajo *</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                required
                placeholder="Describe detalladamente el trabajo realizado..."
              />
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="kilometraje">Kilometraje</Label>
                <Input
                  id="kilometraje"
                  name="kilometraje"
                  type="number"
                  min="0"
                  placeholder="0"
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
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proximo_km">Próx. km</Label>
                <Input
                  id="proximo_km"
                  name="proximo_km"
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="proxima_fecha">Próxima revisión</Label>
                <Input id="proxima_fecha" name="proxima_fecha" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  name="observaciones"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {/* Sección cambio de aceite */}
            {esAceite && (
              <>
                <Separator />
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-primary" />
                  <p className="font-medium text-sm">Datos del Cambio de Aceite</p>
                </div>
                <input type="hidden" name="es_aceite" value="true" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="marca_aceite">Marca del aceite</Label>
                    <Input
                      id="marca_aceite"
                      name="marca_aceite"
                      placeholder="Mobil, Castrol, Shell..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="viscosidad">Viscosidad</Label>
                    <Input
                      id="viscosidad"
                      name="viscosidad"
                      placeholder="5W-30, 10W-40..."
                    />
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
                        <SelectItem value="semisisntetico">
                          Semisintético
                        </SelectItem>
                        <SelectItem value="mineral">Mineral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cantidad_litros">Litros</Label>
                    <Input
                      id="cantidad_litros"
                      name="cantidad_litros"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="4.0"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Link href="/mecanico/dashboard" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isPending ? "Guardando..." : "Registrar Trabajo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

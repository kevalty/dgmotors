"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, UserPlus, Car } from "lucide-react";
import { registrarClienteWalkIn } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

const TIPOS_VEHICULO = ["sedan", "camioneta", "suv", "pickup", "furgoneta", "otro"];
const COMBUSTIBLES = ["gasolina", "diesel", "hibrido", "electrico"];

export default function NuevoClienteWalkInPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registrarClienteWalkIn, {});
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [guardandoAuto, setGuardandoAuto] = useState(false);
  const [autoGuardado, setAutoGuardado] = useState(false);
  const [autoError, setAutoError] = useState("");

  // Controlled selects for vehicle
  const [tipoVehiculo, setTipoVehiculo] = useState("");
  const [combustible, setCombustible] = useState("");
  const [tipoLabel, setTipoLabel] = useState("");
  const [combustibleLabel, setCombustibleLabel] = useState("");

  useEffect(() => { setTipoLabel(tipoVehiculo); }, [tipoVehiculo]);
  useEffect(() => { setCombustibleLabel(combustible); }, [combustible]);

  useEffect(() => {
    if ((state as any).clienteId) {
      setClienteId((state as any).clienteId);
    }
  }, [state]);

  const handleGuardarAuto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!clienteId) return;
    setGuardandoAuto(true);
    setAutoError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    const supabase = createClient();
    const { error } = await supabase.from("vehiculos").insert({
      cliente_id: clienteId,
      placa: data.get("placa") as string,
      marca: data.get("marca") as string,
      modelo: data.get("modelo") as string,
      anio: parseInt(data.get("anio") as string) || null,
      color: data.get("color") as string || null,
      kilometraje: parseInt(data.get("kilometraje") as string) || 0,
      tipo: tipoVehiculo || null,
      combustible: combustible || null,
    });

    setGuardandoAuto(false);
    if (error) {
      setAutoError("Error al guardar el vehículo: " + error.message);
    } else {
      setAutoGuardado(true);
      setTimeout(() => router.push(`/admin/clientes/${clienteId}`), 1000);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/clientes">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Registrar Cliente Walk-In
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Para clientes que llegan sin cuenta previa
          </p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Paso 1: Datos del cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Paso 1 — Datos del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {(state as any).error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{(state as any).error}
                </div>
              )}
              {(state as any).success && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />{(state as any).success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input id="nombre" name="nombre" placeholder="Juan" required disabled={!!clienteId} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input id="apellido" name="apellido" placeholder="Pérez" required disabled={!!clienteId} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input id="cedula" name="cedula" placeholder="1234567890" disabled={!!clienteId} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" name="telefono" type="tel" placeholder="+593 99 XXX XXXX" disabled={!!clienteId} />
                </div>
              </div>

              {!clienteId && (
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isPending ? "Registrando..." : "Registrar Cliente"}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Paso 2: Vehículo (solo si cliente ya fue creado) */}
        {clienteId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                Paso 2 — Agregar Vehículo <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {autoError && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-md bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />{autoError}
                </div>
              )}
              {autoGuardado && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-md bg-green-500/10 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />Vehículo guardado. Redirigiendo...
                </div>
              )}

              <form onSubmit={handleGuardarAuto} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="placa">Placa *</Label>
                    <Input id="placa" name="placa" placeholder="ABC-1234" required className="uppercase" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="anio">Año</Label>
                    <Input id="anio" name="anio" type="number" min="1990" max={new Date().getFullYear() + 1} placeholder="2020" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="marca">Marca *</Label>
                    <Input id="marca" name="marca" placeholder="Ford" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="modelo">Modelo *</Label>
                    <Input id="modelo" name="modelo" placeholder="F-150" required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <input type="hidden" name="tipo" value={tipoVehiculo} />
                    <Select value={tipoVehiculo} onValueChange={(v) => setTipoVehiculo(v || "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo">
                          {tipoLabel ? tipoLabel.replace(/\b\w/g, (c) => c.toUpperCase()) : "Tipo"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_VEHICULO.map((t) => (
                          <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Combustible</Label>
                    <input type="hidden" name="combustible" value={combustible} />
                    <Select value={combustible} onValueChange={(v) => setCombustible(v || "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Combustible">
                          {combustibleLabel ? combustibleLabel.charAt(0).toUpperCase() + combustibleLabel.slice(1) : "Combustible"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {COMBUSTIBLES.map((c) => (
                          <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" name="color" placeholder="Blanco" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="kilometraje">Kilometraje actual</Label>
                  <Input id="kilometraje" name="kilometraje" type="number" min="0" placeholder="0" />
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/admin/clientes/${clienteId}`)}
                  >
                    Omitir vehículo
                  </Button>
                  <Button type="submit" className="flex-1" disabled={guardandoAuto || autoGuardado}>
                    {guardandoAuto && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {guardandoAuto ? "Guardando..." : "Guardar Vehículo"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

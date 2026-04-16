"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { crearProspecto } from "@/lib/actions/ventas";
import type { VentasState } from "@/lib/actions/ventas";

const initialState: VentasState = {};

const ORIGENES = [
  "Referido",
  "Redes sociales",
  "Llamada en frío",
  "Evento / feria",
  "Sitio web",
  "WhatsApp",
  "Otro",
];

export default function NuevoProspectoPage() {
  const [state, formAction, isPending] = useActionState(crearProspecto, initialState);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/prospectos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Nuevo Prospecto
          </h1>
          <p className="text-muted-foreground text-sm">
            Registrar taller interesado en el sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Prospecto</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Nombre + empresa */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre Contacto *</Label>
                <Input id="nombre" name="nombre" placeholder="Nombre y apellido..." required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="empresa">Nombre del Taller / Empresa</Label>
                <Input id="empresa" name="empresa" placeholder="ej: Auto Taller XYZ..." />
              </div>
            </div>

            {/* Cargo + ciudad */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cargo">Cargo</Label>
                <Input id="cargo" name="cargo" placeholder="ej: Gerente, Dueño..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input id="ciudad" name="ciudad" placeholder="ej: Cuenca, Ambato..." />
              </div>
            </div>

            {/* Teléfono + email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
                <Input id="telefono" name="telefono" placeholder="+593 99 XXX XXXX" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="contacto@taller.com" />
              </div>
            </div>

            {/* Origen + valor estimado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Canal de Origen</Label>
                <Select name="origen">
                  <SelectTrigger>
                    <SelectValue placeholder="¿Cómo llegó?" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGENES.map((o) => (
                      <SelectItem key={o} value={o.toLowerCase().replace(/ /g, "_")}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valor_est">Valor Estimado Contrato ($)</Label>
                <Input
                  id="valor_est"
                  name="valor_est"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="ej: 2500.00"
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                name="notas"
                placeholder="Observaciones, necesidades específicas del taller..."
                rows={4}
              />
            </div>

            {state?.error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
                {state.error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Guardando..." : "Registrar Prospecto"}
              </Button>
              <Link href="/admin/prospectos">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

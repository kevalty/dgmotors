"use client";

import type { Metadata } from "next";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { crearVehiculo } from "@/lib/actions/vehiculos";
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

const initialState = {};

export default function NuevoVehiculoPage() {
  const [state, formAction, isPending] = useActionState(crearVehiculo, initialState);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/cliente/vehiculos">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Agregar Vehículo
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Completa los datos de tu vehículo
          </p>
        </div>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Datos del Vehículo</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {(state as any).error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(state as any).error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="placa">Placa *</Label>
              <Input id="placa" name="placa" placeholder="ABC-1234" required className="uppercase" />
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="anio">Año *</Label>
                <Input
                  id="anio"
                  name="anio"
                  type="number"
                  placeholder="2020"
                  min="1980"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" placeholder="Blanco" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo</Label>
                <Select name="tipo">
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">Sedán</SelectItem>
                    <SelectItem value="camioneta">Camioneta</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="furgoneta">Furgoneta</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="combustible">Combustible</Label>
                <Select name="combustible">
                  <SelectTrigger id="combustible">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasolina">Gasolina</SelectItem>
                    <SelectItem value="diesel">Diésel</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                    <SelectItem value="electrico">Eléctrico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kilometraje">Kilometraje actual</Label>
              <Input
                id="kilometraje"
                name="kilometraje"
                type="number"
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vin">VIN / Chasis</Label>
              <Input id="vin" name="vin" placeholder="Número de chasis (opcional)" className="uppercase" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notas">Notas adicionales</Label>
              <Textarea
                id="notas"
                name="notas"
                placeholder="Observaciones sobre el vehículo..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/cliente/vehiculos" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? "Guardando..." : "Guardar Vehículo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

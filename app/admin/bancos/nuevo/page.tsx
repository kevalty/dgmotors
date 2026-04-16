"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crearBanco } from "@/lib/actions/bancos";
import type { BancosState } from "@/lib/actions/bancos";

const initialState: BancosState = {};

export default function NuevoBancoPage() {
  const [state, formAction, isPending] = useActionState(crearBanco, initialState);

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/bancos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Nueva Cuenta Bancaria
          </h1>
          <p className="text-muted-foreground text-sm">
            Registrar cuenta bancaria en el sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {/* Nombre del banco */}
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre del Banco *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="ej: Banco Pichincha, Produbanco..."
                required
              />
            </div>

            {/* Número de cuenta */}
            <div className="space-y-1.5">
              <Label htmlFor="numero_cta">Número de Cuenta *</Label>
              <Input
                id="numero_cta"
                name="numero_cta"
                placeholder="ej: 3305678910"
                required
              />
            </div>

            {/* Tipo de cuenta + Sucursal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de Cuenta</Label>
                <Select name="tipo_cta">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corriente">Corriente</SelectItem>
                    <SelectItem value="ahorros">Ahorros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Sucursal</Label>
                <Select name="sucursal">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quito">Quito</SelectItem>
                    <SelectItem value="guayaquil">Guayaquil</SelectItem>
                    <SelectItem value="ambos">Ambas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Saldo inicial */}
            <div className="space-y-1.5">
              <Label htmlFor="saldo_inicial">Saldo Inicial ($)</Label>
              <Input
                id="saldo_inicial"
                name="saldo_inicial"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Saldo al momento de activar el sistema (saldo anterior al primer movimiento registrado aquí)
              </p>
            </div>

            {state?.error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
                {state.error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Guardando..." : "Registrar Cuenta"}
              </Button>
              <Link href="/admin/bancos">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

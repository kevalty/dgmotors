"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { crearMecanico } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NuevoMecanicoPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(crearMecanico, {});

  useEffect(() => {
    if ((state as any).success) {
      setTimeout(() => router.push("/admin/mecanicos"), 1500);
    }
  }, [state]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/mecanicos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Nuevo Mecánico
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Crea una cuenta para un técnico del taller
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Datos del Mecánico</CardTitle>
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
                {(state as any).success} Redirigiendo...
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" name="nombre" placeholder="Juan" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input id="apellido" name="apellido" placeholder="Pérez" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cedula">Cédula</Label>
              <Input id="cedula" name="cedula" placeholder="1234567890" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" type="tel" placeholder="+593 99 XXX XXXX" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" placeholder="mecanico@dgmotors.com" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña temporal *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
              />
              <p className="text-xs text-muted-foreground">
                El mecánico podrá cambiarla desde su perfil.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin/mecanicos" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? "Creando..." : "Crear Mecánico"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

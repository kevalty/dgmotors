"use client";

import { useEffect, useState, useActionState } from "react";
import { User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { actualizarPerfil } from "@/lib/actions/perfil";
import { createClient } from "@/lib/supabase/client";

const initialState = {};

export default function PerfilPage() {
  const [state, formAction, isPending] = useActionState(actualizarPerfil, initialState);
  const [perfil, setPerfil] = useState<any>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email || "");
      supabase
        .from("perfiles")
        .select("nombre, apellido, telefono, cedula, avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setPerfil(data));
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Mi Perfil
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Actualiza tu información personal
        </p>
      </div>

      <div className="max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Datos Personales
            </CardTitle>
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
                <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {(state as any).success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    defaultValue={perfil?.nombre || ""}
                    key={perfil?.nombre}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    defaultValue={perfil?.apellido || ""}
                    key={perfil?.apellido}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">El email no puede cambiarse desde aquí</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  defaultValue={perfil?.telefono || ""}
                  key={perfil?.telefono}
                  placeholder="+593 99 XXX XXXX"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cedula">Cédula / RUC</Label>
                <Input
                  id="cedula"
                  name="cedula"
                  defaultValue={perfil?.cedula || ""}
                  key={perfil?.cedula}
                  placeholder="0000000000"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

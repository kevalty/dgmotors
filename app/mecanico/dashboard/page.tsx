import Link from "next/link";
import { Wrench, Car, ClipboardList, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function MecanicoDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre")
    .eq("id", user.id)
    .single();

  const [
    { count: totalVehiculos },
    { data: misTrabajos },
    { data: citasPendientes },
  ] = await Promise.all([
    supabase
      .from("vehiculos")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("mantenimientos")
      .select("id, tipo, descripcion, fecha, vehiculos(placa, marca, modelo)")
      .eq("tecnico_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("citas")
      .select("id, fecha_hora, sucursal, estado, vehiculos(placa, marca, modelo), perfiles!citas_cliente_id_fkey(nombre, apellido)")
      .in("estado", ["pendiente", "confirmada", "en_proceso"])
      .order("fecha_hora", { ascending: true })
      .limit(5),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Bienvenido, {perfil?.nombre || "Mecánico"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Panel de trabajo del taller
          </p>
        </div>
        <Link href="/mecanico/registrar">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Registrar Trabajo
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Car className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVehiculos || 0}</p>
                <p className="text-xs text-muted-foreground">Vehículos en sistema</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Wrench className="w-4.5 h-4.5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{misTrabajos?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Mis últimos trabajos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Citas pendientes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Citas del taller
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!citasPendientes?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay citas pendientes
              </p>
            ) : (
              <div className="space-y-3">
                {citasPendientes.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {(c.perfiles as any)?.nombre}{" "}
                        {(c.perfiles as any)?.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(c.vehiculos as any)?.placa} —{" "}
                        {(c.vehiculos as any)?.marca}{" "}
                        {(c.vehiculos as any)?.modelo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.fecha_hora)} ·{" "}
                        {c.sucursal === "quito" ? "Quito" : "Guayaquil"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        c.estado === "en_proceso" ? "default" : "secondary"
                      }
                      className="text-xs shrink-0"
                    >
                      {c.estado.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mis últimos trabajos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              Mis últimos trabajos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!misTrabajos?.length ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Aún no has registrado trabajos
                </p>
                <Link href="/mecanico/registrar">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Registrar primero
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {misTrabajos.map((m) => (
                  <div key={m.id} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{m.descripcion}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {m.tipo.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(m.vehiculos as any)?.placa} —{" "}
                      {(m.vehiculos as any)?.marca}{" "}
                      {(m.vehiculos as any)?.modelo} · {formatDate(m.fecha)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

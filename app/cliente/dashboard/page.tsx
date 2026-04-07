import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Car, Wrench, Droplets, ChevronRight, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  formatDate,
  formatDateTime,
  ESTADO_CITA_LABELS,
  ESTADO_CITA_COLORS,
  formatKm,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vehiculos } = await supabase
    .from("vehiculos")
    .select("id, placa, marca, modelo, anio")
    .eq("cliente_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const vehiculoIds = (vehiculos || []).map((v: { id: string }) => v.id);

  const [{ data: citas }, { data: mantenimientos }, { data: aceites }] =
    await Promise.all([
      supabase
        .from("citas")
        .select("id, fecha_hora, estado, sucursal, servicios(nombre)")
        .eq("cliente_id", user.id)
        .gte("fecha_hora", new Date().toISOString())
        .order("fecha_hora")
        .limit(1),
      vehiculoIds.length > 0
        ? supabase
            .from("mantenimientos")
            .select("id, tipo, fecha, kilometraje, vehiculos(placa, marca, modelo)")
            .in("vehiculo_id", vehiculoIds)
            .order("fecha", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] }),
      vehiculoIds.length > 0
        ? supabase
            .from("cambios_aceite")
            .select("id, fecha, kilometraje, proximo_km, proxima_fecha, vehiculos(placa, marca, modelo)")
            .in("vehiculo_id", vehiculoIds)
            .order("fecha", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] }),
    ]);

  const proximaCita = citas?.[0];
  const ultimoMantenimiento = mantenimientos?.[0];
  const ultimoAceite = aceites?.[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Resumen de tu cuenta y vehículos
          </p>
        </div>
        <Link href="/cliente/citas/nueva">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Nueva Cita
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Vehículos",
            value: vehiculos?.length ?? 0,
            icon: Car,
            href: "/cliente/vehiculos",
          },
          {
            label: "Próxima cita",
            value: proximaCita ? formatDate(proximaCita.fecha_hora, "dd MMM") : "—",
            icon: Calendar,
            href: "/cliente/citas",
          },
          {
            label: "Último mant.",
            value: ultimoMantenimiento ? formatDate(ultimoMantenimiento.fecha, "dd MMM yy") : "—",
            icon: Wrench,
            href: "/cliente/mantenimiento",
          },
          {
            label: "Último aceite",
            value: ultimoAceite ? formatDate(ultimoAceite.fecha, "dd MMM yy") : "—",
            icon: Droplets,
            href: "/cliente/aceite",
          },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Próxima cita */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Próxima Cita
              </span>
              <Link href="/cliente/citas" className="text-xs text-primary hover:underline">
                Ver todas
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximaCita ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {formatDateTime(proximaCita.fecha_hora)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    className={ESTADO_CITA_COLORS[proximaCita.estado]}
                    variant="secondary"
                  >
                    {ESTADO_CITA_LABELS[proximaCita.estado]}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {proximaCita.sucursal}
                  </Badge>
                </div>
                {(proximaCita.servicios as any)?.nombre && (
                  <p className="text-sm text-muted-foreground">
                    {(proximaCita.servicios as any).nombre}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">Sin citas próximas</p>
                <Link href="/cliente/citas/nueva">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Agendar Cita
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehículos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                Mis Vehículos
              </span>
              <Link href="/cliente/vehiculos" className="text-xs text-primary hover:underline">
                Ver todos
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehiculos && vehiculos.length > 0 ? (
              <div className="space-y-2">
                {vehiculos.slice(0, 3).map((v) => (
                  <Link
                    key={v.id}
                    href={`/cliente/vehiculos/${v.id}`}
                    className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {v.marca} {v.modelo} {v.anio}
                      </p>
                      <p className="text-xs text-muted-foreground">{v.placa}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">Sin vehículos registrados</p>
                <Link href="/cliente/vehiculos/nuevo">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Agregar Vehículo
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Último mantenimiento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                Último Mantenimiento
              </span>
              <Link href="/cliente/mantenimiento" className="text-xs text-primary hover:underline">
                Historial
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimoMantenimiento ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium capitalize">
                  {ultimoMantenimiento.tipo.replace("_", " ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(ultimoMantenimiento.fecha)} ·{" "}
                  {(ultimoMantenimiento.vehiculos as any)?.marca}{" "}
                  {(ultimoMantenimiento.vehiculos as any)?.modelo}
                </p>
                {ultimoMantenimiento.kilometraje && (
                  <p className="text-xs text-muted-foreground">
                    {formatKm(ultimoMantenimiento.kilometraje)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin registros de mantenimiento
              </p>
            )}
          </CardContent>
        </Card>

        {/* Último aceite */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-primary" />
                Último Cambio de Aceite
              </span>
              <Link href="/cliente/aceite" className="text-xs text-primary hover:underline">
                Historial
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ultimoAceite ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  {formatDate(ultimoAceite.fecha)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(ultimoAceite.vehiculos as any)?.marca}{" "}
                  {(ultimoAceite.vehiculos as any)?.modelo} ·{" "}
                  {formatKm(ultimoAceite.kilometraje)}
                </p>
                {ultimoAceite.proximo_km && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">Próximo:</span>
                    <span className="font-medium text-primary">
                      {formatKm(ultimoAceite.proximo_km)}
                    </span>
                    {ultimoAceite.proxima_fecha && (
                      <span className="text-muted-foreground">
                        · {formatDate(ultimoAceite.proxima_fecha)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin registros de aceite
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Users, Car, DollarSign, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatCurrency, ESTADO_CITA_LABELS, ESTADO_CITA_COLORS } from "@/lib/utils";
import { DashboardDateFilter } from "@/components/admin/DashboardDateFilter";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha } = await searchParams;
  const supabase = await createClient();

  // Fecha seleccionada (defecto: hoy)
  const hoyStr = new Date().toISOString().split("T")[0];
  const fechaSeleccionada = fecha || hoyStr;

  const diaInicio = new Date(fechaSeleccionada + "T00:00:00");
  const diaFin = new Date(fechaSeleccionada + "T23:59:59.999");
  const mesInicio = new Date(diaInicio.getFullYear(), diaInicio.getMonth(), 1);

  const [
    { count: totalClientes },
    { count: totalVehiculos },
    { count: citasDia },
    { data: citasDelDia },
    { data: mantenimientosMes },
  ] = await Promise.all([
    supabase.from("perfiles").select("*", { count: "exact", head: true }).eq("rol", "cliente"),
    supabase.from("vehiculos").select("*", { count: "exact", head: true }),
    supabase
      .from("citas")
      .select("*", { count: "exact", head: true })
      .gte("fecha_hora", diaInicio.toISOString())
      .lte("fecha_hora", diaFin.toISOString()),
    supabase
      .from("citas")
      .select(`
        id, fecha_hora, estado, sucursal,
        perfiles(nombre, apellido),
        vehiculos(placa, marca, modelo),
        servicios(nombre)
      `)
      .gte("fecha_hora", diaInicio.toISOString())
      .lte("fecha_hora", diaFin.toISOString())
      .order("fecha_hora"),
    supabase
      .from("mantenimientos")
      .select("costo")
      .gte("fecha", mesInicio.toISOString().split("T")[0]),
  ]);

  const ingresosMes = (mantenimientosMes || []).reduce(
    (sum, m) => sum + (m.costo || 0),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Dashboard Administrativo
          </h1>
        </div>
      </div>

      {/* Filtro de fecha */}
      <div className="mb-6 p-3 rounded-lg border border-border/50 bg-muted/30">
        <DashboardDateFilter selectedDate={fechaSeleccionada} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Clientes", value: totalClientes ?? 0, icon: Users, href: "/admin/clientes" },
          { label: "Vehículos", value: totalVehiculos ?? 0, icon: Car, href: "/admin/vehiculos" },
          { label: `Citas ${fechaSeleccionada === hoyStr ? "hoy" : "ese día"}`, value: citasDia ?? 0, icon: Calendar, href: "/admin/citas" },
          { label: "Ingresos mes", value: formatCurrency(ingresosMes), icon: DollarSign, href: "/admin/reportes" },
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

      {/* Citas del día seleccionado */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Citas del día seleccionado
            </span>
            <Link href="/admin/citas">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver todas
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!citasDelDia || citasDelDia.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin citas para este día
            </p>
          ) : (
            <div className="space-y-2">
              {citasDelDia.map((c) => (
                <Link key={c.id} href={`/admin/citas/${c.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">
                          {(c.perfiles as any)?.nombre} {(c.perfiles as any)?.apellido}
                        </p>
                        <span className="text-xs text-muted-foreground">·</span>
                        <p className="text-xs text-muted-foreground truncate">
                          {(c.vehiculos as any)?.marca} {(c.vehiculos as any)?.modelo}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(c.fecha_hora)}
                        </p>
                        <Badge variant="outline" className="text-xs capitalize py-0">
                          {c.sucursal}
                        </Badge>
                      </div>
                    </div>
                    <Badge className={`${ESTADO_CITA_COLORS[c.estado]} shrink-0 text-xs`} variant="secondary">
                      {ESTADO_CITA_LABELS[c.estado]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

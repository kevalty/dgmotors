import type { Metadata } from "next";
import { BarChart3, DollarSign, Calendar, Car, Users, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reportes" };

export default async function ReportesPage() {
  const supabase = await createClient();

  const ahora = new Date();
  const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const mesAnteriorInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const mesAnteriorFin = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

  const [
    { count: totalClientes },
    { count: totalVehiculos },
    { count: citasMes },
    { count: citasAnterior },
    { data: mantenimientosMes },
    { data: mantenimientosAnterior },
    { data: serviciosTop },
  ] = await Promise.all([
    supabase.from("perfiles").select("*", { count: "exact", head: true }).eq("rol", "cliente"),
    supabase.from("vehiculos").select("*", { count: "exact", head: true }),
    supabase
      .from("citas")
      .select("*", { count: "exact", head: true })
      .gte("fecha_hora", mesInicio.toISOString())
      .neq("estado", "cancelada"),
    supabase
      .from("citas")
      .select("*", { count: "exact", head: true })
      .gte("fecha_hora", mesAnteriorInicio.toISOString())
      .lte("fecha_hora", mesAnteriorFin.toISOString())
      .neq("estado", "cancelada"),
    supabase
      .from("mantenimientos")
      .select("costo")
      .gte("fecha", mesInicio.toISOString().split("T")[0]),
    supabase
      .from("mantenimientos")
      .select("costo")
      .gte("fecha", mesAnteriorInicio.toISOString().split("T")[0])
      .lte("fecha", mesAnteriorFin.toISOString().split("T")[0]),
    supabase
      .from("citas")
      .select("servicios(nombre)")
      .not("servicio_id", "is", null)
      .gte("fecha_hora", mesInicio.toISOString()),
  ]);

  const ingresosMes = (mantenimientosMes || []).reduce((s, m) => s + (m.costo || 0), 0);
  const ingresosAnterior = (mantenimientosAnterior || []).reduce((s, m) => s + (m.costo || 0), 0);

  const variacionCitas =
    citasAnterior && citasAnterior > 0
      ? (((citasMes || 0) - citasAnterior) / citasAnterior) * 100
      : 0;
  const variacionIngresos =
    ingresosAnterior > 0 ? ((ingresosMes - ingresosAnterior) / ingresosAnterior) * 100 : 0;

  // Contar servicios más solicitados
  const serviciosCount: Record<string, number> = {};
  (serviciosTop || []).forEach((c) => {
    const nombre = (c.servicios as any)?.nombre;
    if (nombre) serviciosCount[nombre] = (serviciosCount[nombre] || 0) + 1;
  });
  const topServicios = Object.entries(serviciosCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const mesNombre = ahora.toLocaleDateString("es-EC", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Reportes
        </h1>
        <p className="text-muted-foreground text-sm mt-1 capitalize">{mesNombre}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Clientes totales", value: totalClientes ?? 0, icon: Users, suffix: "" },
          { label: "Vehículos totales", value: totalVehiculos ?? 0, icon: Car, suffix: "" },
          { label: `Citas este mes`, value: citasMes ?? 0, icon: Calendar, diff: variacionCitas },
          { label: "Ingresos este mes", value: formatCurrency(ingresosMes), icon: DollarSign, diff: variacionIngresos },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-bold">{s.value}</p>
              {s.diff !== undefined && (
                <p className={`text-xs mt-1 ${s.diff >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {s.diff >= 0 ? "+" : ""}{s.diff.toFixed(1)}% vs mes anterior
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Servicios más solicitados */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              Servicios más solicitados (este mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topServicios.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            ) : (
              <div className="space-y-2.5">
                {topServicios.map(([nombre, count], i) => (
                  <div key={nombre} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{nombre}</p>
                      <div className="h-1.5 bg-muted rounded-full mt-1">
                        <div
                          className="h-1.5 bg-primary rounded-full"
                          style={{ width: `${(count / (topServicios[0][1] || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen comparativo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Comparativo mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: "Citas",
                  actual: citasMes || 0,
                  anterior: citasAnterior || 0,
                },
                {
                  label: "Ingresos",
                  actual: ingresosMes,
                  anterior: ingresosAnterior,
                  currency: true,
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground text-xs">Este mes vs anterior</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs">Este mes</span>
                      <div className="flex-1 h-2 bg-muted rounded-full">
                        <div
                          className="h-2 bg-primary rounded-full"
                          style={{
                            width: `${Math.max(
                              item.actual,
                              item.anterior
                            ) > 0
                              ? (item.actual / Math.max(item.actual, item.anterior)) * 100
                              : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-20 text-xs text-right font-medium">
                        {item.currency ? formatCurrency(item.actual) : item.actual}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs text-muted-foreground">Anterior</span>
                      <div className="flex-1 h-2 bg-muted rounded-full">
                        <div
                          className="h-2 bg-muted-foreground/40 rounded-full"
                          style={{
                            width: `${Math.max(
                              item.actual,
                              item.anterior
                            ) > 0
                              ? (item.anterior / Math.max(item.actual, item.anterior)) * 100
                              : 0}%`,
                          }}
                        />
                      </div>
                      <span className="w-20 text-xs text-right text-muted-foreground">
                        {item.currency ? formatCurrency(item.anterior) : item.anterior}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

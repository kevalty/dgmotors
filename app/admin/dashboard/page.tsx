import type { Metadata } from "next";
import Link from "next/link";
import {
  Calendar, Users, Car, DollarSign, Clock, ArrowRight,
  ClipboardList, AlertTriangle, Wallet, FileText,
  TrendingUp, CheckCircle2, Wrench, Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  formatDateTime, formatCurrency,
  ESTADO_CITA_LABELS, ESTADO_CITA_COLORS,
  ESTADO_OT_LABELS, ESTADO_OT_COLORS,
} from "@/lib/utils";
import { DashboardDateFilter } from "@/components/admin/DashboardDateFilter";
import { IngresosMesChart } from "@/components/admin/IngresosMesChart";

export const metadata: Metadata = { title: "Admin Dashboard" };

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha } = await searchParams;
  const supabase = await createClient();

  const hoyStr = new Date().toISOString().split("T")[0];
  const fechaSeleccionada = fecha || hoyStr;

  const diaInicio = new Date(fechaSeleccionada + "T00:00:00");
  const diaFin   = new Date(fechaSeleccionada + "T23:59:59.999");
  const mesInicio = new Date(diaInicio.getFullYear(), diaInicio.getMonth(), 1);

  // Últimos 6 meses para el gráfico
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
  seisMesesAtras.setDate(1);

  const [
    { count: totalClientes },
    { count: totalVehiculos },
    { count: citasDia },
    { data: citasDelDia },
    { data: otActivas },
    { data: otCompletadasHoy },
    { data: repuestosBajos },
    { data: facturasMes },
    { data: sesionCaja },
    { data: pagosGrafico },
    { data: topMecanicos },
  ] = await Promise.all([
    supabase.from("perfiles").select("*", { count: "exact", head: true }).eq("rol", "cliente"),
    supabase.from("vehiculos").select("*", { count: "exact", head: true }),
    supabase.from("citas")
      .select("*", { count: "exact", head: true })
      .gte("fecha_hora", diaInicio.toISOString())
      .lte("fecha_hora", diaFin.toISOString()),
    supabase.from("citas")
      .select(`
        id, fecha_hora, estado, sucursal,
        perfiles!citas_cliente_id_fkey(nombre, apellido),
        vehiculos(placa, marca, modelo),
        servicios(nombre)
      `)
      .gte("fecha_hora", diaInicio.toISOString())
      .lte("fecha_hora", diaFin.toISOString())
      .order("fecha_hora"),
    supabase.from("ordenes_trabajo")
      .select(`
        id, numero, estado,
        perfiles!ordenes_trabajo_cliente_id_fkey(nombre, apellido),
        vehiculos(placa, marca, modelo)
      `)
      .in("estado", ["presupuesto","aprobado","en_proceso","pausado"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("ordenes_trabajo")
      .select("id", { count: "exact", head: false })
      .eq("estado", "completado")
      .gte("updated_at", diaInicio.toISOString())
      .lte("updated_at", diaFin.toISOString()),
    supabase.from("repuestos")
      .select("id, nombre, stock_actual, stock_minimo, unidad")
      .eq("activo", true)
      .filter("stock_actual", "lte", "stock_minimo")
      .order("stock_actual"),
    supabase.from("facturas")
      .select("total, estado")
      .gte("fecha_emision", mesInicio.toISOString().split("T")[0]),
    supabase.from("caja_sesiones")
      .select("id, fecha_apertura, cajas(nombre)")
      .eq("estado", "abierta")
      .maybeSingle(),
    // Pagos de los últimos 6 meses para el gráfico
    supabase.from("pagos")
      .select("monto, fecha")
      .gte("fecha", seisMesesAtras.toISOString()),
    // Top mecánicos: conteo de líneas de mano_obra completadas
    supabase.from("ot_lineas")
      .select(`
        mecanico_id,
        perfiles!ot_lineas_mecanico_id_fkey(nombre, apellido),
        subtotal
      `)
      .eq("tipo", "mano_obra")
      .not("mecanico_id", "is", null)
      .gte("created_at", mesInicio.toISOString()),
  ]);

  // Calcular datos del gráfico — agrupar pagos por mes
  const pagosPorMes: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    pagosPorMes[key] = 0;
  }
  for (const p of pagosGrafico || []) {
    const key = (p.fecha as string).slice(0, 7);
    if (key in pagosPorMes) pagosPorMes[key] += p.monto;
  }
  const chartData = Object.entries(pagosPorMes).map(([key, total]) => ({
    mes: MESES[parseInt(key.split("-")[1]) - 1],
    total: Math.round(total * 100) / 100,
  }));

  // Agrupar top mecánicos
  const mecMap: Record<string, { nombre: string; servicios: number; total: number }> = {};
  for (const l of topMecanicos || []) {
    if (!l.mecanico_id) continue;
    const p = l.perfiles as any;
    if (!mecMap[l.mecanico_id]) {
      mecMap[l.mecanico_id] = {
        nombre: `${p?.nombre || ""} ${p?.apellido || ""}`.trim(),
        servicios: 0,
        total: 0,
      };
    }
    mecMap[l.mecanico_id].servicios += 1;
    mecMap[l.mecanico_id].total += l.subtotal || 0;
  }
  const topMecList = Object.values(mecMap)
    .sort((a, b) => b.servicios - a.servicios)
    .slice(0, 4);

  const factMesPagadas  = (facturasMes || []).filter(f => f.estado === "pagada").reduce((a, f) => a + (f.total || 0), 0);
  const factMesPendientes = (facturasMes || []).filter(f => f.estado === "pendiente").reduce((a, f) => a + (f.total || 0), 0);
  const ingresosTotalGrafico = Object.values(pagosPorMes).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Dashboard
        </h1>
      </div>

      {/* Filtro de fecha */}
      <div className="mb-6 p-3 rounded-lg border border-border/50 bg-muted/30">
        <DashboardDateFilter selectedDate={fechaSeleccionada} />
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Clientes", value: totalClientes ?? 0, icon: Users, href: "/admin/clientes", sub: null },
          { label: "Vehículos", value: totalVehiculos ?? 0, icon: Car, href: "/admin/vehiculos", sub: null },
          { label: `Citas ${fechaSeleccionada === hoyStr ? "hoy" : "ese día"}`, value: citasDia ?? 0, icon: Calendar, href: "/admin/citas", sub: null },
          { label: "OTs completadas hoy", value: (otCompletadasHoy || []).length, icon: CheckCircle2, href: "/admin/ordenes", sub: null },
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

      {/* ERP KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link href="/admin/ordenes">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">OTs activas</p>
                <ClipboardList className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-bold">{(otActivas || []).length}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/facturacion">
          <Card className="hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Facturado este mes</p>
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-bold text-primary">{formatCurrency(factMesPagadas)}</p>
              {factMesPendientes > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  +{formatCurrency(factMesPendientes)} por cobrar
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/inventario">
          <Card className={`hover:border-primary/30 transition-colors cursor-pointer ${(repuestosBajos || []).length > 0 ? "border-yellow-500/30" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Stock bajo mínimo</p>
                <AlertTriangle className={`w-4 h-4 ${(repuestosBajos || []).length > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
              </div>
              <p className={`text-xl font-bold ${(repuestosBajos || []).length > 0 ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
                {(repuestosBajos || []).length}
              </p>
              <p className="text-xs text-muted-foreground">repuestos</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/caja">
          <Card className={`hover:border-primary/30 transition-colors cursor-pointer ${sesionCaja ? "border-green-500/30" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Caja</p>
                <Wallet className={`w-4 h-4 ${sesionCaja ? "text-green-500" : "text-muted-foreground"}`} />
              </div>
              <p className={`text-sm font-bold ${sesionCaja ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                {sesionCaja ? "Abierta" : "Cerrada"}
              </p>
              {sesionCaja && (
                <p className="text-xs text-muted-foreground truncate">
                  {(sesionCaja.cajas as any)?.nombre}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Gráfico + Top mecánicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Gráfico de ingresos */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Ingresos últimos 6 meses
              </span>
              <span className="text-sm font-normal text-primary">
                {formatCurrency(ingresosTotalGrafico)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IngresosMesChart data={chartData} />
          </CardContent>
        </Card>

        {/* Top mecánicos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              Top mecánicos (mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topMecList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin datos este mes</p>
            ) : (
              <div className="space-y-3">
                {topMecList.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.nombre || "—"}</p>
                      <p className="text-xs text-muted-foreground">{m.servicios} servicios</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(m.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock bajo — alerta detallada */}
      {(repuestosBajos || []).length > 0 && (
        <Card className="mb-6 border-yellow-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                Repuestos con stock bajo ({repuestosBajos!.length})
              </span>
              <Link href="/admin/inventario">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Gestionar <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {repuestosBajos!.slice(0, 6).map((r) => (
                <Link key={r.id} href={`/admin/inventario/${r.id}`}>
                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="w-3 h-3 text-yellow-500 shrink-0" />
                      <span className="text-sm truncate">{r.nombre}</span>
                    </div>
                    <div className="text-xs text-right shrink-0 ml-2">
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">{r.stock_actual}</span>
                      <span className="text-muted-foreground"> / {r.stock_minimo} {r.unidad}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OTs activas */}
      {(otActivas || []).length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Órdenes de trabajo activas
              </span>
              <Link href="/admin/ordenes">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(otActivas || []).map((ot: any) => (
                <Link key={ot.id} href={`/admin/ordenes/${ot.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <span className="text-sm font-mono font-semibold text-primary shrink-0">
                      OT-{String(ot.numero).padStart(4, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {ot.perfiles?.nombre} {ot.perfiles?.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ot.vehiculos?.marca} {ot.vehiculos?.modelo} — {ot.vehiculos?.placa}
                      </p>
                    </div>
                    <Badge variant="secondary" className={`text-xs shrink-0 ${ESTADO_OT_COLORS[ot.estado]}`}>
                      {ESTADO_OT_LABELS[ot.estado]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Citas del día */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Citas {fechaSeleccionada === hoyStr ? "de hoy" : "del día seleccionado"}
            </span>
            <Link href="/admin/citas">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!citasDelDia || citasDelDia.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin citas para este día</p>
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
                        <p className="text-xs text-muted-foreground truncate">
                          {(c.vehiculos as any)?.marca} {(c.vehiculos as any)?.modelo}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">{formatDateTime(c.fecha_hora)}</p>
                        <Badge variant="outline" className="text-xs capitalize py-0">{c.sucursal}</Badge>
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

import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Users, Car, DollarSign, Clock, ArrowRight, ClipboardList, AlertTriangle, Wallet, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatCurrency, ESTADO_CITA_LABELS, ESTADO_CITA_COLORS, ESTADO_OT_LABELS, ESTADO_OT_COLORS } from "@/lib/utils";
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
    { data: otActivas },
    { data: repuestosBajos },
    { data: facturasMes },
    { data: sesionCaja },
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
        perfiles!citas_cliente_id_fkey(nombre, apellido),
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
    // ERP: OTs activas
    supabase
      .from("ordenes_trabajo")
      .select("id, numero, estado, perfiles!ordenes_trabajo_cliente_id_fkey(nombre, apellido), vehiculos(placa, marca, modelo)")
      .in("estado", ["presupuesto", "aprobado", "en_proceso", "pausado"])
      .order("created_at", { ascending: false })
      .limit(5),
    // ERP: Repuestos bajo mínimo
    supabase
      .from("repuestos")
      .select("id, nombre, stock_actual, stock_minimo")
      .eq("activo", true)
      .filter("stock_actual", "lte", "stock_minimo"),
    // ERP: Facturas del mes
    supabase
      .from("facturas")
      .select("total, estado")
      .gte("fecha_emision", mesInicio.toISOString().split("T")[0]),
    // ERP: Sesión de caja activa
    supabase
      .from("caja_sesiones")
      .select("id, fecha_apertura, cajas(nombre)")
      .eq("estado", "abierta")
      .maybeSingle(),
  ]);

  const ingresosMes = (mantenimientosMes || []).reduce(
    (sum, m) => sum + (m.costo || 0),
    0
  );

  const factMesPagadas = (facturasMes || [])
    .filter((f) => f.estado === "pagada")
    .reduce((acc, f) => acc + (f.total || 0), 0);

  const factMesPendientes = (facturasMes || [])
    .filter((f) => f.estado === "pendiente")
    .reduce((acc, f) => acc + (f.total || 0), 0);

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

      {/* ERP Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                <p className="text-xs text-muted-foreground">Facturado mes</p>
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
                <p className="text-xs text-muted-foreground">Stock bajo</p>
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

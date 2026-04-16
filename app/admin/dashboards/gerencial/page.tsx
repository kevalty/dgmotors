import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Users, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { SimpleBarChart } from "@/components/admin/charts/SimpleBarChart";

export const metadata: Metadata = { title: "Dashboard Gerencial" };

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default async function DashboardGerencialPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string; anio?: string }>;
}) {
  const sp = await searchParams;
  const anio = parseInt(sp.anio ?? String(new Date().getFullYear()));
  const supabase = await createClient();

  // Facturas del año filtradas por sucursal
  let qFacturas = supabase
    .from("facturas")
    .select("id, total, subtotal, iva_valor, fecha_emision, estado, sucursal, tipo, cliente_id, perfiles!facturas_cliente_id_fkey(nombre, apellido)")
    .gte("fecha_emision", `${anio}-01-01`)
    .lte("fecha_emision", `${anio}-12-31`)
    .eq("tipo", "factura");
  if (sp.sucursal) qFacturas = qFacturas.eq("sucursal", sp.sucursal) as any;

  const { data: facturas } = await qFacturas;
  const lista = facturas || [];

  // Compras del año
  let qCompras = supabase
    .from("compras")
    .select("total, fecha, sucursal")
    .gte("fecha", `${anio}-01-01`)
    .lte("fecha", `${anio}-12-31`);
  if (sp.sucursal) qCompras = qCompras.eq("sucursal", sp.sucursal) as any;
  const { data: compras } = await qCompras;

  const totalVentas  = lista.filter((f) => f.estado !== "anulada").reduce((s, f) => s + Number(f.total), 0);
  const totalCobrado = lista.filter((f) => f.estado === "pagada").reduce((s, f) => s + Number(f.total), 0);
  const totalCompras = (compras || []).reduce((s, c) => s + Number(c.total || 0), 0);
  const utilidad     = totalCobrado - totalCompras;

  // Ventas por mes
  const ventasPorMes = MESES.map((mes, i) => {
    const mNum = i + 1;
    const total = lista
      .filter((f) => {
        const m = new Date(f.fecha_emision).getMonth() + 1;
        return m === mNum && f.estado !== "anulada";
      })
      .reduce((s, f) => s + Number(f.total), 0);
    return { label: mes, value: total };
  });

  // Top 10 clientes por facturación
  const porCliente = lista
    .filter((f) => f.estado !== "anulada")
    .reduce<Record<string, { nombre: string; total: number; facturas: number }>>((acc, f) => {
      const p = (f.perfiles as any);
      const nombre = p ? `${p.nombre} ${p.apellido}` : "Sin nombre";
      if (!acc[f.cliente_id]) acc[f.cliente_id] = { nombre, total: 0, facturas: 0 };
      acc[f.cliente_id].total    += Number(f.total);
      acc[f.cliente_id].facturas += 1;
      return acc;
    }, {});
  const topClientes = Object.values(porCliente).sort((a, b) => b.total - a.total).slice(0, 10);

  // Ventas por sucursal
  const quitoV = lista.filter((f) => f.sucursal === "quito" && f.estado !== "anulada").reduce((s, f) => s + Number(f.total), 0);
  const guayV  = lista.filter((f) => f.sucursal === "guayaquil" && f.estado !== "anulada").reduce((s, f) => s + Number(f.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboards"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Dashboard Gerencial</h1>
            <p className="text-sm text-muted-foreground">Año {anio} · Estado del negocio</p>
          </div>
        </div>
        {/* Filtros */}
        <form className="flex gap-2">
          <select name="anio" defaultValue={String(anio)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select name="sucursal" defaultValue={sp.sucursal ?? ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Ambas sucursales</option>
            <option value="quito">Quito</option>
            <option value="guayaquil">Guayaquil</option>
          </select>
          <Button type="submit" size="sm" variant="outline">Aplicar</Button>
        </form>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ventas Totales", value: totalVentas, color: "text-primary", icon: TrendingUp },
          { label: "Cobrado", value: totalCobrado, color: "text-green-600 dark:text-green-400", icon: TrendingUp },
          { label: "Compras", value: totalCompras, color: "text-orange-600 dark:text-orange-400", icon: TrendingDown },
          { label: "Utilidad Estimada", value: utilidad, color: utilidad >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400", icon: utilidad >= 0 ? TrendingUp : TrendingDown },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{formatCurrency(k.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica mensual */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Ventas por Mes — {anio}</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={ventasPorMes} height={220} /></CardContent>
        </Card>

        {/* Sucursales */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Por Sucursal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Quito</span>
                <span className="font-semibold">{formatCurrency(quitoV)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: totalVentas > 0 ? `${(quitoV / totalVentas) * 100}%` : "0%" }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right mt-0.5">
                {totalVentas > 0 ? ((quitoV / totalVentas) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Guayaquil</span>
                <span className="font-semibold">{formatCurrency(guayV)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: totalVentas > 0 ? `${(guayV / totalVentas) * 100}%` : "0%" }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right mt-0.5">
                {totalVentas > 0 ? ((guayV / totalVentas) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top clientes */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Top 10 Clientes por Facturación — {anio}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Facturas</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">% del total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topClientes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin datos para este período</TableCell></TableRow>
              ) : topClientes.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                  <TableCell className="text-sm font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-right text-sm">{c.facturas}</TableCell>
                  <TableCell className="text-right text-sm font-semibold">{formatCurrency(c.total)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {totalVentas > 0 ? ((c.total / totalVentas) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

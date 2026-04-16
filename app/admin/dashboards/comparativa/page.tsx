import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { DualLineChart, SimpleBarChart } from "@/components/admin/charts/SimpleBarChart";

export const metadata: Metadata = { title: "Comparativa Ventas vs Compras" };

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default async function DashboardComparativaPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; sucursal?: string }>;
}) {
  const sp = await searchParams;
  const anio = parseInt(sp.anio ?? String(new Date().getFullYear()));
  const anioAnt = anio - 1;
  const supabase = await createClient();

  // Facturas año actual
  let qF = supabase
    .from("facturas")
    .select("total, fecha_emision, sucursal")
    .eq("tipo", "factura")
    .neq("estado", "anulada")
    .gte("fecha_emision", `${anio}-01-01`)
    .lte("fecha_emision", `${anio}-12-31`);
  if (sp.sucursal) qF = qF.eq("sucursal", sp.sucursal) as any;
  const { data: facturas } = await qF;

  // Facturas año anterior
  let qFA = supabase
    .from("facturas")
    .select("total, fecha_emision, sucursal")
    .eq("tipo", "factura")
    .neq("estado", "anulada")
    .gte("fecha_emision", `${anioAnt}-01-01`)
    .lte("fecha_emision", `${anioAnt}-12-31`);
  if (sp.sucursal) qFA = qFA.eq("sucursal", sp.sucursal) as any;
  const { data: facturasAnt } = await qFA;

  // Compras año actual
  let qC = supabase
    .from("compras")
    .select("total, fecha, sucursal")
    .neq("estado", "cancelada")
    .gte("fecha", `${anio}-01-01`)
    .lte("fecha", `${anio}-12-31`);
  if (sp.sucursal) qC = qC.eq("sucursal", sp.sucursal) as any;
  const { data: compras } = await qC;

  // Compras año anterior
  let qCA = supabase
    .from("compras")
    .select("total, fecha, sucursal")
    .neq("estado", "cancelada")
    .gte("fecha", `${anioAnt}-01-01`)
    .lte("fecha", `${anioAnt}-12-31`);
  if (sp.sucursal) qCA = qCA.eq("sucursal", sp.sucursal) as any;
  const { data: comprasAnt } = await qCA;

  const listaF    = facturas    || [];
  const listaFA   = facturasAnt || [];
  const listaC    = compras     || [];
  const listaCA   = comprasAnt  || [];

  const totalVentasAct = listaF.reduce((s, f) => s + Number(f.total), 0);
  const totalVentasAnt = listaFA.reduce((s, f) => s + Number(f.total), 0);
  const totalCompAct   = listaC.reduce((s, c) => s + Number(c.total || 0), 0);
  const totalCompAnt   = listaCA.reduce((s, c) => s + Number(c.total || 0), 0);
  const utilidadAct    = totalVentasAct - totalCompAct;
  const utilidadAnt    = totalVentasAnt - totalCompAnt;

  const variacionVentas = totalVentasAnt > 0
    ? ((totalVentasAct - totalVentasAnt) / totalVentasAnt) * 100
    : 0;
  const variacionCompras = totalCompAnt > 0
    ? ((totalCompAct - totalCompAnt) / totalCompAnt) * 100
    : 0;
  const variacionUtilidad = utilidadAnt !== 0
    ? ((utilidadAct - utilidadAnt) / Math.abs(utilidadAnt)) * 100
    : 0;

  // Por mes — comparativa
  const porMesDual = MESES.map((mes, i) => {
    const m = i + 1;
    const v1 = listaF.filter((f) => new Date(f.fecha_emision).getMonth() + 1 === m).reduce((s, f) => s + Number(f.total), 0);
    const v2 = listaC.filter((c) => new Date(c.fecha).getMonth() + 1 === m).reduce((s, c) => s + Number(c.total || 0), 0);
    return { label: mes, v1, v2 };
  });

  // Ventas año vs año anterior por mes
  const ventasVsAnt = MESES.map((mes, i) => {
    const m = i + 1;
    const v1 = listaF.filter((f) => new Date(f.fecha_emision).getMonth() + 1 === m).reduce((s, f) => s + Number(f.total), 0);
    const v2 = listaFA.filter((f) => new Date(f.fecha_emision).getMonth() + 1 === m).reduce((s, f) => s + Number(f.total), 0);
    return { label: mes, v1, v2 };
  });

  // Diferencia mes a mes
  const tablaMeses = MESES.map((mes, i) => {
    const m = i + 1;
    const ventas  = listaF.filter((f) => new Date(f.fecha_emision).getMonth() + 1 === m).reduce((s, f) => s + Number(f.total), 0);
    const compras = listaC.filter((c) => new Date(c.fecha).getMonth() + 1 === m).reduce((s, c) => s + Number(c.total || 0), 0);
    const margen  = ventas - compras;
    return { mes, ventas, compras, margen };
  });

  // Saldo acumulado ventas - compras
  const porMesAcum = (() => {
    let acum = 0;
    return tablaMeses.map(({ mes, ventas, compras }) => {
      acum += ventas - compras;
      return { label: mes, value: acum };
    });
  })();

  const pct = (v: number, tot: number) => tot > 0 ? ((v / tot) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboards"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Comparativa</h1>
            <p className="text-sm text-muted-foreground">Ventas vs Compras — {anio} vs {anioAnt}</p>
          </div>
        </div>
        <form className="flex gap-2">
          <select name="anio" defaultValue={String(anio)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select name="sucursal" defaultValue={sp.sucursal ?? ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Ambas</option><option value="quito">Quito</option><option value="guayaquil">Guayaquil</option>
          </select>
          <Button type="submit" size="sm" variant="outline">Aplicar</Button>
        </form>
      </div>

      {/* KPIs comparativos */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            label: "Ventas", act: totalVentasAct, ant: totalVentasAnt,
            var: variacionVentas, color: "text-primary",
          },
          {
            label: "Compras", act: totalCompAct, ant: totalCompAnt,
            var: variacionCompras, color: "text-orange-600 dark:text-orange-400",
          },
          {
            label: "Utilidad Estimada", act: utilidadAct, ant: utilidadAnt,
            var: variacionUtilidad,
            color: utilidadAct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
          },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{formatCurrency(k.act)}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`text-xs ${k.var >= 0 ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-red-500/20 text-red-700 dark:text-red-400"}`}
                >
                  {k.var >= 0 ? "+" : ""}{k.var.toFixed(1)}%
                </Badge>
                <span className="text-xs text-muted-foreground">vs {anioAnt}: {formatCurrency(k.ant)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfica dual ventas vs compras */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Ventas vs Compras por Mes — {anio}</CardTitle></CardHeader>
        <CardContent>
          <DualLineChart data={porMesDual} height={240} label1="Ventas" label2="Compras" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas año vs anterior */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Ventas: {anio} vs {anioAnt}</CardTitle></CardHeader>
          <CardContent>
            <DualLineChart data={ventasVsAnt} height={220} label1={String(anio)} label2={String(anioAnt)} />
          </CardContent>
        </Card>

        {/* Saldo acumulado */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Utilidad Acumulada Mensual — {anio}</CardTitle></CardHeader>
          <CardContent>
            <SimpleBarChart
              data={porMesAcum}
              height={220}
              color="hsl(var(--primary))"
              label="Utilidad Acum."
            />
          </CardContent>
        </Card>
      </div>

      {/* Tabla mes a mes */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Detalle Mensual — {anio}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Compras</TableHead>
                <TableHead className="text-right">Margen</TableHead>
                <TableHead className="text-right">% Margen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tablaMeses.map(({ mes, ventas, compras, margen }) => (
                <TableRow key={mes}>
                  <TableCell className="text-sm font-medium">{mes}</TableCell>
                  <TableCell className="text-right text-sm text-primary font-semibold">
                    {ventas > 0 ? formatCurrency(ventas) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-right text-sm text-orange-600 dark:text-orange-400">
                    {compras > 0 ? formatCurrency(compras) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className={`text-right text-sm font-bold ${margen >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {ventas > 0 || compras > 0 ? formatCurrency(margen) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {ventas > 0 ? `${pct(margen, ventas)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell className="text-sm">Total</TableCell>
                <TableCell className="text-right text-sm font-bold text-primary">{formatCurrency(totalVentasAct)}</TableCell>
                <TableCell className="text-right text-sm font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalCompAct)}</TableCell>
                <TableCell className={`text-right text-sm font-bold ${utilidadAct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrency(utilidadAct)}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {totalVentasAct > 0 ? `${pct(utilidadAct, totalVentasAct)}%` : "—"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

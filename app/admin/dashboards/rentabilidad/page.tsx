import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { SimpleBarChart } from "@/components/admin/charts/SimpleBarChart";

export const metadata: Metadata = { title: "Rentabilidad" };

export default async function DashboardRentabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; sucursal?: string }>;
}) {
  const sp = await searchParams;
  const anio = parseInt(sp.anio ?? String(new Date().getFullYear()));
  const supabase = await createClient();

  // Ítems de facturas con servicio/categoría
  let qItems = supabase
    .from("factura_items")
    .select("descripcion, cantidad, precio_unit, descuento, subtotal, factura_id, servicio_id, servicios(nombre, categoria_id, categorias_servicio(nombre))")
    .gte("created_at", `${anio}-01-01`)
    .lte("created_at", `${anio}-12-31`);

  const { data: itemsRaw } = await qItems;

  // Facturas del año para cruzar sucursal y estado
  let qF = supabase
    .from("facturas")
    .select("id, estado, sucursal, tipo")
    .eq("tipo", "factura")
    .neq("estado", "anulada")
    .gte("fecha_emision", `${anio}-01-01`)
    .lte("fecha_emision", `${anio}-12-31`);
  if (sp.sucursal) qF = qF.eq("sucursal", sp.sucursal) as any;
  const { data: facturas } = await qF;

  const facturasIds = new Set((facturas || []).map((f) => f.id));
  const facturaSucursal: Record<string, string> = {};
  (facturas || []).forEach((f) => { facturaSucursal[f.id] = f.sucursal; });

  // Filtrar ítems solo de facturas válidas (estado + sucursal si aplica)
  const items = (itemsRaw || []).filter((it) => facturasIds.has(it.factura_id));

  // Compras para calcular costo de mercancía (proxy de costo)
  const { data: compras } = await supabase
    .from("compras")
    .select("total, sucursal")
    .neq("estado", "cancelada")
    .gte("fecha", `${anio}-01-01`)
    .lte("fecha", `${anio}-12-31`);

  const totalVentas  = items.reduce((s, it) => s + Number(it.subtotal || 0), 0);
  const totalCompras = (compras || [])
    .filter((c) => !sp.sucursal || c.sucursal === sp.sucursal)
    .reduce((s, c) => s + Number(c.total || 0), 0);
  const margenBruto      = totalVentas - totalCompras;
  const margenBrutoPct   = totalVentas > 0 ? (margenBruto / totalVentas) * 100 : 0;

  // Por servicio
  const porServicio = items.reduce<Record<string, { nombre: string; ventas: number; unidades: number }>>((acc, it) => {
    const svc = (it.servicios as any);
    const nombre = svc?.nombre ?? it.descripcion ?? "Ítem";
    if (!acc[nombre]) acc[nombre] = { nombre, ventas: 0, unidades: 0 };
    acc[nombre].ventas   += Number(it.subtotal || 0);
    acc[nombre].unidades += Number(it.cantidad || 1);
    return acc;
  }, {});
  const topServicios = Object.values(porServicio).sort((a, b) => b.ventas - a.ventas).slice(0, 10);

  // Por categoría
  const porCategoria = items.reduce<Record<string, { nombre: string; ventas: number; items: number }>>((acc, it) => {
    const cat = (it.servicios as any)?.categorias_servicio?.nombre ?? "Sin categoría";
    if (!acc[cat]) acc[cat] = { nombre: cat, ventas: 0, items: 0 };
    acc[cat].ventas += Number(it.subtotal || 0);
    acc[cat].items  += 1;
    return acc;
  }, {});
  const topCategorias = Object.values(porCategoria).sort((a, b) => b.ventas - a.ventas);

  // Por sucursal — de las facturas (no de los items que no tienen sucursal directa)
  const porSucursal = (facturas || []).reduce<Record<string, number>>((acc, f) => {
    acc[f.sucursal] = (acc[f.sucursal] || 0) + 0; // placeholder; usaremos el total de items xref
    return acc;
  }, {});
  const quitoVentas = items
    .filter((it) => facturaSucursal[it.factura_id] === "quito")
    .reduce((s, it) => s + Number(it.subtotal || 0), 0);
  const guayVentas = items
    .filter((it) => facturaSucursal[it.factura_id] === "guayaquil")
    .reduce((s, it) => s + Number(it.subtotal || 0), 0);

  // Gráfica por categoría
  const barCategorias = topCategorias.map((c) => ({ label: c.nombre.substring(0, 12), value: c.ventas }));

  const pct = (v: number) => totalVentas > 0 ? ((v / totalVentas) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboards"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Rentabilidad</h1>
            <p className="text-sm text-muted-foreground">Margen bruto por servicio y categoría — {anio}</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Venta Neta", value: totalVentas, color: "text-primary" },
          { label: "Costo (Compras)", value: totalCompras, color: "text-orange-600 dark:text-orange-400" },
          { label: "Margen Bruto", value: margenBruto, color: margenBruto >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" },
          { label: "% Margen", value: null, pct: margenBrutoPct, color: margenBrutoPct >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>
                {k.pct !== undefined
                  ? `${k.pct.toFixed(1)}%`
                  : formatCurrency(k.value as number)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Venta por categoría (gráfica) */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Ventas por Categoría de Servicio</CardTitle></CardHeader>
          <CardContent>
            {barCategorias.length > 0
              ? <SimpleBarChart data={barCategorias} height={220} color="#10b981" label="Ventas" />
              : <p className="text-center text-muted-foreground text-sm py-12">Sin datos</p>
            }
          </CardContent>
        </Card>

        {/* Por establecimiento */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Rentabilidad por Establecimiento</CardTitle></CardHeader>
          <CardContent className="space-y-6 pt-2">
            {[{ s: "Quito", v: quitoVentas }, { s: "Guayaquil", v: guayVentas }].map(({ s, v }) => (
              <div key={s}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{s}</span>
                  <span className="font-bold">{formatCurrency(v)}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: totalVentas > 0 ? `${(v / totalVentas) * 100}%` : "0%" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {totalVentas > 0 ? ((v / totalVentas) * 100).toFixed(1) : 0}% del total
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top servicios */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Top 10 Servicios por Venta Neta</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Venta Neta</TableHead>
                <TableHead className="text-right">% del Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topServicios.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Sin datos para este período</TableCell></TableRow>
              ) : topServicios.map((s, i) => (
                <TableRow key={s.nombre}>
                  <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                  <TableCell className="text-sm font-medium max-w-[200px] truncate">{s.nombre}</TableCell>
                  <TableCell className="text-right text-sm">{s.unidades}</TableCell>
                  <TableCell className="text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(s.ventas)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct(s.ventas)}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct(s.ventas)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Por categoría detalle */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Rentabilidad por Categoría</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Ítems</TableHead>
                <TableHead className="text-right">Venta Neta</TableHead>
                <TableHead className="text-right">% del Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCategorias.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Sin datos</TableCell></TableRow>
              ) : topCategorias.map((c) => (
                <TableRow key={c.nombre}>
                  <TableCell className="text-sm font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-right text-sm">{c.items}</TableCell>
                  <TableCell className="text-right text-sm font-semibold">{formatCurrency(c.ventas)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="text-xs">{pct(c.ventas)}%</Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell className="text-sm">Total</TableCell>
                <TableCell className="text-right text-sm">{items.length}</TableCell>
                <TableCell className="text-right text-sm font-bold text-primary">{formatCurrency(totalVentas)}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

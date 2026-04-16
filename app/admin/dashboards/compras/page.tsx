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

export const metadata: Metadata = { title: "Dashboard Compras" };
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default async function DashboardComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string; anio?: string }>;
}) {
  const sp = await searchParams;
  const anio = parseInt(sp.anio ?? String(new Date().getFullYear()));
  const supabase = await createClient();

  let q = supabase
    .from("compras")
    .select("id, numero, total, fecha, estado, sucursal, proveedores(nombre)")
    .gte("fecha", `${anio}-01-01`)
    .lte("fecha", `${anio}-12-31`);
  if (sp.sucursal) q = q.eq("sucursal", sp.sucursal) as any;
  const { data: compras } = await q;

  const lista = compras || [];
  const totalCompras  = lista.filter((c) => c.estado !== "cancelada").reduce((s, c) => s + Number(c.total || 0), 0);
  const pendientes    = lista.filter((c) => c.estado === "pendiente").reduce((s, c) => s + Number(c.total || 0), 0);
  const recibidas     = lista.filter((c) => c.estado === "recibida").reduce((s, c) => s + Number(c.total || 0), 0);

  const porMes = MESES.map((mes, i) => {
    const m = i + 1;
    const total = lista.filter((c) => c.estado !== "cancelada" && new Date(c.fecha).getMonth() + 1 === m).reduce((s, c) => s + Number(c.total || 0), 0);
    return { label: mes, value: total };
  });

  const porProveedor = lista
    .filter((c) => c.estado !== "cancelada")
    .reduce<Record<string, { nombre: string; total: number; ordenes: number }>>((acc, c) => {
      const prov = (c.proveedores as any)?.nombre ?? "Sin proveedor";
      const key = prov;
      if (!acc[key]) acc[key] = { nombre: prov, total: 0, ordenes: 0 };
      acc[key].total  += Number(c.total || 0);
      acc[key].ordenes += 1;
      return acc;
    }, {});
  const topProveedores = Object.values(porProveedor).sort((a, b) => b.total - a.total).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboards"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Dashboard Compras</h1>
            <p className="text-sm text-muted-foreground">Año {anio}</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Compras", value: totalCompras },
          { label: "Por Recibir", value: pendientes, yellow: true },
          { label: "Recibidas", value: recibidas, green: true },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-2xl font-bold ${(k as any).green ? "text-green-600 dark:text-green-400" : (k as any).yellow ? "text-yellow-600 dark:text-yellow-400" : ""}`}>
                {formatCurrency(k.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Compras por Mes — {anio}</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={porMes} height={220} color="#f97316" /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top Proveedores</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Órdenes</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProveedores.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">Sin datos</TableCell></TableRow>
                ) : topProveedores.map((p, i) => (
                  <TableRow key={p.nombre}>
                    <TableCell className="text-muted-foreground text-sm">{i+1}</TableCell>
                    <TableCell className="text-sm font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-right text-sm">{p.ordenes}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{formatCurrency(p.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

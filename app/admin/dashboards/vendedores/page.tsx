import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard Vendedores" };

export default async function DashboardVendedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>;
}) {
  const sp = await searchParams;
  const anio = parseInt(sp.anio ?? String(new Date().getFullYear()));
  const supabase = await createClient();

  // Facturas con el usuario que las creó — usamos created_at como proxy
  // (no hay campo vendedor_id en facturas, usamos pagos para cobrador)
  const { data: facturas } = await supabase
    .from("facturas")
    .select("id, numero, total, estado, tipo, fecha_emision, sucursal")
    .gte("fecha_emision", `${anio}-01-01`)
    .lte("fecha_emision", `${anio}-12-31`)
    .eq("tipo", "factura")
    .neq("estado", "anulada");

  const { data: ncs } = await supabase
    .from("facturas")
    .select("total, fecha_emision")
    .eq("tipo", "nota_credito")
    .gte("fecha_emision", `${anio}-01-01`)
    .lte("fecha_emision", `${anio}-12-31`);

  const { data: pagos } = await supabase
    .from("pagos")
    .select("monto, metodo, factura_id, perfiles(id, nombre, apellido, rol)")
    .gte("fecha", `${anio}-01-01`)
    .lte("fecha", `${anio}-12-31`);

  // Agrupar cobros por usuario (cobrador)
  const porCobrador = (pagos || []).reduce<Record<string, { nombre: string; rol: string; cobros: number; monto: number }>>((acc, p) => {
    const u = (p.perfiles as any);
    if (!u) return acc;
    if (!acc[u.id]) acc[u.id] = { nombre: `${u.nombre} ${u.apellido || ""}`.trim(), rol: u.rol, cobros: 0, monto: 0 };
    acc[u.id].cobros += 1;
    acc[u.id].monto  += Number(p.monto);
    return acc;
  }, {});
  const rankingCobradores = Object.values(porCobrador).sort((a, b) => b.monto - a.monto);

  const lista = facturas || [];
  const totalVentas = lista.reduce((s, f) => s + Number(f.total), 0);
  const totalNcs    = (ncs || []).reduce((s, f) => s + Number(f.total), 0);
  const totalCobrado = (pagos || []).reduce((s, p) => s + Number(p.monto), 0);

  // Por sucursal
  const quitoV = lista.filter((f) => f.sucursal === "quito").reduce((s, f) => s + Number(f.total), 0);
  const guayV  = lista.filter((f) => f.sucursal === "guayaquil").reduce((s, f) => s + Number(f.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboards"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Vendedores / Cobradores</h1>
            <p className="text-sm text-muted-foreground">Año {anio}</p>
          </div>
        </div>
        <form className="flex gap-2">
          <select name="anio" defaultValue={String(anio)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button type="submit" size="sm" variant="outline">Aplicar</Button>
        </form>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Facturas Emitidas", value: lista.length, isCnt: true },
          { label: "Total Facturado", value: totalVentas },
          { label: "Total Cobrado", value: totalCobrado, green: true },
          { label: "Notas de Crédito", value: totalNcs, red: true },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-2xl font-bold ${(k as any).green ? "text-green-600 dark:text-green-400" : (k as any).red ? "text-red-600 dark:text-red-400" : ""}`}>
                {k.isCnt ? k.value : formatCurrency(Number(k.value))}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking cobradores */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Ranking por Cobros Registrados</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Cobros</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankingCobradores.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">Sin datos</TableCell></TableRow>
                ) : rankingCobradores.map((c, i) => (
                  <TableRow key={c.nombre}>
                    <TableCell className="text-muted-foreground">{i+1}</TableCell>
                    <TableCell className="text-sm font-medium">{c.nombre}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{c.rol}</Badge></TableCell>
                    <TableCell className="text-right text-sm">{c.cobros}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(c.monto)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Por sucursal */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Facturación por Establecimiento</CardTitle></CardHeader>
          <CardContent className="space-y-6 pt-2">
            {[{ s: "Quito", v: quitoV }, { s: "Guayaquil", v: guayV }].map(({ s, v }) => (
              <div key={s}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{s}</span>
                  <span className="font-bold">{formatCurrency(v)}</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: totalVentas > 0 ? `${(v / totalVentas) * 100}%` : "0%" }} />
                </div>
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {lista.filter((f) => f.sucursal === s.toLowerCase()).length} facturas ·{" "}
                  {totalVentas > 0 ? ((v / totalVentas) * 100).toFixed(1) : 0}%
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

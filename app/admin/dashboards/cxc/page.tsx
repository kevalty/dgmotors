import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Cuentas por Cobrar" };

export default async function DashboardCXCPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string }>;
}) {
  const sp = await searchParams;
  const hoy = new Date().toISOString().split("T")[0];
  const supabase = await createClient();

  let q = supabase
    .from("facturas")
    .select("id, numero, total, fecha_emision, fecha_vence, estado, sucursal, tipo, cliente_id, perfiles!facturas_cliente_id_fkey(nombre, apellido)")
    .in("estado", ["pendiente", "parcial", "vencida"])
    .eq("tipo", "factura");
  if (sp.sucursal) q = q.eq("sucursal", sp.sucursal) as any;
  const { data: cxc } = await q;

  const { data: anticipos } = await supabase
    .from("anticipos_cliente")
    .select("monto, saldo, perfiles(nombre, apellido)")
    .eq("aplicado", false);

  const lista    = cxc || [];
  const totalCXC = lista.reduce((s, f) => s + Number(f.total), 0);
  const vencidas  = lista.filter((f) => f.fecha_vence && f.fecha_vence < hoy);
  const totalVenc = vencidas.reduce((s, f) => s + Number(f.total), 0);
  const totalAntic = (anticipos || []).reduce((s, a) => s + Number(a.saldo), 0);

  // Top deudores
  const porCliente = lista.reduce<Record<string, { nombre: string; total: number; facturas: number; vencida: boolean }>>((acc, f) => {
    const p = f.perfiles as any;
    const nombre = p ? `${p.nombre} ${p.apellido}` : "Sin nombre";
    if (!acc[f.cliente_id]) acc[f.cliente_id] = { nombre, total: 0, facturas: 0, vencida: false };
    acc[f.cliente_id].total    += Number(f.total);
    acc[f.cliente_id].facturas += 1;
    if (f.fecha_vence && f.fecha_vence < hoy) acc[f.cliente_id].vencida = true;
    return acc;
  }, {});
  const topDeudores = Object.values(porCliente).sort((a, b) => b.total - a.total).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboards"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Cuentas por Cobrar</h1>
            <p className="text-sm text-muted-foreground">Facturas pendientes y vencidas</p>
          </div>
        </div>
        <form className="flex gap-2">
          <select name="sucursal" defaultValue={sp.sucursal ?? ""} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Ambas</option><option value="quito">Quito</option><option value="guayaquil">Guayaquil</option>
          </select>
          <Button type="submit" size="sm" variant="outline">Aplicar</Button>
        </form>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total CxC", value: totalCXC, f: lista.length },
          { label: "Vencidas", value: totalVenc, f: vencidas.length, red: true },
          { label: "Anticipos Disponibles", value: totalAntic, green: true },
          { label: "Clientes con Deuda", value: Object.keys(porCliente).length, isCnt: true },
        ].map((k) => (
          <Card key={k.label} className={k.red ? "border-red-500/30" : ""}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-2xl font-bold ${k.red ? "text-red-600 dark:text-red-400" : k.green ? "text-green-600 dark:text-green-400" : ""}`}>
                {k.isCnt ? k.value : formatCurrency(Number(k.value))}
              </p>
              {k.f !== undefined && <p className="text-xs text-muted-foreground">{k.f} facturas</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {totalVenc > 0 && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-md px-4 py-2 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {vencidas.length} facturas vencidas por un total de {formatCurrency(totalVenc)}. Gestionar cobro inmediato.
        </div>
      )}

      {/* Top deudores */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Top 10 Deudores</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Facturas</TableHead>
                <TableHead className="text-right">Deuda Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDeudores.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay deudas pendientes</TableCell></TableRow>
              ) : topDeudores.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground text-sm">{i+1}</TableCell>
                  <TableCell className="text-sm font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-right text-sm">{c.facturas}</TableCell>
                  <TableCell className="text-right text-sm font-bold">{formatCurrency(c.total)}</TableCell>
                  <TableCell>
                    {c.vencida && <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-700 dark:text-red-400">Vencida</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detalle facturas pendientes */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Facturas Pendientes ({lista.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.slice(0, 50).map((f) => {
                const p = f.perfiles as any;
                const esVencida = f.fecha_vence && f.fecha_vence < hoy;
                return (
                  <TableRow key={f.id} className={esVencida ? "bg-red-500/5" : ""}>
                    <TableCell>
                      <Link href={`/admin/facturacion/${f.id}`} className="text-sm font-mono text-primary hover:underline">{f.numero}</Link>
                    </TableCell>
                    <TableCell className="text-sm">{p ? `${p.nombre} ${p.apellido}` : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(f.fecha_emision)}</TableCell>
                    <TableCell className={`text-sm ${esVencida ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
                      {f.fecha_vence ? formatDate(f.fecha_vence) : "—"}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{f.sucursal}</Badge></TableCell>
                    <TableCell className="text-right text-sm font-bold">{formatCurrency(Number(f.total))}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${esVencida ? "bg-red-500/20 text-red-700 dark:text-red-400" : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"}`}>
                        {esVencida ? "Vencida" : f.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

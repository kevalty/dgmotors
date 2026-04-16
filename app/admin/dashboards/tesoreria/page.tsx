import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Tesorería" };

const TIPOS_INGRESO = ["deposito","transferencia_entrada","nota_credito"];

export default async function DashboardTesoreriaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const sp = await searchParams;
  const anio = parseInt(sp.anio ?? String(new Date().getFullYear()));
  const mes  = parseInt(sp.mes  ?? String(new Date().getMonth() + 1));
  const mesStr = String(mes).padStart(2,"0");
  const supabase = await createClient();

  // Bancos con saldos
  const { data: bancos } = await supabase.from("bancos").select("id, nombre, numero_cta, saldo_inicial, activo").eq("activo", true);
  const { data: movsBanco } = await supabase.from("movimientos_banco").select("banco_id, tipo, monto");

  // Calcular saldos
  const bancosConSaldo = (bancos || []).map((b) => {
    const movs = (movsBanco || []).filter((m) => m.banco_id === b.id);
    const ingresos = movs.filter((m) => TIPOS_INGRESO.includes(m.tipo)).reduce((s, m) => s + Number(m.monto), 0);
    const egresos  = movs.filter((m) => !TIPOS_INGRESO.includes(m.tipo)).reduce((s, m) => s + Number(m.monto), 0);
    return { ...b, saldo: (Number(b.saldo_inicial) || 0) + ingresos - egresos };
  });
  const totalBancos = bancosConSaldo.reduce((s, b) => s + b.saldo, 0);

  // Cobros del mes
  const { data: pagos } = await supabase
    .from("pagos")
    .select("monto, metodo, fecha")
    .gte("fecha", `${anio}-${mesStr}-01`)
    .lte("fecha", `${anio}-${mesStr}-31`);
  const totalCobros = (pagos || []).reduce((s, p) => s + Number(p.monto), 0);

  // Pagos a proveedores del mes (compras recibidas)
  const { data: compras } = await supabase
    .from("compras")
    .select("total, fecha, estado")
    .gte("fecha", `${anio}-${mesStr}-01`)
    .lte("fecha", `${anio}-${mesStr}-31`)
    .eq("estado", "recibida");
  const totalPagoProv = (compras || []).reduce((s, c) => s + Number(c.total || 0), 0);

  // Anticipos disponibles
  const { data: anticipos } = await supabase.from("anticipos_cliente").select("saldo").eq("aplicado", false);
  const totalAntic = (anticipos || []).reduce((s, a) => s + Number(a.saldo), 0);

  // Movimientos del mes
  const { data: movsDelMes } = await supabase
    .from("movimientos_banco")
    .select("*, bancos(nombre)")
    .gte("fecha", `${anio}-${mesStr}-01`)
    .lte("fecha", `${anio}-${mesStr}-31`)
    .order("fecha", { ascending: false })
    .limit(30);

  const MESES_L = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboards"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Tesorería</h1>
            <p className="text-sm text-muted-foreground">{MESES_L[mes]} {anio}</p>
          </div>
        </div>
        <form className="flex gap-2">
          <select name="mes" defaultValue={String(mes)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {MESES_L.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select name="anio" defaultValue={String(anio)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {[2024,2025,2026,2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button type="submit" size="sm" variant="outline">Aplicar</Button>
        </form>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Saldo Total Bancos", value: totalBancos, primary: true },
          { label: `Cobros ${MESES_L[mes]}`, value: totalCobros, green: true },
          { label: `Pagos a Prov. ${MESES_L[mes]}`, value: totalPagoProv, red: true },
          { label: "Anticipos Disponibles", value: totalAntic },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-2xl font-bold ${k.primary ? "text-primary" : k.green ? "text-green-600 dark:text-green-400" : k.red ? "text-red-600 dark:text-red-400" : ""}`}>
                {formatCurrency(k.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Saldos por banco */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Saldos por Cuenta Bancaria</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancosConSaldo.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">Sin cuentas bancarias</TableCell></TableRow>
              ) : bancosConSaldo.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-sm font-medium">{b.nombre}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{b.numero_cta}</TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-bold ${b.saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatCurrency(b.saldo)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/bancos/${b.id}`}>
                      <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">Ver movimientos</Badge>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold bg-muted/50">
                <TableCell colSpan={2} className="text-sm">Total</TableCell>
                <TableCell className="text-right text-sm font-bold text-primary">{formatCurrency(totalBancos)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Movimientos recientes del mes */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Movimientos Bancarios — {MESES_L[mes]} {anio}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(movsDelMes || []).length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">Sin movimientos en este período</TableCell></TableRow>
              ) : (movsDelMes || []).map((m) => {
                const esIng = TIPOS_INGRESO.includes(m.tipo);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(m.fecha)}</TableCell>
                    <TableCell className="text-sm">{(m.bancos as any)?.nombre || "—"}</TableCell>
                    <TableCell className="text-sm">{m.concepto}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-semibold ${esIng ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {esIng ? "+" : "-"}{formatCurrency(Number(m.monto))}
                      </span>
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

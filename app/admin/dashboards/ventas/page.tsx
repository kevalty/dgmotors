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

export const metadata: Metadata = { title: "Dashboard Ventas" };

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const METODO_LABELS: Record<string, string> = {
  efectivo:"Efectivo", tarjeta:"Tarjeta", transferencia:"Transferencia",
  cheque:"Cheque", credito:"Crédito",
};

export default async function DashboardVentasPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string; anio?: string }>;
}) {
  const sp = await searchParams;
  const anio = parseInt(sp.anio ?? String(new Date().getFullYear()));
  const supabase = await createClient();

  let qF = supabase
    .from("facturas")
    .select("id, total, subtotal, iva_valor, descuento, fecha_emision, estado, sucursal, tipo")
    .gte("fecha_emision", `${anio}-01-01`)
    .lte("fecha_emision", `${anio}-12-31`)
    .eq("tipo", "factura")
    .neq("estado", "anulada");
  if (sp.sucursal) qF = qF.eq("sucursal", sp.sucursal) as any;
  const { data: facturas } = await qF;

  const { data: pagos } = await supabase
    .from("pagos")
    .select("monto, metodo, fecha, factura_id")
    .gte("fecha", `${anio}-01-01`)
    .lte("fecha", `${anio}-12-31`);

  const { data: ncs } = await supabase
    .from("facturas")
    .select("total, fecha_emision, sucursal")
    .eq("tipo", "nota_credito")
    .gte("fecha_emision", `${anio}-01-01`)
    .lte("fecha_emision", `${anio}-12-31`);

  const lista = facturas || [];
  const pagosList = pagos || [];

  const totalBruto  = lista.reduce((s, f) => s + Number(f.total), 0);
  const totalNcs    = (ncs || []).reduce((s, f) => s + Number(f.total), 0);
  const totalNeto   = totalBruto - totalNcs;
  const totalIva    = lista.reduce((s, f) => s + Number(f.iva_valor || 0), 0);
  const totalDesc   = lista.reduce((s, f) => s + Number(f.descuento || 0), 0);

  // Por mes
  const porMes = MESES.map((mes, i) => {
    const m = i + 1;
    const total = lista.filter((f) => new Date(f.fecha_emision).getMonth() + 1 === m).reduce((s, f) => s + Number(f.total), 0);
    return { label: mes, value: total };
  });

  // Por método de pago
  const porMetodo = pagosList.reduce<Record<string, number>>((acc, p) => {
    const m = p.metodo || "otro";
    acc[m] = (acc[m] || 0) + Number(p.monto);
    return acc;
  }, {});

  // Por sucursal
  const porSucursal = ["quito", "guayaquil"].map((s) => ({
    s, total: lista.filter((f) => f.sucursal === s).reduce((acc, f) => acc + Number(f.total), 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboards"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Dashboard Ventas</h1>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ventas Brutas", value: totalBruto },
          { label: "Notas de Crédito", value: totalNcs, red: true },
          { label: "Ventas Netas", value: totalNeto, primary: true },
          { label: "IVA Generado", value: totalIva },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-2xl font-bold ${k.primary ? "text-primary" : k.red ? "text-red-600 dark:text-red-400" : ""}`}>
                {k.red ? "-" : ""}{formatCurrency(k.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Ventas Netas Mensuales — {anio}</CardTitle></CardHeader>
          <CardContent><SimpleBarChart data={porMes} height={220} /></CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Por Método de Pago</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(porMetodo).sort((a,b) => b[1]-a[1]).map(([m, v]) => (
                <div key={m} className="flex justify-between items-center text-sm">
                  <Badge variant="outline" className="text-xs">{METODO_LABELS[m] ?? m}</Badge>
                  <span className="font-semibold">{formatCurrency(v)}</span>
                </div>
              ))}
              {Object.keys(porMetodo).length === 0 && <p className="text-xs text-muted-foreground">Sin cobros registrados</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Por Establecimiento</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {porSucursal.map(({ s, total }) => (
                <div key={s} className="flex justify-between items-center text-sm">
                  <Badge variant="secondary" className="capitalize text-xs">{s}</Badge>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Descuentos */}
      {totalDesc > 0 && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total descuentos aplicados en el período</p>
            <p className="text-sm font-bold text-orange-600">-{formatCurrency(totalDesc)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

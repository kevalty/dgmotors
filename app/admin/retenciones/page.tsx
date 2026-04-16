import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Retenciones" };

const TIPO_COLORS: Record<string, string> = {
  renta: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  iva:   "bg-purple-500/20 text-purple-700 dark:text-purple-400",
};

export default async function RetencionesPage() {
  const supabase = await createClient();

  const { data: retenciones } = await supabase
    .from("retenciones_venta")
    .select(`
      *,
      facturas(numero, perfiles!facturas_cliente_id_fkey(nombre, apellido))
    `)
    .order("fecha", { ascending: false });

  const lista = retenciones || [];
  const totalRenta = lista.filter((r) => r.tipo === "renta").reduce((s, r) => s + Number(r.valor), 0);
  const totalIva   = lista.filter((r) => r.tipo === "iva").reduce((s, r) => s + Number(r.valor), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Retenciones en Ventas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lista.length} comprobantes · Renta: {formatCurrency(totalRenta)} · IVA: {formatCurrency(totalIva)}
          </p>
        </div>
        <Link href="/admin/retenciones/nueva">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva retención
          </Button>
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="border-blue-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Retención en Renta</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalRenta)}</p>
            <p className="text-xs text-muted-foreground">
              {lista.filter((r) => r.tipo === "renta").length} comprobantes
            </p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Retención en IVA</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{formatCurrency(totalIva)}</p>
            <p className="text-xs text-muted-foreground">
              {lista.filter((r) => r.tipo === "iva").length} comprobantes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Retención</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Valor Retenido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No hay retenciones registradas</p>
                    <Link href="/admin/retenciones/nueva">
                      <Button variant="outline" size="sm" className="mt-3 gap-2">
                        <Plus className="w-4 h-4" />
                        Registrar primera retención
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                lista.map((r) => {
                  const factura = r.facturas as any;
                  const cliente = factura?.perfiles;
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm font-mono font-semibold">
                        {r.numero_ret || "—"}
                      </TableCell>
                      <TableCell>
                        {factura ? (
                          <Link
                            href={`/admin/facturacion/${r.factura_id}`}
                            className="text-sm text-primary hover:underline font-mono"
                          >
                            {factura.numero}
                          </Link>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {cliente ? `${cliente.nombre} ${cliente.apellido}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(r.fecha)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${TIPO_COLORS[r.tipo]}`}>
                          {r.tipo === "renta" ? "Renta" : "IVA"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {r.codigo_ret || "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {Number(r.porcentaje).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatCurrency(Number(r.base_imponible))}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold text-blue-700 dark:text-blue-400">
                        {formatCurrency(Number(r.valor))}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

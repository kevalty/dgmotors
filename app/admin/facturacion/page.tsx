import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import {
  formatDate, formatCurrency,
  ESTADO_FACTURA_LABELS, ESTADO_FACTURA_COLORS,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Facturación" };

export default async function FacturacionPage() {
  const supabase = await createClient();

  const { data: facturas } = await supabase
    .from("facturas")
    .select(`
      id, numero, tipo, fecha_emision, subtotal, total, estado, sucursal,
      perfiles!facturas_cliente_id_fkey(nombre, apellido),
      ordenes_trabajo(numero)
    `)
    .order("created_at", { ascending: false });

  const todas = facturas || [];
  const pendientes = todas.filter((f) => f.estado === "pendiente");
  const totalFacturado = todas
    .filter((f) => f.estado === "pagada")
    .reduce((acc, f) => acc + (f.total || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Facturación
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {todas.length} facturas · Cobrado: {formatCurrency(totalFacturado)}
          </p>
        </div>
        <Link href="/admin/facturacion/nueva">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva factura
          </Button>
        </Link>
      </div>

      {pendientes.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-yellow-500/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Por cobrar</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(
                  pendientes.reduce((acc, f) => acc + (f.total || 0), 0)
                )}
              </p>
              <p className="text-xs text-muted-foreground">{pendientes.length} facturas pendientes</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>OT</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {todas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Sin facturas registradas
                  </TableCell>
                </TableRow>
              ) : (
                todas.map((f) => (
                  <TableRow key={f.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/admin/facturacion/${f.id}`}>
                        <p className="text-sm font-mono font-semibold">{f.numero}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {(f.perfiles as any)?.nombre} {(f.perfiles as any)?.apellido}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {(f.ordenes_trabajo as any)?.numero
                        ? `OT-${String((f.ordenes_trabajo as any).numero).padStart(4, "0")}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(f.fecha_emision)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{f.sucursal}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {formatCurrency(f.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${ESTADO_FACTURA_COLORS[f.estado]}`}
                      >
                        {ESTADO_FACTURA_LABELS[f.estado]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/facturacion/${f.id}`}>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

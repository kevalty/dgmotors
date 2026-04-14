import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Compras" };

const ESTADO_COMPRA_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  recibida: "bg-green-500/20 text-green-600 dark:text-green-400",
  parcial: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  cancelada: "bg-red-500/20 text-red-600 dark:text-red-400",
};

export default async function ComprasPage() {
  const supabase = await createClient();

  const { data: compras } = await supabase
    .from("compras")
    .select("*, proveedores(nombre)")
    .order("created_at", { ascending: false });

  const todas = compras || [];
  const pendientes = todas.filter((c) => c.estado === "pendiente").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Compras
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {todas.length} órdenes · {pendientes} pendientes de recibir
          </p>
        </div>
        <Link href="/admin/compras/nueva">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva compra
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Esperado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {todas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Sin órdenes de compra
                  </TableCell>
                </TableRow>
              ) : (
                todas.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/admin/compras/${c.id}`}>
                        <p className="text-sm font-mono font-semibold">{c.numero}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {(c.proveedores as any)?.nombre || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{c.sucursal}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.fecha)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.fecha_esperada ? formatDate(c.fecha_esperada) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {c.total ? formatCurrency(c.total) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${ESTADO_COMPRA_COLORS[c.estado]}`}
                      >
                        {c.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/compras/${c.id}`}>
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

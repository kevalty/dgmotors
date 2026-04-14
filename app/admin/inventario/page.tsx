import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Plus, AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, UNIDAD_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventario" };

export default async function InventarioPage() {
  const supabase = await createClient();

  const { data: repuestos } = await supabase
    .from("repuestos")
    .select("*, categorias_repuesto(nombre)")
    .eq("activo", true)
    .order("nombre");

  const todos = repuestos || [];
  const bajoMinimo = todos.filter((r) => r.stock_actual <= r.stock_minimo);
  const totalValor = todos.reduce(
    (acc, r) => acc + (r.stock_actual || 0) * (r.precio_costo || 0),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Inventario
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {todos.length} repuestos · Valor total: {formatCurrency(totalValor)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventario/ajuste">
            <Button variant="outline" size="sm">Ajuste de stock</Button>
          </Link>
          <Link href="/admin/inventario/nuevo">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo repuesto
            </Button>
          </Link>
        </div>
      </div>

      {bajoMinimo.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              {bajoMinimo.length} repuesto(s) con stock bajo mínimo
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
              {bajoMinimo.map((r) => r.nombre).join(", ")}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repuesto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">P. Costo</TableHead>
                <TableHead className="text-right">P. Venta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {todos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Sin repuestos registrados
                  </TableCell>
                </TableRow>
              ) : (
                todos.map((r) => {
                  const bajominimo = r.stock_actual <= r.stock_minimo;
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/admin/inventario/${r.id}`}>
                          <p className="text-sm font-medium">{r.nombre}</p>
                          {r.descripcion && (
                            <p className="text-xs text-muted-foreground truncate max-w-48">
                              {r.descripcion}
                            </p>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(r.categorias_repuesto as any)?.nombre || "—"}
                      </TableCell>
                      <TableCell>
                        {r.codigo ? (
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                            {r.codigo}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-semibold ${bajominimo ? "text-destructive" : ""}`}>
                          {r.stock_actual} {UNIDAD_LABELS[r.unidad] || r.unidad}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {r.stock_minimo}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.precio_costo ? formatCurrency(r.precio_costo) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {r.precio_venta ? formatCurrency(r.precio_venta) : "—"}
                      </TableCell>
                      <TableCell>
                        {bajominimo ? (
                          <Badge variant="destructive" className="text-xs">Stock bajo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">
                            OK
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/inventario/${r.id}`}>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
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

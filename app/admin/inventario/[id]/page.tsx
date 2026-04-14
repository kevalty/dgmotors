import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, UNIDAD_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalle Repuesto" };

export default async function RepuestoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [repRes, movRes] = await Promise.all([
    supabase
      .from("repuestos")
      .select("*, categorias_repuesto(nombre)")
      .eq("id", id)
      .single(),
    supabase
      .from("inventario_movimientos")
      .select("*, perfiles(nombre, apellido)")
      .eq("repuesto_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!repRes.data) notFound();
  const r = repRes.data;
  const movimientos = movRes.data || [];
  const bajominimo = r.stock_actual <= r.stock_minimo;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/inventario">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {r.nombre}
            </h1>
            {r.codigo && (
              <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{r.codigo}</span>
            )}
            {bajominimo ? (
              <Badge variant="destructive" className="text-xs">Stock bajo</Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">Stock OK</Badge>
            )}
          </div>
          {r.descripcion && (
            <p className="text-muted-foreground text-sm mt-1">{r.descripcion}</p>
          )}
        </div>
        <Link href="/admin/inventario/ajuste">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Ajustar stock
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className={`text-3xl font-bold ${bajominimo ? "text-destructive" : "text-primary"}`}>
              {r.stock_actual}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Stock actual ({UNIDAD_LABELS[r.unidad] || r.unidad})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{r.stock_minimo}</p>
            <p className="text-xs text-muted-foreground mt-1">Stock mínimo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{r.precio_costo ? formatCurrency(r.precio_costo) : "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Precio costo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {r.precio_venta ? formatCurrency(r.precio_venta) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Precio venta</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Stock ant.</TableHead>
                <TableHead className="text-right">Stock new.</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead>Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimientos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Sin movimientos registrados
                  </TableCell>
                </TableRow>
              ) : (
                movimientos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(m.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {m.tipo === "entrada" && <ArrowUp className="w-3 h-3 text-green-500" />}
                        {m.tipo === "salida" && <ArrowDown className="w-3 h-3 text-red-500" />}
                        {m.tipo === "ajuste" && <RefreshCw className="w-3 h-3 text-blue-500" />}
                        <span className="text-sm capitalize">{m.tipo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {m.tipo === "salida" ? "-" : "+"}{m.cantidad}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{m.stock_ant}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{m.stock_new}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.referencia || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(m.perfiles as any)?.nombre || "—"}
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

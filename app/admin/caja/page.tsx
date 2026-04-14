import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, Plus, Lock, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime, METODO_PAGO_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Caja" };

export default async function CajaPage() {
  const supabase = await createClient();

  const [cajasRes, sesionActivaRes] = await Promise.all([
    supabase.from("cajas").select("*").order("nombre"),
    supabase
      .from("caja_sesiones")
      .select(`
        *,
        cajas(nombre, sucursal),
        perfiles!caja_sesiones_usuario_id_fkey(nombre, apellido)
      `)
      .eq("estado", "abierta")
      .maybeSingle(),
  ]);

  const cajas = cajasRes.data || [];
  const sesionActiva = sesionActivaRes.data;

  // Si hay sesión activa, traer movimientos
  let movimientos: any[] = [];
  if (sesionActiva) {
    const { data } = await supabase
      .from("caja_movimientos")
      .select("*, perfiles(nombre)")
      .eq("sesion_id", sesionActiva.id)
      .order("created_at", { ascending: false })
      .limit(20);
    movimientos = data || [];
  }

  // Historial de sesiones cerradas (últimas 10)
  const { data: historialSesiones } = await supabase
    .from("caja_sesiones")
    .select("*, cajas(nombre, sucursal), perfiles!caja_sesiones_usuario_id_fkey(nombre)")
    .eq("estado", "cerrada")
    .order("fecha_cierre", { ascending: false })
    .limit(10);

  const totalIngresos = movimientos
    .filter((m) => m.tipo === "ingreso")
    .reduce((acc, m) => acc + (m.monto || 0), 0);

  const totalEgresos = movimientos
    .filter((m) => m.tipo === "egreso")
    .reduce((acc, m) => acc + (m.monto || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Caja
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sesionActiva
              ? `Sesión abierta en ${(sesionActiva.cajas as any)?.nombre}`
              : "No hay sesión activa"}
          </p>
        </div>
        {sesionActiva ? (
          <Link href="/admin/caja/cerrar">
            <Button variant="outline" size="sm" className="gap-2">
              <Lock className="w-4 h-4" />
              Cerrar caja
            </Button>
          </Link>
        ) : (
          <Link href="/admin/caja/abrir">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Abrir caja
            </Button>
          </Link>
        )}
      </div>

      {sesionActiva ? (
        <div className="space-y-6">
          {/* Stats de sesión activa */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Apertura</p>
                <p className="text-xl font-bold">{formatCurrency(sesionActiva.monto_apertura)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(sesionActiva.fecha_apertura)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Ingresos</p>
                </div>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalIngresos)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Egresos</p>
                </div>
                <p className="text-xl font-bold text-destructive">
                  {formatCurrency(totalEgresos)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Neto del día</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(totalIngresos - totalEgresos)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Movimientos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Movimientos de la sesión</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Sin movimientos en esta sesión
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientos.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">{m.concepto}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              m.tipo === "ingreso"
                                ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                : "bg-red-500/20 text-red-700 dark:text-red-400"
                            }`}
                          >
                            {m.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right text-sm font-semibold ${
                          m.tipo === "ingreso" ? "text-green-600 dark:text-green-400" : "text-destructive"
                        }`}>
                          {m.tipo === "ingreso" ? "+" : "-"}{formatCurrency(m.monto)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(m.created_at)}
                        </TableCell>
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
      ) : (
        <div className="space-y-6">
          {/* Cajas disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cajas.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{c.nombre}</p>
                    <Badge variant="outline" className="text-xs capitalize mt-1">{c.sucursal}</Badge>
                  </div>
                  <Link href={`/admin/caja/abrir?caja=${c.id}`}>
                    <Button size="sm" variant="outline">Abrir</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
            {cajas.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No hay cajas configuradas. Contacta al administrador del sistema.
              </p>
            )}
          </div>

          {/* Historial */}
          {(historialSesiones || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Últimas sesiones</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Caja</TableHead>
                      <TableHead>Apertura</TableHead>
                      <TableHead>Cierre</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(historialSesiones || []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">
                          {(s.cajas as any)?.nombre}
                          <span className="text-xs text-muted-foreground ml-1 capitalize">
                            {(s.cajas as any)?.sucursal}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(s.fecha_apertura)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.fecha_cierre ? formatDateTime(s.fecha_cierre) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          {formatCurrency(s.total_ventas || 0)}
                        </TableCell>
                        <TableCell className={`text-right text-sm font-semibold ${
                          (s.diferencia || 0) < 0 ? "text-destructive" : "text-green-600"
                        }`}>
                          {formatCurrency(s.diferencia || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

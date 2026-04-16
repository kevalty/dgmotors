import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { NuevoMovimientoDialog } from "@/components/admin/bancos/NuevoMovimientoDialog";
import { ConciliarButton } from "@/components/admin/bancos/ConciliarButton";

export const metadata: Metadata = { title: "Movimientos Bancarios" };

const TIPOS_INGRESO = ["deposito", "transferencia_entrada", "nota_credito"];

const TIPO_LABELS: Record<string, string> = {
  deposito: "Depósito",
  retiro: "Retiro",
  transferencia_entrada: "Transferencia Entrada",
  transferencia_salida: "Transferencia Salida",
  nota_debito: "Nota de Débito",
  nota_credito: "Nota de Crédito",
};

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ banco?: string; conciliado?: string; tipo?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: bancos } = await supabase
    .from("bancos")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre");

  let query = supabase
    .from("movimientos_banco")
    .select("*, bancos(nombre), perfiles(nombre)")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (sp.banco) query = query.eq("banco_id", sp.banco);
  if (sp.conciliado === "true")  query = query.eq("conciliado", true);
  if (sp.conciliado === "false") query = query.eq("conciliado", false);
  if (sp.tipo) query = query.eq("tipo", sp.tipo);

  const { data: movimientos } = await query.limit(200);
  const movs = movimientos || [];

  const totalIngresos = movs
    .filter((m) => TIPOS_INGRESO.includes(m.tipo))
    .reduce((s, m) => s + Number(m.monto), 0);
  const totalEgresos = movs
    .filter((m) => !TIPOS_INGRESO.includes(m.tipo))
    .reduce((s, m) => s + Number(m.monto), 0);
  const pendientes = movs.filter((m) => !m.conciliado).length;

  // Banco seleccionado (para el dialog)
  const bancoSeleccionado = bancos?.find((b) => b.id === sp.banco);
  const primerBanco = bancos?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/bancos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Movimientos Bancarios
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {movs.length} movimientos · {pendientes} sin conciliar
            </p>
          </div>
        </div>
        {(bancoSeleccionado ?? primerBanco) && (
          <NuevoMovimientoDialog
            bancoId={(bancoSeleccionado ?? primerBanco)!.id}
            bancoNombre={(bancoSeleccionado ?? primerBanco)!.nombre}
          />
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <form className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Banco</p>
              <Select name="banco" defaultValue={sp.banco ?? ""}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Todos los bancos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los bancos</SelectItem>
                  {(bancos ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Tipo</p>
              <Select name="tipo" defaultValue={sp.tipo ?? ""}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tipos</SelectItem>
                  {Object.entries(TIPO_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Conciliación</p>
              <Select name="conciliado" defaultValue={sp.conciliado ?? ""}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="true">Conciliados</SelectItem>
                  <SelectItem value="false">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" variant="outline" size="sm">Filtrar</Button>
            <Link href="/admin/bancos/movimientos">
              <Button type="button" variant="ghost" size="sm">Limpiar</Button>
            </Link>
          </form>
        </CardContent>
      </Card>

      {/* Resumen del filtro */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" /> Ingresos filtrados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              +{formatCurrency(totalIngresos)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-500" /> Egresos filtrados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              -{formatCurrency(totalEgresos)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground">Neto</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={`text-xl font-bold ${(totalIngresos - totalEgresos) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(totalIngresos - totalEgresos)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {movs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                    No hay movimientos para los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                movs.map((m) => {
                  const esIngreso = TIPOS_INGRESO.includes(m.tipo);
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                        {formatDate(m.fecha)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {(m.bancos as any)?.nombre || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${esIngreso
                            ? "bg-green-500/20 text-green-700 dark:text-green-400"
                            : "bg-red-500/20 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {TIPO_LABELS[m.tipo] ?? m.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">
                        {m.concepto}
                        {m.beneficiario && (
                          <span className="block text-xs text-muted-foreground">{m.beneficiario}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {m.referencia || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-semibold ${esIngreso ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {esIngreso ? "+" : "-"}{formatCurrency(Number(m.monto))}
                        </span>
                      </TableCell>
                      <TableCell>
                        {m.conciliado ? (
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Conciliado
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {(m.perfiles as any)?.nombre || "—"}
                      </TableCell>
                      <TableCell>
                        <ConciliarButton
                          movimientoId={m.id}
                          conciliado={m.conciliado}
                        />
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

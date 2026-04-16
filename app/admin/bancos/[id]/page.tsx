import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Landmark, Plus, TrendingUp, TrendingDown,
  CheckCircle2, Clock, CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { NuevoMovimientoDialog } from "@/components/admin/bancos/NuevoMovimientoDialog";
import { ConciliarButton } from "@/components/admin/bancos/ConciliarButton";

export const metadata: Metadata = { title: "Detalle Banco" };

const TIPOS_INGRESO = ["deposito", "transferencia_entrada", "nota_credito"];

const TIPO_LABELS: Record<string, string> = {
  deposito: "Depósito",
  retiro: "Retiro",
  transferencia_entrada: "Transferencia (Entrada)",
  transferencia_salida: "Transferencia (Salida)",
  nota_debito: "Nota de Débito",
  nota_credito: "Nota de Crédito",
};

export default async function DetalleBancoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: banco } = await supabase
    .from("bancos")
    .select("*")
    .eq("id", id)
    .single();

  if (!banco) notFound();

  const { data: movimientos } = await supabase
    .from("movimientos_banco")
    .select("*, perfiles(nombre)")
    .eq("banco_id", id)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: tarjetas } = await supabase
    .from("tarjetas")
    .select("*")
    .eq("banco_id", id);

  const movs = movimientos || [];

  const ingresos = movs
    .filter((m) => TIPOS_INGRESO.includes(m.tipo))
    .reduce((s, m) => s + Number(m.monto), 0);
  const egresos = movs
    .filter((m) => !TIPOS_INGRESO.includes(m.tipo))
    .reduce((s, m) => s + Number(m.monto), 0);
  const saldoInicial = Number(banco.saldo_inicial) || 0;
  const saldoActual  = saldoInicial + ingresos - egresos;

  const noConciliados = movs.filter((m) => !m.conciliado).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/bancos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                {banco.nombre}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-mono text-muted-foreground">{banco.numero_cta}</span>
                {banco.tipo_cta && (
                  <Badge variant="outline" className="text-xs capitalize">{banco.tipo_cta}</Badge>
                )}
                {banco.sucursal && (
                  <Badge variant="secondary" className="text-xs capitalize">{banco.sucursal}</Badge>
                )}
                <Badge
                  variant="secondary"
                  className={`text-xs ${banco.activo ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
                >
                  {banco.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <NuevoMovimientoDialog bancoId={id} bancoNombre={banco.nombre} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Saldo Inicial</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold">{formatCurrency(saldoInicial)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" /> Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              +{formatCurrency(ingresos)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-500" /> Egresos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              -{formatCurrency(egresos)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Saldo Actual</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={`text-xl font-bold ${saldoActual >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(saldoActual)}
            </p>
            {noConciliados > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {noConciliados} sin conciliar
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tarjetas asociadas */}
      {(tarjetas?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" /> Tarjetas asociadas
          </h2>
          <div className="flex flex-wrap gap-2">
            {tarjetas!.map((t) => (
              <Badge key={t.id} variant="outline" className="gap-1.5 py-1 px-2.5">
                <CreditCard className="w-3 h-3" />
                {t.nombre}
                <span className="text-xs text-muted-foreground capitalize">({t.tipo})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Movimientos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">
            Movimientos ({movs.length})
          </h2>
          {noConciliados > 0 && (
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {noConciliados} pendientes de conciliar
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Conciliado</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {movs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Sin movimientos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  movs.map((m) => {
                    const esIngreso = TIPOS_INGRESO.includes(m.tipo);
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/50">
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(m.fecha)}
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
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {m.concepto}
                          {m.beneficiario && (
                            <span className="block text-xs text-muted-foreground">{m.beneficiario}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {m.referencia || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-semibold ${esIngreso ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {esIngreso ? "+" : "-"}{formatCurrency(Number(m.monto))}
                          </span>
                        </TableCell>
                        <TableCell>
                          {m.conciliado ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500" />
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
    </div>
  );
}

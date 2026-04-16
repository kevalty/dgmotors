import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, Plus, ChevronRight, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Bancos" };

const TIPOS_INGRESO = ["deposito", "transferencia_entrada", "nota_credito"];

async function calcularSaldo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  banco_id: string,
  saldo_inicial: number
): Promise<{ saldo: number; ingresos: number; egresos: number }> {
  const { data: movs } = await supabase
    .from("movimientos_banco")
    .select("tipo, monto")
    .eq("banco_id", banco_id);

  const movimientos = movs || [];
  const ingresos = movimientos
    .filter((m) => TIPOS_INGRESO.includes(m.tipo))
    .reduce((s, m) => s + Number(m.monto), 0);
  const egresos = movimientos
    .filter((m) => !TIPOS_INGRESO.includes(m.tipo))
    .reduce((s, m) => s + Number(m.monto), 0);

  return {
    saldo: saldo_inicial + ingresos - egresos,
    ingresos,
    egresos,
  };
}

export default async function BancosPage() {
  const supabase = await createClient();

  const { data: bancos } = await supabase
    .from("bancos")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: tarjetas } = await supabase
    .from("tarjetas")
    .select("id")
    .eq("activa", true);

  const lista = bancos || [];

  // Calcular saldos para todos los bancos
  const bancosConSaldo = await Promise.all(
    lista.map(async (b) => {
      const stats = await calcularSaldo(supabase, b.id, Number(b.saldo_inicial) || 0);
      return { ...b, ...stats };
    })
  );

  const totalSaldo    = bancosConSaldo.reduce((s, b) => s + b.saldo, 0);
  const totalIngresos = bancosConSaldo.reduce((s, b) => s + b.ingresos, 0);
  const totalEgresos  = bancosConSaldo.reduce((s, b) => s + b.egresos, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Cuentas Bancarias
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lista.length} cuentas registradas · {tarjetas?.length ?? 0} tarjetas activas
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/bancos/movimientos">
            <Button variant="outline" size="sm" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Movimientos
            </Button>
          </Link>
          <Link href="/admin/bancos/nuevo">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva cuenta
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalSaldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(totalSaldo)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" /> Total Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalIngresos)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" /> Total Egresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalEgresos)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de bancos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Número de Cuenta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead className="text-right text-green-600">Ingresos</TableHead>
                <TableHead className="text-right text-red-600">Egresos</TableHead>
                <TableHead className="text-right">Saldo Actual</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancosConSaldo.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                    <Landmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No hay cuentas bancarias registradas</p>
                    <Link href="/admin/bancos/nuevo">
                      <Button variant="outline" size="sm" className="mt-3 gap-2">
                        <Plus className="w-4 h-4" />
                        Registrar primera cuenta
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                bancosConSaldo.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/admin/bancos/${b.id}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Landmark className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{b.nombre}</span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {b.numero_cta}
                    </TableCell>
                    <TableCell>
                      {b.tipo_cta && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {b.tipo_cta}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.sucursal && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {b.sucursal}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-green-600 dark:text-green-400 font-medium">
                      +{formatCurrency(b.ingresos)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-red-600 dark:text-red-400 font-medium">
                      -{formatCurrency(b.egresos)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-bold ${b.saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatCurrency(b.saldo)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${b.activo ? "bg-green-500/20 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}
                      >
                        {b.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/bancos/${b.id}`}>
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

      {/* Tarjetas */}
      {(tarjetas?.length ?? 0) > 0 && (
        <div className="mt-6">
          <Link href="/admin/bancos/movimientos">
            <Button variant="outline" size="sm" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Ver movimientos y conciliación
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

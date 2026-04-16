import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, Plus, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Anticipos de Clientes" };

const METODO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  cheque: "Cheque",
};

export default async function AnticiposPage() {
  const supabase = await createClient();

  const { data: anticipos } = await supabase
    .from("anticipos_cliente")
    .select(`
      *,
      perfiles(nombre, apellido)
    `)
    .order("fecha", { ascending: false });

  const lista = anticipos || [];
  const pendientes  = lista.filter((a) => !a.aplicado);
  const aplicados   = lista.filter((a) => a.aplicado);
  const totalSaldo  = pendientes.reduce((s, a) => s + Number(a.saldo), 0);
  const totalMonto  = lista.reduce((s, a) => s + Number(a.monto), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Anticipos de Clientes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {lista.length} anticipos · {pendientes.length} pendientes · Saldo disponible: {formatCurrency(totalSaldo)}
          </p>
        </div>
        <Link href="/admin/anticipos/nuevo">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo anticipo
          </Button>
        </Link>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Recibido</p>
            <p className="text-2xl font-bold">{formatCurrency(totalMonto)}</p>
            <p className="text-xs text-muted-foreground">{lista.length} anticipos</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" /> Saldo Disponible
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totalSaldo)}
            </p>
            <p className="text-xs text-muted-foreground">{pendientes.length} pendientes de aplicar</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> Aplicados
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalMonto - totalSaldo)}
            </p>
            <p className="text-xs text-muted-foreground">{aplicados.length} anticipos aplicados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead className="text-right">Monto Original</TableHead>
                <TableHead className="text-right">Saldo Disponible</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No hay anticipos registrados</p>
                    <Link href="/admin/anticipos/nuevo">
                      <Button variant="outline" size="sm" className="mt-3 gap-2">
                        <Plus className="w-4 h-4" />
                        Registrar primer anticipo
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                lista.map((a) => {
                  const p = a.perfiles as any;
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm font-medium">
                        {p ? `${p.nombre} ${p.apellido}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(a.fecha)}
                      </TableCell>
                      <TableCell>
                        {a.metodo_pago && (
                          <Badge variant="outline" className="text-xs">
                            {METODO_LABELS[a.metodo_pago] ?? a.metodo_pago}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {a.referencia || "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {formatCurrency(Number(a.monto))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-bold ${Number(a.saldo) > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                          {formatCurrency(Number(a.saldo))}
                        </span>
                      </TableCell>
                      <TableCell>
                        {a.aplicado ? (
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Aplicado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400">
                            <Clock className="w-3 h-3 mr-1" />
                            Disponible
                          </Badge>
                        )}
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

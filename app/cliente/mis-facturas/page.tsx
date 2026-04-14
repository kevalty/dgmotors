import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, ESTADO_FACTURA_LABELS, ESTADO_FACTURA_COLORS } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis Facturas" };

export default async function MisFacturasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: facturas } = await supabase
    .from("facturas")
    .select("id, numero, tipo, fecha_emision, total, estado, sucursal, ordenes_trabajo(numero)")
    .eq("cliente_id", user.id)
    .order("created_at", { ascending: false });

  const todas = facturas || [];
  const totalPagado = todas
    .filter((f) => f.estado === "pagada")
    .reduce((acc, f) => acc + (f.total || 0), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Mis Facturas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {todas.length} facturas · Total pagado: {formatCurrency(totalPagado)}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>OT</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {todas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Sin facturas todavía
                  </TableCell>
                </TableRow>
              ) : (
                todas.map((f) => (
                  <TableRow key={f.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/cliente/mis-facturas/${f.id}`}>
                        <p className="text-sm font-mono font-semibold">{f.numero}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {(f.ordenes_trabajo as any)?.numero
                        ? `OT-${String((f.ordenes_trabajo as any).numero).padStart(4, "0")}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(f.fecha_emision)}
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
                      <Link href={`/cliente/mis-facturas/${f.id}`}>
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

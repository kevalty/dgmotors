import type { Metadata } from "next";
import Link from "next/link";
import { HardHat, Wrench, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Mecánicos" };

export default async function MecanicosPage() {
  const supabase = await createClient();

  const { data: mecanicos } = await supabase
    .from("perfiles")
    .select("id, nombre, apellido, telefono, cedula, created_at")
    .eq("rol", "mecanico")
    .order("created_at", { ascending: false });

  // Trabajos por mecánico
  const { data: trabajos } = await supabase
    .from("mantenimientos")
    .select("tecnico_id, costo");

  const statsMap: Record<string, { count: number; ingresos: number }> = {};
  (trabajos || []).forEach((t) => {
    if (!t.tecnico_id) return;
    if (!statsMap[t.tecnico_id]) statsMap[t.tecnico_id] = { count: 0, ingresos: 0 };
    statsMap[t.tecnico_id].count++;
    statsMap[t.tecnico_id].ingresos += t.costo || 0;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Mecánicos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mecanicos?.length ?? 0} mecánicos registrados
          </p>
        </div>
        <Link href="/admin/mecanicos/nuevo">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Nuevo Mecánico
          </Button>
        </Link>
      </div>

      {!mecanicos || mecanicos.length === 0 ? (
        <div className="text-center py-20">
          <HardHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Sin mecánicos registrados</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crea un usuario y asígnale el rol &quot;mecanico&quot; en Supabase.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mecánico</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Trabajos</TableHead>
                  <TableHead>Ingresos generados</TableHead>
                  <TableHead>Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mecanicos.map((m) => {
                  const stats = statsMap[m.id] || { count: 0, ingresos: 0 };
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                            <HardHat className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium">{m.nombre} {m.apellido}</p>
                            {m.cedula && (
                              <p className="text-xs text-muted-foreground">{m.cedula}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.telefono || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Wrench className="w-3 h-3" />
                          {stats.count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {stats.ingresos > 0 ? (
                          <span className="text-sm font-medium text-primary">
                            {formatCurrency(stats.ingresos)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(m.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

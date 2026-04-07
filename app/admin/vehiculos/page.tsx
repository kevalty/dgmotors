import type { Metadata } from "next";
import Link from "next/link";
import { Car, ChevronRight } from "lucide-react";
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
import { formatKm } from "@/lib/utils";

export const metadata: Metadata = { title: "Vehículos" };

export default async function AdminVehiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: vehiculos, count } = await supabase
    .from("vehiculos")
    .select(`
      id, placa, marca, modelo, anio, color, kilometraje, tipo, combustible,
      perfiles(id, nombre, apellido)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Vehículos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} vehículos registrados
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead className="hidden md:table-cell">Km</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!vehiculos || vehiculos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Car className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Sin vehículos registrados
                  </TableCell>
                </TableRow>
              ) : (
                vehiculos.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {v.placa}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{v.marca} {v.modelo}</p>
                      <p className="text-xs text-muted-foreground">{v.anio}{v.color ? ` · ${v.color}` : ""}</p>
                    </TableCell>
                    <TableCell>
                      {v.perfiles ? (
                        <Link
                          href={`/admin/clientes/${(v.perfiles as any).id}`}
                          className="text-sm hover:text-primary transition-colors"
                        >
                          {(v.perfiles as any).nombre} {(v.perfiles as any).apellido}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {v.kilometraje > 0 ? formatKm(v.kilometraje) : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {v.tipo && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {v.tipo}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
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

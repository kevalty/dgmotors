import type { Metadata } from "next";
import Link from "next/link";
import { Users, ChevronRight, Car, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const supabase = await createClient();
  const PAGE_SIZE = 20;
  const pageNum = parseInt(page || "1");
  const from = (pageNum - 1) * PAGE_SIZE;

  let query = supabase
    .from("perfiles")
    .select("id, nombre, apellido, email:id, telefono, cedula, created_at", { count: "exact" })
    .eq("rol", "cliente")
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const { data: clientes, count } = await query;

  // Obtener email de auth.users no es posible directamente con cliente SSR,
  // así que mostramos info del perfil
  const { data: vehiculosCount } = await supabase
    .from("vehiculos")
    .select("cliente_id");

  const vcMap: Record<string, number> = {};
  (vehiculosCount || []).forEach((v) => {
    vcMap[v.cliente_id] = (vcMap[v.cliente_id] || 0) + 1;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Clientes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {count ?? 0} clientes registrados
          </p>
        </div>
        <Link href="/admin/clientes/nuevo">
          <Button size="sm" className="gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            Walk-In
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Vehículos</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!clientes || clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Sin clientes registrados
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/admin/clientes/${c.id}`} className="block">
                        <p className="font-medium">{c.nombre} {c.apellido}</p>
                        {c.cedula && (
                          <p className="text-xs text-muted-foreground">{c.cedula}</p>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.telefono || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Car className="w-3 h-3" />
                        {vcMap[c.id] || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.created_at)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/clientes/${c.id}`}>
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

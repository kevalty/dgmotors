import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, ChevronRight, Clock } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, ESTADO_CITA_LABELS, ESTADO_CITA_COLORS } from "@/lib/utils";

export const metadata: Metadata = { title: "Citas" };

export default async function AdminCitasPage() {
  const supabase = await createClient();

  const { data: citas, error } = await supabase
    .from("citas")
    .select(`
      id, fecha_hora, estado, sucursal,
      perfiles(nombre, apellido),
      vehiculos(placa, marca, modelo),
      servicios(nombre)
    `)
    .order("fecha_hora", { ascending: true });

  if (error) {
    return (
      <div className="p-8 text-destructive text-sm">
        Error al cargar citas: {error.message}
      </div>
    );
  }

  const todas = citas || [];
  const pendientes = todas.filter((c) => c.estado === "pendiente");
  const activas = todas.filter((c) =>
    c.estado === "confirmada" || c.estado === "en_proceso"
  );
  const historial = todas.filter((c) =>
    c.estado === "completada" || c.estado === "cancelada"
  );

  const CitaRow = ({ c }: { c: any }) => (
    <TableRow className="cursor-pointer hover:bg-muted/50">
      <TableCell>
        <Link href={`/admin/citas/${c.id}`} className="block">
          <p className="text-sm font-medium">
            {(c.perfiles as any)?.nombre} {(c.perfiles as any)?.apellido}
          </p>
          {(c.servicios as any)?.nombre && (
            <p className="text-xs text-muted-foreground">{(c.servicios as any).nombre}</p>
          )}
        </Link>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {(c.vehiculos as any)?.marca} {(c.vehiculos as any)?.modelo}
        <br />
        <span className="text-xs font-mono">{(c.vehiculos as any)?.placa}</span>
      </TableCell>
      <TableCell className="text-sm">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
          {formatDateTime(c.fecha_hora)}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs capitalize">{c.sucursal}</Badge>
      </TableCell>
      <TableCell>
        <Badge className={`${ESTADO_CITA_COLORS[c.estado]} text-xs`} variant="secondary">
          {ESTADO_CITA_LABELS[c.estado]}
        </Badge>
      </TableCell>
      <TableCell>
        <Link href={`/admin/citas/${c.id}`}>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </TableCell>
    </TableRow>
  );

  const EmptyRow = ({ cols = 6, msg }: { cols?: number; msg: string }) => (
    <TableRow>
      <TableCell colSpan={cols} className="text-center py-12 text-muted-foreground">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
        {msg}
      </TableCell>
    </TableRow>
  );

  const TablaBase = ({ rows, empty }: { rows: any[]; empty: string }) => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0
              ? <EmptyRow msg={empty} />
              : rows.map((c) => <CitaRow key={c.id} c={c} />)
            }
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Citas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {todas.length} citas en total
        </p>
      </div>

      <Tabs defaultValue="pendientes">
        <TabsList className="mb-6">
          <TabsTrigger value="pendientes" className="relative">
            Por confirmar
            {pendientes.length > 0 && (
              <span className="ml-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {pendientes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activas">
            En curso ({activas.length})
          </TabsTrigger>
          <TabsTrigger value="historial">
            Historial ({historial.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes">
          <TablaBase rows={pendientes} empty="No hay citas pendientes de confirmación" />
        </TabsContent>

        <TabsContent value="activas">
          <TablaBase rows={activas} empty="No hay citas activas" />
        </TabsContent>

        <TabsContent value="historial">
          <TablaBase rows={historial} empty="Sin historial de citas" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

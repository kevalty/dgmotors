import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, ESTADO_OT_LABELS, ESTADO_OT_COLORS, TIPO_OT_LABELS } from "@/lib/utils";

export const metadata: Metadata = { title: "Órdenes de Trabajo" };

export default async function OrdenesPage() {
  const supabase = await createClient();

  const { data: ordenes } = await supabase
    .from("ordenes_trabajo")
    .select(`
      id, numero, estado, tipo, fecha_entrada, fecha_prometida, km_entrada,
      perfiles!ordenes_trabajo_cliente_id_fkey(nombre, apellido),
      vehiculos(placa, marca, modelo, anio)
    `)
    .order("created_at", { ascending: false });

  const todas = ordenes || [];

  const activas = todas.filter((o) =>
    ["presupuesto", "aprobado", "en_proceso", "pausado"].includes(o.estado)
  );
  const completadas = todas.filter((o) =>
    ["completado", "facturado"].includes(o.estado)
  );
  const entregadas = todas.filter((o) =>
    ["entregado", "cancelado"].includes(o.estado)
  );

  const OTRow = ({ o }: { o: any }) => (
    <TableRow className="cursor-pointer hover:bg-muted/50">
      <TableCell>
        <Link href={`/admin/ordenes/${o.id}`} className="block">
          <p className="text-sm font-mono font-semibold text-primary">
            OT-{String(o.numero).padStart(4, "0")}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(o.fecha_entrada)}
          </p>
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/admin/ordenes/${o.id}`} className="block">
          <p className="text-sm font-medium">
            {(o.perfiles as any)?.nombre} {(o.perfiles as any)?.apellido}
          </p>
        </Link>
      </TableCell>
      <TableCell>
        <p className="text-sm">
          {(o.vehiculos as any)?.marca} {(o.vehiculos as any)?.modelo}
        </p>
        <p className="text-xs font-mono text-muted-foreground">
          {(o.vehiculos as any)?.placa}
        </p>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {TIPO_OT_LABELS[o.tipo] || o.tipo}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={`text-xs ${ESTADO_OT_COLORS[o.estado]}`}
        >
          {ESTADO_OT_LABELS[o.estado] || o.estado}
        </Badge>
      </TableCell>
      <TableCell>
        {o.fecha_prometida && (
          <p className="text-xs text-muted-foreground">
            {formatDate(o.fecha_prometida)}
          </p>
        )}
      </TableCell>
      <TableCell>
        <Link href={`/admin/ordenes/${o.id}`}>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </TableCell>
    </TableRow>
  );

  const EmptyRow = ({ msg }: { msg: string }) => (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
        {msg}
      </TableCell>
    </TableRow>
  );

  const Tabla = ({ rows, empty }: { rows: any[]; empty: string }) => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OT</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prometido</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0
              ? <EmptyRow msg={empty} />
              : rows.map((o) => <OTRow key={o.id} o={o} />)
            }
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Órdenes de Trabajo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {todas.length} órdenes en total
          </p>
        </div>
        <Link href="/admin/ordenes/nueva">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva OT
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="activas">
        <TabsList className="mb-6">
          <TabsTrigger value="activas">
            Activas
            {activas.length > 0 && (
              <span className="ml-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completadas">Completadas ({completadas.length})</TabsTrigger>
          <TabsTrigger value="entregadas">Entregadas ({entregadas.length})</TabsTrigger>
          <TabsTrigger value="todas">Todas ({todas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="activas">
          <Tabla rows={activas} empty="No hay órdenes activas" />
        </TabsContent>
        <TabsContent value="completadas">
          <Tabla rows={completadas} empty="No hay órdenes completadas" />
        </TabsContent>
        <TabsContent value="entregadas">
          <Tabla rows={entregadas} empty="Sin historial" />
        </TabsContent>
        <TabsContent value="todas">
          <Tabla rows={todas} empty="No hay órdenes registradas" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

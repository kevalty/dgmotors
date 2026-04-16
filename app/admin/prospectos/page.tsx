import type { Metadata } from "next";
import Link from "next/link";
import { Users2, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CambiarEstadoProspecto } from "@/components/admin/prospectos/CambiarEstadoProspecto";

export const metadata: Metadata = { title: "Prospectos" };

const ESTADO_COLORS: Record<string, string> = {
  nuevo:       "bg-slate-500/20 text-slate-700 dark:text-slate-300",
  contactado:  "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  interesado:  "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  propuesta:   "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  negociacion: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  cerrado:     "bg-green-500/20 text-green-700 dark:text-green-400",
  perdido:     "bg-red-500/20 text-red-700 dark:text-red-400",
};

const ESTADOS = ["nuevo","contactado","interesado","propuesta","negociacion","cerrado","perdido"];

export default async function ProspectosPage() {
  const supabase = await createClient();

  const { data: prospectos } = await supabase
    .from("prospectos")
    .select("*, perfiles(nombre)")
    .order("created_at", { ascending: false });

  const lista = prospectos || [];
  const activos  = lista.filter((p) => !["cerrado","perdido"].includes(p.estado));
  const cerrados = lista.filter((p) => p.estado === "cerrado");
  const valorPipeline = activos.reduce((s, p) => s + Number(p.valor_est || 0), 0);
  const valorCerrado  = cerrados.reduce((s, p) => s + Number(p.valor_est || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Prospectos — CRM
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pipeline de talleres interesados en el sistema · {activos.length} activos
          </p>
        </div>
        <Link href="/admin/prospectos/nuevo">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo prospecto
          </Button>
        </Link>
      </div>

      {/* Funnel visual */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pipeline</p>
            <p className="text-xl font-bold">{formatCurrency(valorPipeline)}</p>
            <p className="text-xs text-muted-foreground">{activos.length} prospectos activos</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Contratos Cerrados</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(valorCerrado)}
            </p>
            <p className="text-xs text-muted-foreground">{cerrados.length} talleres</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">En Negociación</p>
            <p className="text-xl font-bold">
              {lista.filter((p) => p.estado === "negociacion").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Prospectos</p>
            <p className="text-xl font-bold">{lista.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban por estado (filtro visual) */}
      <div className="flex gap-2 flex-wrap mb-4">
        {ESTADOS.map((e) => {
          const count = lista.filter((p) => p.estado === e).length;
          return (
            <Badge key={e} variant="secondary" className={`capitalize text-xs ${ESTADO_COLORS[e]}`}>
              {e} ({count})
            </Badge>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead className="text-right">Valor Est.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                    <Users2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No hay prospectos registrados</p>
                    <Link href="/admin/prospectos/nuevo">
                      <Button variant="outline" size="sm" className="mt-3 gap-2">
                        <Plus className="w-4 h-4" />
                        Agregar primer prospecto
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                lista.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50">
                    <TableCell>
                      <p className="text-sm font-medium">{p.nombre}</p>
                      {p.empresa && (
                        <p className="text-xs text-muted-foreground">{p.empresa}</p>
                      )}
                      {p.cargo && (
                        <p className="text-xs text-muted-foreground">{p.cargo}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.telefono && <p className="text-xs">{p.telefono}</p>}
                      {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.ciudad || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">
                      {p.origen || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {p.valor_est ? formatCurrency(Number(p.valor_est)) : "—"}
                    </TableCell>
                    <TableCell>
                      <CambiarEstadoProspecto
                        prospectoId={p.id}
                        estadoActual={p.estado}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(p.perfiles as any)?.nombre || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(p.created_at)}
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

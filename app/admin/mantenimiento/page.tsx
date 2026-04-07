import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, Plus, HardHat, User, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency, formatKm } from "@/lib/utils";

export const metadata: Metadata = { title: "Mantenimientos" };

export default async function AdminMantenimientoPage() {
  const supabase = await createClient();
  const { data: mantenimientos } = await supabase
    .from("mantenimientos")
    .select(`
      id, tipo, descripcion, fecha, kilometraje, costo, proxima_fecha, observaciones,
      vehiculos(placa, marca, modelo, perfiles(nombre, apellido)),
      tecnico:perfiles!mantenimientos_tecnico_id_fkey(nombre, apellido, rol)
    `)
    .order("fecha", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Historial de Mantenimientos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mantenimientos?.length ?? 0} registros
          </p>
        </div>
        <Link href="/admin/mantenimiento/nuevo">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Nuevo
          </Button>
        </Link>
      </div>

      {!mantenimientos || mantenimientos.length === 0 ? (
        <div className="text-center py-20">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Sin registros de mantenimiento</p>
          <Link href="/admin/mantenimiento/nuevo" className="mt-4 inline-block">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Registrar Mantenimiento
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {mantenimientos.map((m) => {
            const tecnico = m.tecnico as any;
            const vehiculo = m.vehiculos as any;
            const esMecanico = tecnico?.rol === "mecanico";

            return (
              <Card key={m.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="min-w-0 flex-1">

                      {/* Tipo + fecha */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm capitalize">
                          {m.tipo.replace(/_/g, " ")}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {formatDate(m.fecha)}
                        </Badge>
                        {m.kilometraje && (
                          <Badge variant="outline" className="text-xs">
                            {formatKm(m.kilometraje)}
                          </Badge>
                        )}
                        {m.costo && (
                          <Badge variant="outline" className="text-xs text-primary">
                            {formatCurrency(m.costo)}
                          </Badge>
                        )}
                      </div>

                      {/* Descripción */}
                      <p className="text-sm mb-2">{m.descripcion}</p>

                      {/* Vehículo + cliente */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3 h-3 shrink-0" />
                        <span>
                          {vehiculo?.perfiles?.nombre} {vehiculo?.perfiles?.apellido}
                        </span>
                        <span>·</span>
                        <span className="font-medium">{vehiculo?.placa}</span>
                        <span className="text-muted-foreground/60">
                          {vehiculo?.marca} {vehiculo?.modelo}
                        </span>
                      </div>

                      {/* Técnico */}
                      {tecnico && (
                        <div className="flex items-center gap-1.5 text-xs mt-1">
                          <HardHat className="w-3 h-3 shrink-0 text-orange-500" />
                          <span className="text-muted-foreground">
                            {esMecanico ? "Mecánico:" : "Admin:"}
                          </span>
                          <span className={esMecanico ? "text-orange-500 font-medium" : "text-muted-foreground"}>
                            {tecnico.nombre} {tecnico.apellido}
                          </span>
                        </div>
                      )}

                      {/* Próxima fecha + observaciones */}
                      {(m.proxima_fecha || m.observaciones) && (
                        <div className="mt-1.5 space-y-0.5">
                          {m.proxima_fecha && (
                            <p className="text-xs text-muted-foreground">
                              Próxima revisión: {formatDate(m.proxima_fecha)}
                            </p>
                          )}
                          {m.observaciones && (
                            <p className="text-xs text-muted-foreground italic">
                              {m.observaciones}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <Link href={`/admin/mantenimiento/${m.id}/editar`} className="shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

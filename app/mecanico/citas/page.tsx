import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, MapPin, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, ESTADO_CITA_LABELS, ESTADO_CITA_COLORS } from "@/lib/utils";

export const metadata: Metadata = { title: "Citas del Taller" };

export default async function MecanicoCitasPage() {
  const supabase = await createClient();

  const { data: citas } = await supabase
    .from("citas")
    .select(`
      id, fecha_hora, estado, sucursal, notas_cliente, notas_admin,
      perfiles(nombre, apellido, telefono),
      vehiculos(placa, marca, modelo, anio),
      servicios(nombre)
    `)
    .in("estado", ["confirmada", "en_proceso"])
    .order("fecha_hora");

  const confirmadas = (citas || []).filter((c) => c.estado === "confirmada");
  const enProceso = (citas || []).filter((c) => c.estado === "en_proceso");

  const CitaRow = ({ c }: { c: any }) => (
    <Link href={`/mecanico/citas/${c.id}`}>
      <Card className="hover:border-primary/30 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm">
                  {c.perfiles?.nombre} {c.perfiles?.apellido}
                </span>
                <Badge className={ESTADO_CITA_COLORS[c.estado]} variant="secondary">
                  {ESTADO_CITA_LABELS[c.estado]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(c.fecha_hora)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="capitalize">{c.sucursal}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  {c.vehiculos?.marca} {c.vehiculos?.modelo} · {c.vehiculos?.placa}
                </span>
              </div>
              {c.servicios?.nombre && (
                <p className="text-xs text-muted-foreground mt-1">🔧 {c.servicios.nombre}</p>
              )}
              {c.notas_cliente && (
                <p className="text-xs text-muted-foreground mt-1 italic">"{c.notas_cliente}"</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Citas del Taller
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Citas confirmadas y en proceso
        </p>
      </div>

      {!citas || citas.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No hay citas confirmadas por atender</p>
        </div>
      ) : (
        <div className="space-y-6">
          {enProceso.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-orange-500 mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                En proceso ({enProceso.length})
              </h2>
              <div className="space-y-3">
                {enProceso.map((c) => <CitaRow key={c.id} c={c} />)}
              </div>
            </div>
          )}

          {confirmadas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                Confirmadas por atender ({confirmadas.length})
              </h2>
              <div className="space-y-3">
                {confirmadas.map((c) => <CitaRow key={c.id} c={c} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

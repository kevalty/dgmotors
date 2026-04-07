import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Plus, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, ESTADO_CITA_LABELS, ESTADO_CITA_COLORS } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis Citas" };

export default async function CitasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: citas } = await supabase
    .from("citas")
    .select(`
      id, fecha_hora, estado, sucursal, notas_cliente,
      servicios(nombre),
      vehiculos(placa, marca, modelo)
    `)
    .eq("cliente_id", user.id)
    .order("fecha_hora", { ascending: false });

  const ahora = new Date();
  const proximas = (citas || []).filter(
    (c) => new Date(c.fecha_hora) >= ahora && c.estado !== "cancelada"
  );
  const pasadas = (citas || []).filter(
    (c) => new Date(c.fecha_hora) < ahora || c.estado === "cancelada" || c.estado === "completada"
  );

  const CitaCard = ({ cita }: { cita: any }) => (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="w-3.5 h-3.5 text-primary" />
            {formatDateTime(cita.fecha_hora)}
          </div>
          <Badge className={ESTADO_CITA_COLORS[cita.estado]} variant="secondary">
            {ESTADO_CITA_LABELS[cita.estado]}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="capitalize">{cita.sucursal}</span>
          </span>
          {cita.vehiculos && (
            <span>
              {cita.vehiculos.marca} {cita.vehiculos.modelo} · {cita.vehiculos.placa}
            </span>
          )}
          {cita.servicios?.nombre && (
            <span>{cita.servicios.nombre}</span>
          )}
        </div>
        {cita.notas_cliente && (
          <p className="text-xs text-muted-foreground mt-2 italic">{cita.notas_cliente}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Mis Citas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {citas?.length ?? 0} cita{citas?.length !== 1 ? "s" : ""} en total
          </p>
        </div>
        <Link href="/cliente/citas/nueva">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Nueva Cita
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="proximas">
        <TabsList className="mb-6">
          <TabsTrigger value="proximas">
            Próximas ({proximas.length})
          </TabsTrigger>
          <TabsTrigger value="pasadas">
            Historial ({pasadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proximas">
          {proximas.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground mb-4">Sin citas próximas</p>
              <Link href="/cliente/citas/nueva">
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Agendar Cita
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {proximas.map((c) => <CitaCard key={c.id} cita={c} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pasadas">
          {pasadas.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">Sin historial de citas</p>
          ) : (
            <div className="space-y-3">
              {pasadas.map((c) => <CitaCard key={c.id} cita={c} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

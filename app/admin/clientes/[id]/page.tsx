import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Car, Calendar, Wrench, Phone, CreditCard, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, ESTADO_CITA_LABELS, ESTADO_CITA_COLORS, formatKm, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalle Cliente" };

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", id)
    .eq("rol", "cliente")
    .single();

  if (!perfil) notFound();

  const [{ data: vehiculos }, { data: citas }, { data: mantenimientos }] = await Promise.all([
    supabase.from("vehiculos").select("*").eq("cliente_id", id).order("created_at", { ascending: false }),
    supabase
      .from("citas")
      .select("id, fecha_hora, estado, sucursal, servicios(nombre), vehiculos(placa, marca, modelo)")
      .eq("cliente_id", id)
      .order("fecha_hora", { ascending: false })
      .limit(5),
    supabase
      .from("mantenimientos")
      .select("id, tipo, fecha, costo, vehiculos(placa, marca, modelo)")
      .in("vehiculo_id", [])
      .order("fecha", { ascending: false })
      .limit(5),
  ]);

  // Requery mantenimientos con los IDs de vehículos del cliente
  const vehiculoIds = (vehiculos || []).map((v) => v.id);
  const { data: mants } = vehiculoIds.length > 0
    ? await supabase
        .from("mantenimientos")
        .select(`
          id, tipo, fecha, costo, descripcion,
          vehiculos(placa, marca, modelo),
          tecnico:perfiles!mantenimientos_tecnico_id_fkey(nombre, apellido, rol)
        `)
        .in("vehiculo_id", vehiculoIds)
        .order("fecha", { ascending: false })
        .limit(10)
    : { data: [] };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/clientes">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {perfil.nombre} {perfil.apellido}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Cliente desde {formatDate(perfil.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Info personal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { icon: User, label: "Nombre", value: `${perfil.nombre} ${perfil.apellido}` },
              { icon: Phone, label: "Teléfono", value: perfil.telefono || "—" },
              { icon: CreditCard, label: "Cédula", value: perfil.cedula || "—" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <item.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Vehículos", value: vehiculos?.length ?? 0, icon: Car },
                { label: "Citas", value: citas?.length ?? 0, icon: Calendar },
                { label: "Mantenimientos", value: mants?.length ?? 0, icon: Wrench },
                {
                  label: "Total facturado",
                  value: formatCurrency((mants || []).reduce((s, m) => s + (m.costo || 0), 0)),
                  icon: CreditCard,
                },
              ].map((s) => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-muted/40">
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehículos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              Vehículos ({vehiculos?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehiculos && vehiculos.length > 0 ? (
              <div className="space-y-2">
                {vehiculos.slice(0, 4).map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-2 rounded-md bg-muted/40">
                    <div>
                      <p className="text-sm font-medium">{v.marca} {v.modelo}</p>
                      <p className="text-xs text-muted-foreground">{v.placa} · {v.anio}</p>
                    </div>
                    {v.kilometraje > 0 && (
                      <p className="text-xs text-muted-foreground">{formatKm(v.kilometraje)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin vehículos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Citas recientes */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Últimas Citas
            </span>
            <Link href={`/admin/citas?cliente=${id}`} className="text-xs text-primary hover:underline">
              Ver todas
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!citas || citas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin citas</p>
          ) : (
            <div className="space-y-2">
              {citas.map((c) => (
                <Link key={c.id} href={`/admin/citas/${c.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                    <div>
                      <p className="text-sm font-medium">{formatDateTime(c.fecha_hora)}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {c.sucursal} · {(c.vehiculos as any)?.marca} {(c.vehiculos as any)?.modelo}
                      </p>
                    </div>
                    <Badge className={`${ESTADO_CITA_COLORS[c.estado]} text-xs`} variant="secondary">
                      {ESTADO_CITA_LABELS[c.estado]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mantenimientos recientes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            Últimos Mantenimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!mants || mants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin mantenimientos</p>
          ) : (
            <div className="space-y-2">
              {mants.map((m) => {
                const tecnico = m.tecnico as any;
                const esMecanico = tecnico?.rol === "mecanico";
                return (
                  <div key={m.id} className="p-3 rounded-lg bg-muted/40">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize">
                          {m.tipo.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(m.vehiculos as any)?.marca} {(m.vehiculos as any)?.modelo} · {formatDate(m.fecha)}
                        </p>
                        {m.descripcion && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {m.descripcion}
                          </p>
                        )}
                        {tecnico && (
                          <div className="flex items-center gap-1 mt-1">
                            <HardHat className="w-3 h-3 text-orange-500 shrink-0" />
                            <span className={`text-xs ${esMecanico ? "text-orange-500" : "text-muted-foreground"}`}>
                              {tecnico.nombre} {tecnico.apellido}
                              {esMecanico && " (Mecánico)"}
                            </span>
                          </div>
                        )}
                      </div>
                      {m.costo && (
                        <p className="text-sm font-medium text-primary shrink-0">
                          {formatCurrency(m.costo)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

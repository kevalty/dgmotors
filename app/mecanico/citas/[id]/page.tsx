"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Clock, MapPin, Car, User, Wrench, MessageCircle, Loader2,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { actualizarEstadoCita } from "@/lib/actions/admin";
import { formatDateTime, ESTADO_CITA_LABELS, ESTADO_CITA_COLORS } from "@/lib/utils";
import { WA_CONFIG, SUCURSAL_MAPS, buildCitaWALink } from "@/lib/whatsapp";

// Mecánico solo puede mover a en_proceso o completada
const ESTADOS_MECANICO = ["en_proceso", "completada"];

export default function MecanicoCitaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [cita, setCita] = useState<any>(null);
  const [estado, setEstado] = useState("");
  const [notasAdmin, setNotasAdmin] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: string }>({});
  const [mecanicoId, setMecanicoId] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("citas")
      .select(`
        *, perfiles!citas_cliente_id_fkey(id, nombre, apellido, telefono),
        vehiculos(id, placa, marca, modelo, anio), servicios(nombre)
      `)
      .eq("id", id)
      .single()
      .then(async ({ data }) => {
        setCita(data);
        setEstado(data?.estado || "en_proceso");
        setNotasAdmin(data?.notas_admin || "");
        // Get current user id to pre-fill as tecnico
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setMecanicoId(data?.tecnico_id || user.id);
      });
  }, [id]);

  const handleGuardar = async () => {
    setSaving(true);
    setResult({});
    const res = await actualizarEstadoCita(id, estado, notasAdmin, mecanicoId);
    setResult(res);
    setSaving(false);
    if (!res.error) setCita((prev: any) => ({ ...prev, estado, notas_admin: notasAdmin }));
  };

  if (!cita) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const waLink = buildCitaWALink(
    { ...cita, fecha_hora_fmt: formatDateTime(cita.fecha_hora) },
    estado,
    notasAdmin
  );
  const waConfig = WA_CONFIG[estado];
  const tienetelefono = !!cita.perfiles?.telefono;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/mecanico/citas">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Atender Cita
          </h1>
          <p className="text-muted-foreground text-sm">{formatDateTime(cita.fecha_hora)}</p>
        </div>
        <Badge className={`ml-auto ${ESTADO_CITA_COLORS[cita.estado]}`} variant="secondary">
          {ESTADO_CITA_LABELS[cita.estado]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Información de la Cita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium">{cita.perfiles?.nombre} {cita.perfiles?.apellido}</p>
                {cita.perfiles?.telefono
                  ? <p className="text-xs text-muted-foreground">{cita.perfiles.telefono}</p>
                  : <p className="text-xs text-muted-foreground italic">Sin teléfono</p>
                }
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Car className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Vehículo</p>
                <p className="text-sm font-medium">
                  {cita.vehiculos?.marca} {cita.vehiculos?.modelo} {cita.vehiculos?.anio}
                </p>
                <p className="text-xs font-mono text-muted-foreground">{cita.vehiculos?.placa}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha y Hora</p>
                <p className="text-sm font-medium">{formatDateTime(cita.fecha_hora)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Sucursal</p>
                <p className="text-sm font-medium capitalize">{cita.sucursal}</p>
                <a href={SUCURSAL_MAPS[cita.sucursal]} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline">
                  Ver en Google Maps
                </a>
              </div>
            </div>
            {cita.servicios?.nombre && (
              <div className="flex items-start gap-2.5">
                <Wrench className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Servicio solicitado</p>
                  <p className="text-sm font-medium">{cita.servicios.nombre}</p>
                </div>
              </div>
            )}
            {cita.notas_cliente && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Notas del cliente</p>
                <p className="text-sm italic">"{cita.notas_cliente}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actualizar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actualizar Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{result.error}
              </div>
            )}
            {result.success && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />{result.success}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={(v) => setEstado(v ?? "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ESTADOS_MECANICO.map((e) => (
                    <SelectItem key={e} value={e}>{ESTADO_CITA_LABELS[e]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notas / Observaciones</Label>
              <Textarea
                value={notasAdmin}
                onChange={(e) => setNotasAdmin(e.target.value)}
                placeholder="Describe el trabajo realizado o detalles para el cliente..."
                rows={3}
              />
            </div>

            <Button onClick={handleGuardar} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? "Guardando..." : "Guardar Estado"}
            </Button>

            {waConfig && (
              tienetelefono ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2 border-green-500/40 text-green-600 hover:bg-green-500/10 hover:text-green-600">
                    <MessageCircle className="w-4 h-4" />
                    {waConfig.boton}
                  </Button>
                </a>
              ) : (
                <Button variant="outline" className="w-full gap-2" disabled>
                  <MessageCircle className="w-4 h-4" />
                  Sin teléfono — no se puede enviar WhatsApp
                </Button>
              )
            )}

            <Link href={`/mecanico/registrar?vehiculo=${cita.vehiculos?.id || ""}&cita=${id}`}>
              <Button variant="outline" className="w-full gap-2">
                <Wrench className="w-4 h-4" />
                Registrar Trabajo Realizado
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

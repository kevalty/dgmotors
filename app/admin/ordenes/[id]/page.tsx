"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, Clock, AlertCircle,
  Wrench, User, Car, FileText, History, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import {
  ESTADO_OT_LABELS, ESTADO_OT_COLORS, TIPO_OT_LABELS,
  formatDate, formatDateTime, formatCurrency, formatKm,
} from "@/lib/utils";
import {
  actualizarEstadoOT, agregarLineaOT, eliminarLineaOT, actualizarDiagnosticoOT,
} from "@/lib/actions/erp";

const ESTADOS_TRANSICION: Record<string, string[]> = {
  presupuesto: ["aprobado", "cancelado"],
  aprobado: ["en_proceso", "cancelado"],
  en_proceso: ["pausado", "completado"],
  pausado: ["en_proceso", "cancelado"],
  completado: ["facturado", "en_proceso"],
  facturado: ["entregado"],
  entregado: [],
  cancelado: [],
};

export default function OrdenDetallePageClient() {
  const params = useParams();
  const otId = params.id as string;
  const [ot, setOt] = useState<any>(null);
  const [lineas, setLineas] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [mecanicos, setMecanicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [diagnostico, setDiagnostico] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const supabase = createClient();

  const cargar = async () => {
    const [otRes, lineasRes, histRes, repRes, servRes, mecRes] = await Promise.all([
      supabase
        .from("ordenes_trabajo")
        .select(`
          *,
          perfiles!ordenes_trabajo_cliente_id_fkey(id, nombre, apellido, telefono),
          vehiculos(id, placa, marca, modelo, anio, color, kilometraje)
        `)
        .eq("id", otId)
        .single(),
      supabase
        .from("ot_lineas")
        .select("*, repuestos(nombre, codigo), servicios(nombre), perfiles(nombre, apellido)")
        .eq("ot_id", otId)
        .order("created_at"),
      supabase
        .from("ot_historial")
        .select("*, perfiles(nombre, apellido)")
        .eq("ot_id", otId)
        .order("created_at", { ascending: false }),
      supabase.from("repuestos").select("id, nombre, codigo, precio_venta, unidad").eq("activo", true),
      supabase.from("servicios").select("id, nombre, precio_min, precio_max").eq("activo", true),
      supabase.from("perfiles").select("id, nombre, apellido").eq("rol", "mecanico"),
    ]);

    if (otRes.data) {
      setOt(otRes.data);
      setDiagnostico(otRes.data.diagnostico || "");
      setObservaciones(otRes.data.observaciones || "");
    }
    setLineas(lineasRes.data || []);
    setHistorial(histRes.data || []);
    setRepuestos(repRes.data || []);
    setServicios(servRes.data || []);
    setMecanicos(mecRes.data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [otId]);

  const cambiarEstado = (estadoNuevo: string) => {
    const nota = prompt(`Nota para cambio a "${ESTADO_OT_LABELS[estadoNuevo]}" (opcional):`);
    startTransition(async () => {
      const res = await actualizarEstadoOT(otId, estadoNuevo, nota || undefined);
      if (res.error) setMsg({ type: "err", text: res.error });
      else { setMsg({ type: "ok", text: res.success || "Estado actualizado." }); cargar(); }
    });
  };

  const eliminarLinea = (lineaId: string) => {
    startTransition(async () => {
      const res = await eliminarLineaOT(lineaId);
      if (res.error) setMsg({ type: "err", text: res.error });
      else { setMsg({ type: "ok", text: "Línea eliminada." }); cargar(); }
    });
  };

  const guardarDiagnostico = () => {
    startTransition(async () => {
      const res = await actualizarDiagnosticoOT(otId, diagnostico, observaciones);
      if (res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: "Diagnóstico guardado." });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!ot) return <p className="text-destructive">OT no encontrada.</p>;

  const totalLineas = lineas.reduce((acc, l) => acc + (l.subtotal || 0), 0);
  const transicionesDisponibles = ESTADOS_TRANSICION[ot.estado] || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <Link href="/admin/ordenes">
            <Button variant="ghost" size="icon" className="mt-0.5">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono" style={{ fontFamily: "var(--font-heading)" }}>
                OT-{String(ot.numero).padStart(4, "0")}
              </h1>
              <Badge variant="secondary" className={`${ESTADO_OT_COLORS[ot.estado]}`}>
                {ESTADO_OT_LABELS[ot.estado]}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {TIPO_OT_LABELS[ot.tipo]}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Entrada: {formatDateTime(ot.fecha_entrada)}
              {ot.fecha_prometida && ` · Prometido: ${formatDate(ot.fecha_prometida)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ot.estado === "completado" && (
            <Link href={`/admin/facturacion/nueva?ot=${otId}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                Generar Factura
              </Button>
            </Link>
          )}
          {transicionesDisponibles.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={isPending}>
                Cambiar Estado
                <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {transicionesDisponibles.map((e) => (
                  <DropdownMenuItem key={e} onClick={() => cambiarEstado(e)}>
                    {ESTADO_OT_LABELS[e]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
          msg.type === "ok"
            ? "bg-green-500/10 text-green-700 dark:text-green-400"
            : "bg-destructive/10 text-destructive"
        }`}>
          {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cliente</span>
            </div>
            <p className="font-medium">{ot.perfiles?.nombre} {ot.perfiles?.apellido}</p>
            {ot.perfiles?.telefono && (
              <p className="text-sm text-muted-foreground">{ot.perfiles.telefono}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vehículo</span>
            </div>
            <p className="font-medium">
              {ot.vehiculos?.marca} {ot.vehiculos?.modelo} {ot.vehiculos?.anio}
            </p>
            <p className="text-sm font-mono text-muted-foreground">{ot.vehiculos?.placa}</p>
            {ot.km_entrada && (
              <p className="text-xs text-muted-foreground">KM: {formatKm(ot.km_entrada)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total estimado</span>
            </div>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalLineas)}</p>
            <p className="text-xs text-muted-foreground">{lineas.length} líneas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="servicios">
        <TabsList className="mb-6">
          <TabsTrigger value="servicios">Servicios y Repuestos</TabsTrigger>
          <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        {/* TAB: Servicios y Repuestos */}
        <TabsContent value="servicios">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">P. Unit.</TableHead>
                      <TableHead className="text-right">Desc.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Sin líneas. Agrega servicios o repuestos.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lineas.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <p className="text-sm">{l.descripcion}</p>
                            {l.notas && <p className="text-xs text-muted-foreground">{l.notas}</p>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{l.tipo}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">{l.cantidad}</TableCell>
                          <TableCell className="text-right text-sm">{formatCurrency(l.precio_unitario)}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {l.descuento_pct > 0 ? `${l.descuento_pct}%` : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatCurrency(l.subtotal)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-muted-foreground hover:text-destructive"
                              onClick={() => eliminarLinea(l.id)}
                              disabled={isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {lineas.length > 0 && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={5} className="text-right font-semibold text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(totalLineas)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Agregar línea */}
            {!["entregado", "cancelado", "facturado"].includes(ot.estado) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Agregar línea
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    action={async (fd) => {
                      fd.append("ot_id", otId);
                      startTransition(async () => {
                        const res = await agregarLineaOT({}, fd);
                        if (res.error) setMsg({ type: "err", text: res.error });
                        else { setMsg({ type: "ok", text: "Línea agregada." }); cargar(); }
                      });
                    }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3"
                  >
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Descripción *</Label>
                      <Input name="descripcion" placeholder="Ej: Cambio de aceite 5W-30" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <Select name="tipo" defaultValue="servicio">
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="servicio">Servicio</SelectItem>
                          <SelectItem value="repuesto">Repuesto</SelectItem>
                          <SelectItem value="mano_obra">Mano de obra</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cantidad</Label>
                      <Input name="cantidad" type="number" step="0.001" defaultValue="1" min="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Precio unitario</Label>
                      <Input name="precio_unitario" type="number" step="0.01" placeholder="0.00" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Desc. %</Label>
                      <Input name="descuento_pct" type="number" step="0.01" defaultValue="0" min="0" max="100" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Repuesto (opcional)</Label>
                      <Select name="repuesto_id">
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Vincular repuesto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Ninguno</SelectItem>
                          {repuestos.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.nombre} {r.codigo ? `(${r.codigo})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-end">
                      <Button type="submit" size="sm" disabled={isPending} className="w-full">
                        {isPending ? "Agregando..." : "Agregar"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* TAB: Diagnóstico */}
        <TabsContent value="diagnostico">
          <Card>
            <CardContent className="p-6 space-y-4">
              {ot.descripcion && (
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">SÍNTOMA DEL CLIENTE</p>
                  <p className="text-sm">{ot.descripcion}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Diagnóstico técnico</Label>
                <Textarea
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  placeholder="Diagnóstico realizado por el técnico..."
                  rows={4}
                  disabled={["entregado", "cancelado"].includes(ot.estado)}
                />
              </div>
              <div className="space-y-2">
                <Label>Observaciones internas</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas internas del taller..."
                  rows={3}
                  disabled={["entregado", "cancelado"].includes(ot.estado)}
                />
              </div>
              {!["entregado", "cancelado"].includes(ot.estado) && (
                <Button onClick={guardarDiagnostico} disabled={isPending}>
                  Guardar diagnóstico
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Historial */}
        <TabsContent value="historial">
          <Card>
            <CardContent className="p-6">
              {historial.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sin historial</p>
              ) : (
                <div className="space-y-4">
                  {historial.map((h) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                        <div className="w-px flex-1 bg-border mt-1" />
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2">
                          {h.estado_ant && (
                            <>
                              <Badge variant="outline" className={`text-xs ${ESTADO_OT_COLORS[h.estado_ant]}`}>
                                {ESTADO_OT_LABELS[h.estado_ant]}
                              </Badge>
                              <span className="text-muted-foreground text-xs">→</span>
                            </>
                          )}
                          <Badge variant="secondary" className={`text-xs ${ESTADO_OT_COLORS[h.estado_new]}`}>
                            {ESTADO_OT_LABELS[h.estado_new]}
                          </Badge>
                        </div>
                        {h.nota && <p className="text-sm mt-1">{h.nota}</p>}
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(h.created_at)}
                            {h.perfiles && ` · ${h.perfiles.nombre} ${h.perfiles.apellido}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, CreditCard, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import {
  formatDate, formatDateTime, formatCurrency,
  ESTADO_FACTURA_LABELS, ESTADO_FACTURA_COLORS, METODO_PAGO_LABELS,
} from "@/lib/utils";
import { registrarPago } from "@/lib/actions/erp";

export default function FacturaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [factura, setFactura] = useState<any>(null);
  const [lineas, setLineas] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mostrarPago, setMostrarPago] = useState(false);
  const supabase = createClient();

  const cargar = async () => {
    const [facRes, linRes, pagRes] = await Promise.all([
      supabase
        .from("facturas")
        .select(`
          *,
          perfiles!facturas_cliente_id_fkey(nombre, apellido, cedula, telefono),
          ordenes_trabajo(numero)
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("factura_lineas")
        .select("*")
        .eq("factura_id", id)
        .order("id"),
      supabase
        .from("pagos")
        .select("*, perfiles(nombre)")
        .eq("factura_id", id)
        .order("fecha", { ascending: false }),
    ]);
    setFactura(facRes.data);
    setLineas(linRes.data || []);
    setPagos(pagRes.data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [id]);

  const totalPagado = pagos.reduce((acc, p) => acc + (p.monto || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!factura) return <p className="text-destructive">Factura no encontrada.</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/facturacion">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">
                {factura.numero}
              </h1>
              <Badge
                variant="secondary"
                className={ESTADO_FACTURA_COLORS[factura.estado]}
              >
                {ESTADO_FACTURA_LABELS[factura.estado]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Emitida: {formatDate(factura.fecha_emision)}
              {(factura.ordenes_trabajo as any)?.numero && (
                ` · OT-${String((factura.ordenes_trabajo as any).numero).padStart(4, "0")}`
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/pdf/factura/${id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </a>
          {factura.estado !== "pagada" && factura.estado !== "anulada" && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setMostrarPago(!mostrarPago)}
            >
              <CreditCard className="w-4 h-4" />
              Registrar cobro
            </Button>
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

      {/* Formulario de pago */}
      {mostrarPago && (
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Registrar cobro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (fd) => {
                fd.append("factura_id", id);
                startTransition(async () => {
                  const res = await registrarPago({}, fd);
                  if (res.error) setMsg({ type: "err", text: res.error });
                  else {
                    setMsg({ type: "ok", text: res.success || "Pago registrado." });
                    setMostrarPago(false);
                    cargar();
                  }
                });
              }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <div className="space-y-1">
                <Label className="text-xs">Monto *</Label>
                <Input
                  name="monto"
                  type="number"
                  step="0.01"
                  defaultValue={(factura.total - totalPagado).toFixed(2)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Método *</Label>
                <Select name="metodo" required defaultValue="efectivo">
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METODO_PAGO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Referencia</Label>
                <Input name="referencia" placeholder="Nº transacción..." />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" size="sm" disabled={isPending} className="flex-1">
                  {isPending ? "..." : "Cobrar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrarPago(false)}
                >
                  ×
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Datos del cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{factura.perfiles?.nombre} {factura.perfiles?.apellido}</p>
              {factura.perfiles?.cedula && (
                <p className="text-sm text-muted-foreground">CI: {factura.perfiles.cedula}</p>
              )}
              {factura.perfiles?.telefono && (
                <p className="text-sm text-muted-foreground">{factura.perfiles.telefono}</p>
              )}
              <Badge variant="outline" className="mt-2 text-xs capitalize">{factura.sucursal}</Badge>
            </CardContent>
          </Card>

          {/* Detalle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detalle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lineas.map((l) => (
                <div key={l.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-56">
                    {l.descripcion} × {l.cantidad}
                  </span>
                  <span>{formatCurrency(l.subtotal)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(factura.subtotal)}</span>
                </div>
                {factura.descuento > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(factura.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA {factura.iva_pct}%</span>
                  <span>{formatCurrency(factura.iva_valor)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(factura.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cobros registrados</CardTitle>
          </CardHeader>
          <CardContent>
            {pagos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin cobros aún</p>
            ) : (
              <div className="space-y-3">
                {pagos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{METODO_PAGO_LABELS[p.metodo] || p.metodo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(p.fecha)}
                        {p.referencia && ` · ${p.referencia}`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      +{formatCurrency(p.monto)}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between font-semibold text-sm pt-2">
                  <span>Total cobrado</span>
                  <span className="text-primary">{formatCurrency(totalPagado)}</span>
                </div>
                {totalPagado < factura.total && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Saldo pendiente</span>
                    <span>{formatCurrency(factura.total - totalPagado)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

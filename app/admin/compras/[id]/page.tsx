"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle2, PackageCheck } from "lucide-react";
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
import { formatDate, formatCurrency } from "@/lib/utils";
import { recibirCompra } from "@/lib/actions/erp";

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  recibida: "bg-green-500/20 text-green-600 dark:text-green-400",
  parcial: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  cancelada: "bg-red-500/20 text-red-600 dark:text-red-400",
};

export default function CompraDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [compra, setCompra] = useState<any>(null);
  const [lineas, setLineas] = useState<any[]>([]);
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const cargar = async () => {
    const [compRes, linRes, repRes] = await Promise.all([
      supabase
        .from("compras")
        .select("*, proveedores(nombre, ruc, telefono, email)")
        .eq("id", id)
        .single(),
      supabase
        .from("compra_lineas")
        .select("*, repuestos(nombre, codigo, unidad)")
        .eq("compra_id", id),
      supabase.from("repuestos").select("id, nombre, codigo, precio_costo, unidad").eq("activo", true),
    ]);
    setCompra(compRes.data);
    setLineas(linRes.data || []);
    setRepuestos(repRes.data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [id]);

  const agregarLinea = async (fd: FormData) => {
    fd.append("compra_id", id);
    const repuesto_id = fd.get("repuesto_id") as string;
    const cantidad = parseFloat(fd.get("cantidad") as string) || 0;
    const precio_unitario = parseFloat(fd.get("precio_unitario") as string) || 0;
    const subtotal = cantidad * precio_unitario;

    const { error } = await supabase.from("compra_lineas").insert({
      compra_id: id,
      repuesto_id,
      cantidad,
      precio_unitario,
      subtotal,
    });

    if (error) setMsg({ type: "err", text: "Error al agregar línea." });
    else { setMsg({ type: "ok", text: "Línea agregada." }); cargar(); }
  };

  const eliminarLinea = async (lineaId: string) => {
    await supabase.from("compra_lineas").delete().eq("id", lineaId);
    cargar();
  };

  const recibir = () => {
    startTransition(async () => {
      const res = await recibirCompra(id);
      if (res.error) setMsg({ type: "err", text: res.error });
      else { setMsg({ type: "ok", text: res.success || "Recibida." }); cargar(); }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!compra) return <p className="text-destructive">Compra no encontrada.</p>;

  const total = lineas.reduce((acc, l) => acc + ((l.cantidad || 0) * (l.precio_unitario || 0)), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/compras">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{compra.numero}</h1>
              <Badge variant="secondary" className={ESTADO_COLORS[compra.estado]}>
                {compra.estado}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {(compra.proveedores as any)?.nombre} · {formatDate(compra.fecha)}
              {compra.fecha_esperada && ` · Esperado: ${formatDate(compra.fecha_esperada)}`}
            </p>
          </div>
        </div>
        {compra.estado === "pendiente" && lineas.length > 0 && (
          <Button
            size="sm"
            className="gap-2"
            onClick={recibir}
            disabled={isPending}
          >
            <PackageCheck className="w-4 h-4" />
            Marcar como recibida
          </Button>
        )}
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-2 rounded-md text-sm flex items-center gap-2 ${
          msg.type === "ok"
            ? "bg-green-500/10 text-green-700 dark:text-green-400"
            : "bg-destructive/10 text-destructive"
        }`}>
          {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : null}
          {msg.text}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repuesto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">P. Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  {compra.estado === "pendiente" && <TableHead className="w-8" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={compra.estado === "pendiente" ? 5 : 4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Agrega repuestos a la orden de compra
                    </TableCell>
                  </TableRow>
                ) : (
                  lineas.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{(l.repuestos as any)?.nombre}</p>
                        {(l.repuestos as any)?.codigo && (
                          <p className="text-xs font-mono text-muted-foreground">
                            {(l.repuestos as any).codigo}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {l.cantidad} {(l.repuestos as any)?.unidad}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(l.precio_unitario)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {formatCurrency(l.cantidad * l.precio_unitario)}
                      </TableCell>
                      {compra.estado === "pendiente" && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-destructive"
                            onClick={() => eliminarLinea(l.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
                {lineas.length > 0 && (
                  <TableRow className="bg-muted/30">
                    <TableCell
                      colSpan={compra.estado === "pendiente" ? 3 : 3}
                      className="text-right font-semibold text-sm"
                    >
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(total)}
                    </TableCell>
                    {compra.estado === "pendiente" && <TableCell />}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {compra.estado === "pendiente" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Agregar repuesto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={async (fd) => {
                  startTransition(async () => await agregarLinea(fd));
                }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Repuesto *</Label>
                  <Select name="repuesto_id" required>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Seleccionar repuesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {repuestos.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.nombre} {r.codigo ? `(${r.codigo})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cantidad *</Label>
                  <Input name="cantidad" type="number" step="0.001" min="0" defaultValue="1" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Precio unitario *</Label>
                  <Input name="precio_unitario" type="number" step="0.01" min="0" placeholder="0.00" required />
                </div>
                <div className="col-span-2 md:col-span-4">
                  <Button type="submit" size="sm" disabled={isPending}>
                    Agregar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

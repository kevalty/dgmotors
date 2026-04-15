"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Cuenta {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
}

interface Linea {
  cuenta_id: string;
  descripcion: string;
  debe: string;
  haber: string;
}

const lineaVacia = (): Linea => ({ cuenta_id: "", descripcion: "", debe: "", haber: "" });

export default function NuevoAsientoPage() {
  const router = useRouter();
  const [cuentas, setCuentas]   = useState<Cuenta[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState("");
  const [ok,      setOk]        = useState(false);
  const [lineas,  setLineas]    = useState<Linea[]>([lineaVacia(), lineaVacia()]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("plan_cuentas")
      .select("id, codigo, nombre, tipo")
      .eq("permite_mov", true)
      .eq("activa", true)
      .order("codigo")
      .then(({ data }) => setCuentas(data || []));
  }, []);

  const totalDebe  = lineas.reduce((s, l) => s + (parseFloat(l.debe)  || 0), 0);
  const totalHaber = lineas.reduce((s, l) => s + (parseFloat(l.haber) || 0), 0);
  const cuadrado   = Math.abs(totalDebe - totalHaber) < 0.001 && totalDebe > 0;

  const agregarLinea = () => setLineas(prev => [...prev, lineaVacia()]);

  const eliminarLinea = (i: number) =>
    setLineas(prev => prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev);

  const actualizarLinea = (i: number, campo: keyof Linea, valor: string) =>
    setLineas(prev => prev.map((l, idx) => idx === i ? { ...l, [campo]: valor } : l));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cuadrado) {
      setError("El asiento no cuadra. Débito debe ser igual a Crédito.");
      return;
    }

    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    const supabase = createClient();

    // 1. Insertar asiento
    const { data: asiento, error: aErr } = await supabase
      .from("asientos_contables")
      .insert({
        fecha:       fd.get("fecha") as string,
        descripcion: fd.get("descripcion") as string,
        tipo:        "manual",
      })
      .select("id")
      .single();

    if (aErr || !asiento) {
      setError("Error al crear el asiento: " + (aErr?.message || ""));
      setLoading(false);
      return;
    }

    // 2. Insertar líneas
    const lineasInsert = lineas
      .filter(l => l.cuenta_id)
      .map(l => ({
        asiento_id:  asiento.id,
        cuenta_id:   l.cuenta_id,
        descripcion: l.descripcion || null,
        debe:        parseFloat(l.debe)  || 0,
        haber:       parseFloat(l.haber) || 0,
      }));

    const { error: lErr } = await supabase.from("asiento_lineas").insert(lineasInsert);

    setLoading(false);
    if (lErr) {
      setError("Asiento creado pero error en líneas: " + lErr.message);
    } else {
      setOk(true);
      setTimeout(() => router.push(`/admin/contabilidad/asientos/${asiento.id}`), 1000);
    }
  };

  const fmt = (n: number) => `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/contabilidad/asientos">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Nuevo Asiento Contable
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Partida doble — Débito = Crédito</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}
        {ok && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />Asiento guardado. Redirigiendo...
          </div>
        )}

        {/* Datos generales */}
        <Card>
          <CardHeader><CardTitle className="text-base">Datos del Asiento</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha" name="fecha" type="date" required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea id="descripcion" name="descripcion" rows={2} required
                placeholder="Descripción del asiento contable..." />
            </div>
          </CardContent>
        </Card>

        {/* Líneas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Líneas del Asiento</span>
              <div className="flex items-center gap-3 text-xs font-normal">
                <span className={totalDebe  > 0 ? "text-foreground" : "text-muted-foreground"}>
                  Débito: <strong>{fmt(totalDebe)}</strong>
                </span>
                <span className={totalHaber > 0 ? "text-foreground" : "text-muted-foreground"}>
                  Crédito: <strong>{fmt(totalHaber)}</strong>
                </span>
                {cuadrado && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />Cuadrado
                  </span>
                )}
                {!cuadrado && totalDebe > 0 && (
                  <span className="text-destructive">
                    Diferencia: {fmt(Math.abs(totalDebe - totalHaber))}
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-y">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Cuenta *</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Descripción</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-28">Débito</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-28">Crédito</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lineas.map((l, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">
                      <Select value={l.cuenta_id} onValueChange={v => actualizarLinea(i, "cuenta_id", v ?? "")}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleccionar cuenta..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cuentas.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="font-mono text-xs mr-2">{c.codigo}</span>
                              {c.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        className="h-8 text-xs"
                        placeholder="Concepto..."
                        value={l.descripcion}
                        onChange={e => actualizarLinea(i, "descripcion", e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        className="h-8 text-xs font-mono"
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={l.debe}
                        onChange={e => {
                          actualizarLinea(i, "debe", e.target.value);
                          if (parseFloat(e.target.value) > 0) actualizarLinea(i, "haber", "");
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        className="h-8 text-xs font-mono"
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={l.haber}
                        onChange={e => {
                          actualizarLinea(i, "haber", e.target.value);
                          if (parseFloat(e.target.value) > 0) actualizarLinea(i, "debe", "");
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button" variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => eliminarLinea(i)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={agregarLinea} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />Agregar línea
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/admin/contabilidad/asientos">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading || ok || !cuadrado} className="gap-1.5">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Guardando..." : "Guardar Asiento"}
          </Button>
        </div>
      </form>
    </div>
  );
}

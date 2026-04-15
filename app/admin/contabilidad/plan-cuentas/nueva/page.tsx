"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const TIPOS = ["activo","pasivo","patrimonio","ingreso","gasto","costo"] as const;

export default function NuevaCuentaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [ok,      setOk]      = useState(false);

  const [tipo,       setTipo]       = useState("");
  const [permiteMov, setPermiteMov] = useState(false);
  const [aplicaIva,  setAplicaIva]  = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const codigo = (fd.get("codigo") as string)?.trim();
    const nombre = (fd.get("nombre") as string)?.trim();
    const nivel  = parseInt(fd.get("nivel") as string) || 1;
    const padreRaw = fd.get("padre_codigo");
    const padre    = typeof padreRaw === "string" ? padreRaw.trim() || null : null;

    if (!codigo || !nombre || !tipo) {
      setError("Código, nombre y tipo son obligatorios");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Resolver padre_id desde código
    let padre_id = null;
    if (padre) {
      const { data: p } = await supabase
        .from("plan_cuentas").select("id").eq("codigo", padre).single();
      if (!p) {
        setError(`No se encontró la cuenta padre con código "${padre}"`);
        setLoading(false);
        return;
      }
      padre_id = p.id;
    }

    const { error: dbErr } = await supabase.from("plan_cuentas").insert({
      codigo,
      nombre,
      tipo,
      nivel,
      padre_id,
      permite_mov: permiteMov,
      aplica_iva:  aplicaIva,
      activa: true,
    });

    setLoading(false);
    if (dbErr) {
      setError(dbErr.message.includes("unique")
        ? `El código "${codigo}" ya existe`
        : dbErr.message);
    } else {
      setOk(true);
      setTimeout(() => router.push("/admin/contabilidad/plan-cuentas"), 1000);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/contabilidad/plan-cuentas">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Nueva Cuenta Contable
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Agregar cuenta al plan de cuentas</p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Datos de la Cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            {ok && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />Cuenta creada. Redirigiendo...
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="codigo">Código *</Label>
                <Input id="codigo" name="codigo" placeholder="1.1.01.001" required className="font-mono" />
                <p className="text-xs text-muted-foreground">Ej: 1.1.01.001</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nivel">Nivel *</Label>
                <Input id="nivel" name="nivel" type="number" min="1" max="5" defaultValue="4" required />
                <p className="text-xs text-muted-foreground">1=grupo … 5=auxiliar</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" placeholder="Caja General" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="padre_codigo">Código Padre</Label>
                <Input id="padre_codigo" name="padre_codigo" placeholder="1.1.01" className="font-mono" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Permite movimientos</p>
                <p className="text-xs text-muted-foreground">Habilitar para ingresar débitos/créditos</p>
              </div>
              <Switch checked={permiteMov} onCheckedChange={setPermiteMov} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Aplica IVA</p>
                <p className="text-xs text-muted-foreground">Marcar para cuentas de IVA</p>
              </div>
              <Switch checked={aplicaIva} onCheckedChange={setAplicaIva} />
            </div>

            <div className="flex gap-3 pt-2">
              <Link href="/admin/contabilidad/plan-cuentas" className="flex-1">
                <Button type="button" variant="outline" className="w-full">Cancelar</Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading || ok}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? "Guardando..." : "Crear Cuenta"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

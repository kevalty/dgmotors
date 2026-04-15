"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { procesarDepreciacionMensual } from "@/lib/actions/activos";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export default function ProcesarDepreciacionPage() {
  const anioActual = new Date().getFullYear();
  const mesActual  = new Date().getMonth() + 1;

  const [anio, setAnio] = useState(anioActual);
  const [mes,  setMes]  = useState(mesActual);
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleProcesar() {
    setResult(null);
    startTransition(async () => {
      const res = await procesarDepreciacionMensual(anio, mes);
      setResult(res);
    });
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/activos">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Procesar Depreciación</h1>
          <p className="text-muted-foreground text-sm">Calcular y registrar la depreciación mensual de todos los activos activos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seleccionar Período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Año</label>
              <Select value={String(anio)} onValueChange={(v) => v && setAnio(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((a) => (
                    <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Mes</label>
              <Select value={String(mes)} onValueChange={(v) => v && setMes(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
            <p className="font-medium">¿Qué hace este proceso?</p>
            <ul className="text-muted-foreground space-y-0.5 text-xs list-disc list-inside">
              <li>Calcula la depreciación mensual de cada activo activo</li>
              <li>Actualiza la depreciación acumulada de cada activo</li>
              <li>Genera un asiento contable automático (Gasto Dep. / Dep. Acumulada)</li>
              <li>Solo puede ejecutarse una vez por período</li>
            </ul>
          </div>

          {result?.error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {result.error}
            </div>
          )}
          {result?.success && (
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm bg-green-50 dark:bg-green-950 px-3 py-2 rounded">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {result.success}
            </div>
          )}

          <Button
            onClick={handleProcesar}
            disabled={isPending}
            className="w-full"
          >
            {isPending
              ? "Procesando..."
              : `Procesar Depreciación — ${MESES[mes - 1]} ${anio}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Save, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { guardarChecklistOT } from "@/lib/actions/erp";

// ────────── Estructura del checklist ──────────
interface CheckItem {
  id: string;
  label: string;
  group: string;
}

const ITEMS: CheckItem[] = [
  // Documentación
  { id: "tarjeta_circulacion", label: "Tarjeta de circulación", group: "Documentación" },
  { id: "soat",                label: "SOAT vigente",           group: "Documentación" },
  { id: "revision_tecnica",    label: "Revisión técnica",       group: "Documentación" },
  // Carrocería
  { id: "golpe_frontal",       label: "Golpe frontal",          group: "Carrocería" },
  { id: "golpe_trasero",       label: "Golpe trasero",          group: "Carrocería" },
  { id: "golpe_lateral_izq",   label: "Golpe lateral izq.",     group: "Carrocería" },
  { id: "golpe_lateral_der",   label: "Golpe lateral der.",     group: "Carrocería" },
  { id: "rayones",             label: "Rayones / arañazos",     group: "Carrocería" },
  { id: "vidrios_ok",          label: "Vidrios sin daños",      group: "Carrocería" },
  // Interior
  { id: "tapiceria_ok",        label: "Tapicería en buen estado",  group: "Interior" },
  { id: "tablero_ok",          label: "Tablero sin daños",         group: "Interior" },
  { id: "radio_ok",            label: "Radio / pantalla",          group: "Interior" },
  { id: "airbag_ok",           label: "Airbag sin testigo",        group: "Interior" },
  // Niveles / fluidos
  { id: "nivel_combustible",   label: "Combustible ≥ ¼",          group: "Niveles" },
  { id: "nivel_aceite",        label: "Aceite en nivel",           group: "Niveles" },
  { id: "nivel_refrigerante",  label: "Refrigerante en nivel",     group: "Niveles" },
  { id: "nivel_frenos",        label: "Líquido de frenos",         group: "Niveles" },
  // Accesorios
  { id: "gata",                label: "Gata hidráulica",           group: "Accesorios" },
  { id: "llanta_repuesto",     label: "Llanta de repuesto",        group: "Accesorios" },
  { id: "herramientas",        label: "Herramientas básicas",      group: "Accesorios" },
  { id: "extintor",            label: "Extintor",                  group: "Accesorios" },
  { id: "chaleco",             label: "Chaleco / triángulos",      group: "Accesorios" },
];

const GROUPS = [...new Set(ITEMS.map((i) => i.group))];

type ChecklistValues = Record<string, boolean | null>; // true=OK, false=Daño, null=N/A

interface Props {
  otId: string;
  initial?: Record<string, any>;
  readonly?: boolean;
}

export function ChecklistRecepcion({ otId, initial = {}, readonly = false }: Props) {
  const [open, setOpen] = useState(!readonly);
  const [values, setValues] = useState<ChecklistValues>(() => {
    const v: ChecklistValues = {};
    for (const item of ITEMS) {
      v[item.id] = initial[item.id] ?? null;
    }
    return v;
  });
  const [observaciones, setObservaciones] = useState<string>(initial.observaciones || "");
  const [kmEntrada] = useState<string>(initial.km_entrada || "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) => {
    if (readonly) return;
    setValues((prev) => {
      const cur = prev[id];
      // null → true → false → null
      const next = cur === null ? true : cur === true ? false : null;
      return { ...prev, [id]: next };
    });
  };

  const getIcon = (val: boolean | null) => {
    if (val === true)  return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (val === false) return <Circle className="w-4 h-4 text-red-500 fill-red-500/20" />;
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };

  const getBg = (val: boolean | null) => {
    if (val === true)  return "bg-green-500/10 border-green-500/20";
    if (val === false) return "bg-red-500/10 border-red-500/20";
    return "border-transparent";
  };

  const conDaño = Object.values(values).filter(v => v === false).length;
  const completados = Object.values(values).filter(v => v !== null).length;

  const guardar = () => {
    startTransition(async () => {
      const res = await guardarChecklistOT(otId, { ...values, observaciones });
      setMsg({ ok: !res.error, text: res.error || res.success || "Guardado" });
      setTimeout(() => setMsg(null), 3000);
    });
  };

  return (
    <Card className={conDaño > 0 ? "border-red-500/20" : ""}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            Checklist de recepción
            {conDaño > 0 && (
              <span className="text-xs font-normal text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">
                {conDaño} daño{conDaño > 1 ? "s" : ""}
              </span>
            )}
            {completados > 0 && conDaño === 0 && (
              <span className="text-xs font-normal text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                {completados}/{ITEMS.length}
              </span>
            )}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          {!readonly && (
            <p className="text-xs text-muted-foreground">
              Click para marcar: sin color = N/A · <span className="text-green-600">verde = OK</span> · <span className="text-red-500">rojo = daño/faltante</span>
            </p>
          )}

          {GROUPS.map((group) => (
            <div key={group}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ITEMS.filter((i) => i.group === group).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={readonly}
                    onClick={() => toggle(item.id)}
                    className={`flex items-center gap-2 p-2 rounded-md border text-left transition-colors text-sm ${getBg(values[item.id])} ${!readonly ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
                  >
                    {getIcon(values[item.id])}
                    <span className="leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-1">
            <Label className="text-xs">Observaciones adicionales</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Descripción de daños, accesorios adicionales, notas del cliente..."
              rows={3}
              readOnly={readonly}
            />
          </div>

          {!readonly && (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={guardar}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isPending ? "Guardando..." : "Guardar checklist"}
              </Button>
              {msg && (
                <p className={`text-sm ${msg.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                  {msg.text}
                </p>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

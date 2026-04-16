"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { actualizarEstadoProspecto } from "@/lib/actions/ventas";

const ESTADO_COLORS: Record<string, string> = {
  nuevo:       "bg-slate-500/20 text-slate-700 dark:text-slate-300",
  contactado:  "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  interesado:  "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  propuesta:   "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  negociacion: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  cerrado:     "bg-green-500/20 text-green-700 dark:text-green-400",
  perdido:     "bg-red-500/20 text-red-700 dark:text-red-400",
};

const ESTADOS = ["nuevo","contactado","interesado","propuesta","negociacion","cerrado","perdido"];

interface Props {
  prospectoId: string;
  estadoActual: string;
}

export function CambiarEstadoProspecto({ prospectoId, estadoActual }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={estadoActual}
      onValueChange={(v) => {
        if (!v || v === estadoActual) return;
        startTransition(async () => { await actualizarEstadoProspecto(prospectoId, v); });
      }}
      disabled={isPending}
    >
      <SelectTrigger className="h-7 w-36 text-xs border-0 bg-transparent p-0 focus:ring-0">
        <Badge
          variant="secondary"
          className={`text-xs capitalize w-full justify-center ${ESTADO_COLORS[estadoActual]}`}
        >
          {isPending ? "..." : estadoActual}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {ESTADOS.map((e) => (
          <SelectItem key={e} value={e} className="text-xs capitalize">
            <Badge variant="secondary" className={`text-xs capitalize ${ESTADO_COLORS[e]}`}>
              {e}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

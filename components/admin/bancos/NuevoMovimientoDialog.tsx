"use client";

import { useState, useActionState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registrarMovimiento } from "@/lib/actions/bancos";
import type { BancosState } from "@/lib/actions/bancos";

interface Props {
  bancoId: string;
  bancoNombre: string;
}

const TIPOS_MOVIMIENTO = [
  { value: "deposito",               label: "Depósito" },
  { value: "retiro",                 label: "Retiro" },
  { value: "transferencia_entrada",  label: "Transferencia (Entrada)" },
  { value: "transferencia_salida",   label: "Transferencia (Salida)" },
  { value: "nota_credito",           label: "Nota de Crédito" },
  { value: "nota_debito",            label: "Nota de Débito" },
];

export function NuevoMovimientoDialog({ bancoId, bancoNombre }: Props) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("deposito");
  const [asiento, setAsiento] = useState(false);
  const [state, formAction, isPending] = useActionState(
    registrarMovimiento,
    {} as BancosState
  );

  function handleAction(formData: FormData) {
    formData.set("banco_id", bancoId);
    formData.set("tipo", tipo);
    formData.set("generar_asiento", asiento ? "true" : "false");
    formAction(formData);
    if (!state?.error) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus className="w-4 h-4" />
        Registrar Movimiento
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Movimiento — {bancoNombre}</DialogTitle>
        </DialogHeader>

        <form action={handleAction} className="space-y-4 mt-2">
          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha *</Label>
            <Input
              id="fecha"
              name="fecha"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo de Movimiento *</Label>
            <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_MOVIMIENTO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Concepto */}
          <div className="space-y-1.5">
            <Label htmlFor="concepto">Concepto *</Label>
            <Input
              id="concepto"
              name="concepto"
              placeholder="Descripción del movimiento..."
              required
            />
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <Label htmlFor="monto">Monto ($) *</Label>
            <Input
              id="monto"
              name="monto"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
            />
          </div>

          {/* Referencia */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="referencia">Referencia</Label>
              <Input id="referencia" name="referencia" placeholder="Número de doc..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="beneficiario">Beneficiario</Label>
              <Input id="beneficiario" name="beneficiario" placeholder="Nombre..." />
            </div>
          </div>

          {/* Generar asiento */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="generar_asiento"
              type="checkbox"
              checked={asiento}
              onChange={(e) => setAsiento(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <Label htmlFor="generar_asiento" className="font-normal text-sm cursor-pointer">
              Generar asiento contable automático
            </Label>
          </div>

          {state?.error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 px-3 py-2 rounded">
              {state.success}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Registrar Movimiento"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

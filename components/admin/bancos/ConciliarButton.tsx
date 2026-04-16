"use client";

import { useTransition } from "react";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { conciliarMovimiento, desconciliarMovimiento } from "@/lib/actions/bancos";

interface Props {
  movimientoId: string;
  conciliado: boolean;
}

export function ConciliarButton({ movimientoId, conciliado }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (conciliado) {
        await desconciliarMovimiento(movimientoId);
      } else {
        await conciliarMovimiento(movimientoId);
      }
    });
  }

  if (isPending) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={handleClick}
      title={conciliado ? "Desmarcar conciliación" : "Marcar como conciliado"}
    >
      {conciliado ? (
        <span className="text-green-600 dark:text-green-400">Conciliado</span>
      ) : (
        <span className="text-amber-600 dark:text-amber-400">Conciliar</span>
      )}
    </Button>
  );
}

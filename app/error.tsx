"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Algo salió mal</h2>
      <p className="text-muted-foreground mb-6 max-w-sm text-sm">
        Ocurrió un error inesperado. Intenta recargar la página.
      </p>
      <Button onClick={reset} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </Button>
    </div>
  );
}

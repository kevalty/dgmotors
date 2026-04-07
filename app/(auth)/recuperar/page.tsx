"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

const initialState: AuthState = {};

export default function RecuperarPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, initialState);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
        <CardDescription>
          Te enviaremos un link para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {state.success}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isPending ? "Enviando..." : "Enviar Link"}
          </Button>
        </form>

        <Link
          href="/login"
          className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al login
        </Link>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useRef, useTransition } from "react";
import { Camera, X, Upload, ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subirFotoOT, eliminarFotoOT } from "@/lib/actions/erp";

interface Props {
  otId: string;
  tipo: "entrada" | "salida";
  fotosIniciales: string[];
  readonly?: boolean;
}

export function FotosOT({ otId, tipo, fotosIniciales, readonly = false }: Props) {
  const [fotos, setFotos] = useState<string[]>(fotosIniciales);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setMsg(null);

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setMsg("Máximo 5 MB por foto");
        continue;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ot_id", otId);
      formData.append("tipo", tipo);

      const res = await subirFotoOT(formData);
      if (res.url) {
        setFotos((prev) => [...prev, res.url!]);
      } else if (res.error) {
        setMsg(res.error);
      }
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const eliminar = (url: string) => {
    startTransition(async () => {
      const res = await eliminarFotoOT(otId, tipo, url);
      if (!res.error) {
        setFotos((prev) => prev.filter((f) => f !== url));
      } else {
        setMsg(res.error);
      }
    });
  };

  const label = tipo === "entrada" ? "Fotos de entrada" : "Fotos de salida";

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            {label}
            {fotos.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {fotos.length}
              </span>
            )}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent>
          {fotos.length === 0 && readonly ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin fotos registradas</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
              {fotos.map((url) => (
                <div key={url} className="relative group aspect-square">
                  <img
                    src={url}
                    alt="Foto OT"
                    className="w-full h-full object-cover rounded-lg border border-border"
                  />
                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => eliminar(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          )}

          {!readonly && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="gap-2 w-full"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 animate-bounce" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    Agregar fotos
                  </>
                )}
              </Button>
              {msg && <p className="text-xs text-destructive mt-2">{msg}</p>}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

import { createClient } from "@/lib/supabase/server";

export interface DatosVehiculoANT {
  placa:       string;
  marca:       string;
  modelo:      string;
  anio:        number;
  color:       string;
  propietario: string;
  cedula:      string;
  tipo:        string;
}

/**
 * Consulta datos de un vehículo por placa (Ecuador).
 * Primero revisa la tabla ant_cache — si existe y no expiró, devuelve cache.
 * Si no, llama a la API externa, guarda en cache y devuelve los datos.
 */
export async function consultarPlacaANT(placa: string): Promise<DatosVehiculoANT | null> {
  const placaNorm = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!placaNorm) return null;

  const supabase = await createClient();

  // 1. Buscar en cache
  const { data: cached } = await supabase
    .from("ant_cache")
    .select("datos, expira")
    .eq("placa", placaNorm)
    .single();

  if (cached && new Date(cached.expira) > new Date()) {
    return cached.datos as DatosVehiculoANT;
  }

  // 2. Llamar API externa
  const datos = await fetchANTExterno(placaNorm);
  if (!datos) return null;

  // 3. Guardar o actualizar cache (upsert)
  await supabase.from("ant_cache").upsert({
    placa:      placaNorm,
    datos,
    consultado: new Date().toISOString(),
    expira:     new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return datos;
}

/**
 * Llama a la API externa de consulta de placas.
 * Intenta múltiples proveedores en orden.
 */
async function fetchANTExterno(placa: string): Promise<DatosVehiculoANT | null> {
  // Proveedor 1: consultaplaca.com.ec
  try {
    const apiUrl = process.env.ANT_API_URL || "https://api.consultaplaca.com.ec";
    const apiKey = process.env.ANT_API_KEY;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(`${apiUrl}/v1/placa/${placa}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const json = await res.json();
      return normalizarRespuestaANT(placa, json);
    }
  } catch {
    // silenciar y probar siguiente
  }

  // Proveedor 2: formato alternativo
  try {
    const res = await fetch(`https://srienlinea.sri.gob.ec/movil-servicios/api/v1.0/matriculacion/placa/${placa}`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = await res.json();
      return normalizarRespuestaSRI(placa, json);
    }
  } catch {
    // silenciar
  }

  // Si ningún proveedor responde, devolver null
  return null;
}

function normalizarRespuestaANT(placa: string, json: Record<string, unknown>): DatosVehiculoANT | null {
  // Mapear según estructura de consultaplaca.com.ec
  // { marca, modelo, anio, color, propietario, cedula, tipo }
  if (!json || typeof json !== "object") return null;

  const get = (keys: string[]): string => {
    for (const k of keys) {
      const val = (json as Record<string, unknown>)[k];
      if (val && typeof val === "string") return val.trim();
    }
    return "";
  };

  const getNum = (keys: string[]): number => {
    for (const k of keys) {
      const val = (json as Record<string, unknown>)[k];
      if (val) return parseInt(String(val)) || 0;
    }
    return 0;
  };

  return {
    placa,
    marca:       get(["marca", "MARCA", "brand"]),
    modelo:      get(["modelo", "MODELO", "model"]),
    anio:        getNum(["anio", "año", "ANIO", "year", "modelo_anio"]),
    color:       get(["color", "COLOR"]),
    propietario: get(["propietario", "PROPIETARIO", "owner", "nombre_propietario"]),
    cedula:      get(["cedula", "CEDULA", "id", "identificacion"]),
    tipo:        normalizarTipo(get(["tipo", "TIPO", "clase", "CLASE"])),
  };
}

function normalizarRespuestaSRI(placa: string, json: Record<string, unknown>): DatosVehiculoANT | null {
  if (!json || typeof json !== "object") return null;

  const v = (json as Record<string, unknown>);
  return {
    placa,
    marca:       String((v.marca || v.MARCA || "")).trim(),
    modelo:      String((v.modelo || v.MODELO || "")).trim(),
    anio:        parseInt(String(v.anio || v.año || 0)) || 0,
    color:       String((v.color || "")).trim(),
    propietario: String((v.propietario || v.nombrePropietario || "")).trim(),
    cedula:      String((v.cedula || v.ruc || "")).trim(),
    tipo:        normalizarTipo(String(v.tipo || v.clase || "")),
  };
}

function normalizarTipo(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("sedan") || t.includes("sedán")) return "sedan";
  if (t.includes("camion") || t.includes("pickup") || t.includes("furgon")) return "pickup";
  if (t.includes("suv") || t.includes("todo") || t.includes("4x4")) return "suv";
  if (t.includes("camioneta")) return "camioneta";
  if (t.includes("furgoneta") || t.includes("van")) return "furgoneta";
  return "otro";
}

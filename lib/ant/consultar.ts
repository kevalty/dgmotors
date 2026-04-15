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
 * Consulta datos de un vehículo por placa (Ecuador — placaapi.ec).
 * Primero revisa ant_cache; si existe y no expiró, devuelve el cache.
 * Si no, llama a la API externa, guarda en cache y retorna los datos.
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
  const datos = await fetchPlacaAPI(placaNorm);
  if (!datos) return null;

  // 3. Guardar / actualizar cache (upsert)
  await supabase.from("ant_cache").upsert({
    placa:      placaNorm,
    datos,
    consultado: new Date().toISOString(),
    expira:     new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return datos;
}

/**
 * Llama a placaapi.ec
 * Endpoint: GET {ANT_API_URL}?placa={placa}&apikey={ANT_API_KEY}
 * Documentación: https://www.placaapi.ec
 */
async function fetchPlacaAPI(placa: string): Promise<DatosVehiculoANT | null> {
  const apiUrl = process.env.ANT_API_URL;
  const apiKey = process.env.ANT_API_KEY;

  if (!apiUrl || !apiKey) {
    console.warn("ANT_API_URL o ANT_API_KEY no configurados en .env.local");
    return null;
  }

  try {
    const url = `${apiUrl}?placa=${encodeURIComponent(placa)}&apikey=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn(`PlacaAPI respondió ${res.status} para placa ${placa}`);
      return null;
    }

    const json = await res.json();
    return normalizarRespuesta(placa, json);
  } catch (err) {
    console.error("Error llamando placaapi.ec:", err);
    return null;
  }
}

/**
 * Normaliza la respuesta de placaapi.ec al formato DatosVehiculoANT.
 * placaapi.ec devuelve algo similar a:
 * { MARCA, MODELO, ANIO, COLOR, PROPIETARIO, CEDULA, CLASE }
 */
function normalizarRespuesta(placa: string, json: unknown): DatosVehiculoANT | null {
  if (!json || typeof json !== "object") return null;

  const j = json as Record<string, unknown>;

  const str = (...keys: string[]): string => {
    for (const k of keys) {
      const v = j[k];
      if (v !== null && v !== undefined && String(v).trim()) return String(v).trim();
    }
    return "";
  };

  const num = (...keys: string[]): number => {
    for (const k of keys) {
      const v = j[k];
      if (v !== null && v !== undefined) {
        const n = parseInt(String(v));
        if (!isNaN(n)) return n;
      }
    }
    return 0;
  };

  const marca  = str("MARCA",  "marca",  "brand", "Marca");
  const modelo = str("MODELO", "modelo", "model", "Modelo");

  // Si no tiene al menos marca, probablemente la placa no existe
  if (!marca && !modelo) return null;

  return {
    placa,
    marca,
    modelo,
    anio:        num("ANIO", "anio", "AÑO", "año", "year", "Anio"),
    color:       str("COLOR",       "color",       "Color"),
    propietario: str("PROPIETARIO", "propietario", "NOMBRE", "nombre", "owner"),
    cedula:      str("CEDULA",      "cedula",      "CI",     "ruc",    "identificacion"),
    tipo:        normalizarTipo(str("CLASE", "clase", "TIPO", "tipo", "type")),
  };
}

function normalizarTipo(raw: string): string {
  const t = raw.toLowerCase();
  if (t.includes("sedan") || t.includes("sedán")) return "sedan";
  if (t.includes("pickup"))                        return "pickup";
  if (t.includes("camioneta"))                     return "camioneta";
  if (t.includes("suv") || t.includes("4x4") || t.includes("todo terreno")) return "suv";
  if (t.includes("furgon") || t.includes("van"))   return "furgoneta";
  return "otro";
}

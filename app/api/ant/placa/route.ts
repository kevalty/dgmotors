import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consultarPlacaANT } from "@/lib/ant/consultar";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ placa?: string }> }
) {
  try {
    // Auth requerida
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Placa desde query param
    const placa = req.nextUrl.searchParams.get("placa");
    if (!placa || placa.trim().length < 3) {
      return NextResponse.json({ error: "Placa inválida" }, { status: 400 });
    }

    const datos = await consultarPlacaANT(placa.trim());

    if (!datos) {
      return NextResponse.json(
        { error: "No se encontraron datos para esta placa. Verifique e ingrese manualmente." },
        { status: 404 }
      );
    }

    return NextResponse.json({ datos });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("ANT placa error:", message);
    return NextResponse.json(
      { error: "Error al consultar ANT: " + message },
      { status: 500 }
    );
  }
}

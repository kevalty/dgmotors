import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isClienteRoute = pathname.startsWith("/cliente");
  const isAdminRoute = pathname.startsWith("/admin");
  const isMecanicoRoute = pathname.startsWith("/mecanico");

  // Redirect unauthenticated users to login
  if (!user && (isClienteRoute || isAdminRoute || isMecanicoRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (isClienteRoute || isAdminRoute || isMecanicoRoute)) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    const rol = perfil?.rol;

    // Roles with access to the admin panel (full or partial)
    const ROLES_ADMIN = [
      "admin",
      "gerente",
      "facturadora",
      "asesor_servicios",
      "asesor_repuestos",
      "bodeguero",
      "contador",
    ];

    // Admin routes: admin + ERP staff
    if (isAdminRoute && !ROLES_ADMIN.includes(rol ?? "")) {
      const url = request.nextUrl.clone();
      url.pathname = rol === "mecanico" ? "/mecanico/dashboard" : "/cliente/dashboard";
      return NextResponse.redirect(url);
    }

    // Mecanico routes: only mecanico (and admin can also access)
    if (isMecanicoRoute && rol !== "mecanico" && !ROLES_ADMIN.includes(rol ?? "")) {
      const url = request.nextUrl.clone();
      url.pathname = "/cliente/dashboard";
      return NextResponse.redirect(url);
    }

    // Cliente routes: only 'cliente' role (ERP staff and mechanics have their own portals)
    if (isClienteRoute && rol !== "cliente" && rol !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = rol === "mecanico"
        ? "/mecanico/dashboard"
        : ROLES_ADMIN.includes(rol ?? "")
          ? "/admin/dashboard"
          : "/cliente/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

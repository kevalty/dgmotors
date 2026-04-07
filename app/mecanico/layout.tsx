import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarMecanico } from "@/components/layout/SidebarMecanico";
import { BottomNavMecanico } from "@/components/layout/BottomNavMecanico";

export default async function MecanicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, apellido, rol")
    .eq("id", user.id)
    .single();

  if (!perfil || (perfil.rol !== "mecanico" && perfil.rol !== "admin")) {
    redirect("/cliente/dashboard");
  }

  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`.trim();

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex">
        <SidebarMecanico nombre={nombreCompleto} email={user.email} />
      </div>
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-5xl pb-20 md:pb-8">
          {children}
        </div>
      </main>
      <BottomNavMecanico />
    </div>
  );
}

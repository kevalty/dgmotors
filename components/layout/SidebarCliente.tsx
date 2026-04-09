"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Calendar,
  Wrench,
  Droplets,
  User,
  LogOut,
  Car as CarIcon,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { href: "/cliente/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/cliente/vehiculos", icon: Car, label: "Mis Vehículos" },
  { href: "/cliente/citas", icon: Calendar, label: "Mis Citas" },
  { href: "/cliente/mantenimiento", icon: Wrench, label: "Mantenimiento" },
  { href: "/cliente/aceite", icon: Droplets, label: "Aceite" },
  { href: "/cliente/perfil", icon: User, label: "Mi Perfil" },
];

interface SidebarClienteProps {
  nombre?: string;
  email?: string;
}

export function SidebarCliente({ nombre, email }: SidebarClienteProps) {
  const pathname = usePathname();
  const initials = nombre
    ? nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <aside className="w-64 min-h-screen border-r border-border/50 bg-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <Image
            src="/asssets/logo-color.jpeg"
            alt="DG Motors"
            width={44}
            height={44}
            className="rounded-lg"
          />
          <span
            className="text-base font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            DG Motors
          </span>
        </Link>
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-primary/20 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{nombre || "Cliente"}</p>
            {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/50 space-y-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}

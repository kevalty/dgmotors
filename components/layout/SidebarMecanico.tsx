"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  Car,
  ClipboardList,
  Calendar,
  LogOut,
  Car as CarIcon,
  ChevronRight,
  HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { href: "/mecanico/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/mecanico/citas", icon: Calendar, label: "Citas del Taller" },
  { href: "/mecanico/registrar", icon: Wrench, label: "Registrar Trabajo" },
  { href: "/mecanico/vehiculos", icon: Car, label: "Vehículos" },
  { href: "/mecanico/historial", icon: ClipboardList, label: "Mi Historial" },
];

interface SidebarMecanicoProps {
  nombre?: string;
  email?: string;
}

export function SidebarMecanico({ nombre, email }: SidebarMecanicoProps) {
  const pathname = usePathname();
  const initials = nombre
    ? nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "MC";

  return (
    <aside className="w-64 min-h-screen border-r border-border/50 bg-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <CarIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            DG Motors
          </span>
        </Link>
        <div className="flex items-center gap-2.5">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-orange-500/20 text-orange-600">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate">{nombre || "Mecánico"}</p>
              <Badge variant="outline" className="text-xs py-0 px-1 border-orange-400/40 text-orange-500">
                <HardHat className="w-2.5 h-2.5 mr-0.5" />
                Mecánico
              </Badge>
            </div>
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  Wrench,
  Settings,
  BarChart3,
  Package,
  LogOut,
  Car as CarIcon,
  ChevronRight,
  ShieldCheck,
  HardHat,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/clientes", icon: Users, label: "Clientes" },
  { href: "/admin/mecanicos", icon: HardHat, label: "Mecánicos" },
  { href: "/admin/vehiculos", icon: Car, label: "Vehículos" },
  { href: "/admin/citas", icon: Calendar, label: "Citas" },
  { href: "/admin/mantenimiento", icon: Wrench, label: "Mantenimiento" },
  { href: "/admin/servicios", icon: Settings, label: "Servicios" },
  { href: "/admin/productos", icon: Package, label: "Productos" },
  { href: "/admin/reportes", icon: BarChart3, label: "Reportes" },
  { href: "/admin/contacto", icon: MessageSquare, label: "Contacto" },
];

interface SidebarAdminProps {
  nombre?: string;
  email?: string;
}

export function SidebarAdmin({ nombre, email }: SidebarAdminProps) {
  const pathname = usePathname();
  const initials = nombre
    ? nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

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
            <AvatarFallback className="text-xs bg-primary/20 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate">{nombre || "Admin"}</p>
              <Badge variant="outline" className="text-xs py-0 px-1 border-primary/30 text-primary">
                Admin
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
        <Link href="/cliente/dashboard">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Portal Cliente
          </Button>
        </Link>
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

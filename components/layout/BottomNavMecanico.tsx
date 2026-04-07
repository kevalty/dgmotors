"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wrench, Car, ClipboardList, Calendar, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/mecanico/dashboard", icon: LayoutDashboard, label: "Inicio" },
  { href: "/mecanico/citas", icon: Calendar, label: "Citas" },
  { href: "/mecanico/registrar", icon: Wrench, label: "Registrar" },
  { href: "/mecanico/historial", icon: ClipboardList, label: "Historial" },
];

export function BottomNavMecanico() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 md:hidden">
      <div className="flex items-stretch h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 text-[10px] transition-colors",
                isActive
                  ? "text-orange-500"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex flex-col items-center justify-center flex-1 gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sun className="w-5 h-5 dark:hidden" />
          <Moon className="w-5 h-5 hidden dark:block" />
          <span>Tema</span>
        </button>
      </div>
    </nav>
  );
}

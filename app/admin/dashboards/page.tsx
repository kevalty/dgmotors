import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3, TrendingUp, ShoppingCart, CreditCard,
  Landmark, Users, GitCompare, PieChart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboards Gerenciales" };

const DASHBOARDS = [
  {
    href: "/admin/dashboards/gerencial",
    icon: BarChart3,
    title: "Gerencial",
    desc: "Estado del negocio: ingresos, top clientes, comparativa sucursales",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    href: "/admin/dashboards/ventas",
    icon: TrendingUp,
    title: "Ventas",
    desc: "Ventas netas, por método de pago, por establecimiento, top servicios",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
  },
  {
    href: "/admin/dashboards/compras",
    icon: ShoppingCart,
    title: "Compras",
    desc: "Egresos netos, compras por proveedor, top gastos del período",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    href: "/admin/dashboards/cxc",
    icon: CreditCard,
    title: "Cuentas por Cobrar",
    desc: "CxC total, anticipos pendientes, vencidas, top deudores",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    href: "/admin/dashboards/tesoreria",
    icon: Landmark,
    title: "Tesorería",
    desc: "Saldos bancarios, cobros vs pagos, flujo de caja",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    href: "/admin/dashboards/vendedores",
    icon: Users,
    title: "Vendedores",
    desc: "Facturación por usuario, notas de crédito, ranking de desempeño",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    href: "/admin/dashboards/comparativa",
    icon: GitCompare,
    title: "Comparativa",
    desc: "Ventas vs compras por año y mes, tendencias del negocio",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    href: "/admin/dashboards/rentabilidad",
    icon: PieChart,
    title: "Rentabilidad",
    desc: "Margen bruto por servicio, por categoría, por establecimiento",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

export default function DashboardsHubPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Dashboards Gerenciales
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          8 vistas analíticas del negocio — selecciona el dashboard que necesitas
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {DASHBOARDS.map((d) => (
          <Link key={d.href} href={d.href}>
            <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${d.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <d.icon className={`w-6 h-6 ${d.color}`} />
                </div>
                <div>
                  <h2 className="font-semibold text-base">{d.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{d.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

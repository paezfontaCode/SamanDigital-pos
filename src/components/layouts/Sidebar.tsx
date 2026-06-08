"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Wrench,
  DollarSign,
  Users,
  Settings,
  LogOut,
  ShieldAlert,
  FileText,
  AlertCircle
} from "lucide-react";

interface SidebarProps {
  role: string;
  lowStockCount?: number;
}

export default function Sidebar({ role, lowStockCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const getLinks = () => {
    switch (role) {
      case "ADMIN":
        return [
          { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
          { 
            href: "/inventario/accesorios", 
            label: "Inventario", 
            icon: Package,
            badge: lowStockCount > 0 ? lowStockCount : undefined
          },
          { href: "/servicios/tickets", label: "Reparaciones", icon: Wrench },
          { href: "/finanzas/caja", label: "Finanzas", icon: DollarSign },
          { href: "/clientes", label: "Clientes", icon: Users },
          { href: "/garantias", label: "Garantías", icon: ShieldAlert },
          { href: "/reportes", label: "Reportes", icon: FileText },
          { href: "/configuracion", label: "Configuración", icon: Settings },
        ];
      case "VENDEDOR":
        return [
          { href: "/vendedor/pos", label: "POS / Venta", icon: LayoutDashboard },
          { 
            href: "/inventario/accesorios", 
            label: "Inventario", 
            icon: Package,
            badge: lowStockCount > 0 ? lowStockCount : undefined
          },
          { href: "/servicios/tickets", label: "Tickets", icon: Wrench },
          { href: "/finanzas/caja", label: "Caja Diaria", icon: DollarSign },
          { href: "/clientes", label: "Clientes", icon: Users },
          { href: "/garantias", label: "Garantías", icon: ShieldAlert },
        ];
      case "TECNICO":
        return [
          { href: "/tecnico", label: "Mis Reparaciones", icon: LayoutDashboard },
          { href: "/servicios/tickets", label: "Tickets", icon: Wrench },
          { 
            href: "/inventario/repuestos", 
            label: "Repuestos", 
            icon: Package,
            badge: lowStockCount > 0 ? lowStockCount : undefined
          },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6" />
          <span>Saman Digital</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isActive ? "bg-muted text-primary" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {link.label}
                </div>
                {link.badge && (
                  <span className="flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

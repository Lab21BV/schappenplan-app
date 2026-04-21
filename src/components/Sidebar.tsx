"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Grid3X3,
  ClipboardList,
  Package,
  LayoutTemplate,
  Settings,
  BarChart2,
} from "lucide-react";

const verkooperLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/planogram", label: "Schappenplan", icon: Grid3X3 },
  { href: "/dashboard/inventory", label: "Inventarisatie", icon: ClipboardList },
  { href: "/dashboard/showfloor", label: "Showvloer", icon: LayoutTemplate },
];

const hqLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/planogram", label: "Schappenplan", icon: Grid3X3 },
  { href: "/dashboard/inventory", label: "Inventarisatie", icon: ClipboardList },
  { href: "/dashboard/showfloor", label: "Showvloer", icon: LayoutTemplate },
  { href: "/dashboard/overzicht", label: "HQ Overzicht", icon: BarChart2 },
  { href: "/dashboard/articles", label: "Artikelen", icon: Package },
  { href: "/dashboard/admin", label: "Beheer", icon: Settings },
];

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const links = role === "HOOFDKANTOOR" ? hqLinks : verkooperLinks;

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col min-h-full">
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-blue-900 font-bold text-sm">L</span>
          </div>
          <div>
            <p className="font-bold text-sm">Lab21</p>
            <p className="text-blue-300 text-xs">Schappenplan</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-blue-900"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <p className="text-blue-400 text-xs text-center">Lab21 © 2025</p>
      </div>
    </aside>
  );
}

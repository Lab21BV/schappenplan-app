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
  BookOpen,
  Network,
  HandCoins,
  FileBarChart,
  X,
} from "lucide-react";

const verkooperLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/planogram", label: "Schappenplan", icon: Grid3X3 },
  { href: "/dashboard/inventory", label: "Inventarisatie", icon: ClipboardList },
  { href: "/dashboard/showfloor", label: "Showvloer", icon: LayoutTemplate },
  { href: "/dashboard/loans", label: "Uitleningen", icon: HandCoins },
  { href: "/dashboard/handleiding", label: "Handleiding", icon: BookOpen },
];

const hqLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/planogram", label: "Schappenplan", icon: Grid3X3 },
  { href: "/dashboard/inventory", label: "Inventarisatie", icon: ClipboardList },
  { href: "/dashboard/showfloor", label: "Showvloer", icon: LayoutTemplate },
  { href: "/dashboard/loans", label: "Uitleningen", icon: HandCoins },
  { href: "/dashboard/overzicht", label: "HQ Overzicht", icon: BarChart2 },
  { href: "/dashboard/rapporten", label: "Rapporten", icon: FileBarChart },
  { href: "/dashboard/articles", label: "Artikelen", icon: Package },
  { href: "/dashboard/admin", label: "Beheer", icon: Settings },
  { href: "/dashboard/werking", label: "Werking & flow", icon: Network },
  { href: "/dashboard/handleiding", label: "Handleiding", icon: BookOpen },
];

export default function Sidebar({
  role,
  isOpen,
  onClose,
  mobileOnly = false,
}: {
  role: string;
  isOpen?: boolean;
  onClose?: () => void;
  mobileOnly?: boolean;
}) {
  const pathname = usePathname();
  const links = role === "HOOFDKANTOOR" ? hqLinks : verkooperLinks;

  return (
    <>
      {!mobileOnly && (
        <aside className="hidden lg:flex w-64 bg-blue-900 text-white flex-col min-h-full">
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
      )}

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 mobile-fade-in" onClick={onClose} />
          <aside className="relative w-72 max-w-[80vw] h-full bg-blue-900 text-white flex flex-col shadow-2xl mobile-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-blue-900 font-bold text-sm">L</span>
                </div>
                <div>
                  <p className="font-bold text-sm">Lab21</p>
                  <p className="text-blue-300 text-xs">Schappenplan</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-white hover:bg-blue-800 rounded-lg mobile-animate-fast" aria-label="Sluit menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors mobile-animate-fast ${
                      active ? "bg-white text-blue-900" : "text-blue-100 hover:bg-blue-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

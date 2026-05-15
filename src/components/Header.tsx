"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { LogOut, Building2, User, Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function Header({ session }: { session: Session }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = session.user as Session["user"] & { role: string; showroomName?: string | null };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-3 max-lg:px-4 max-lg:py-2.5 flex items-center justify-between max-lg:sticky max-lg:top-0 max-lg:z-20 max-lg:backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mobile-animate-fast"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Building2 className="w-4 h-4" />
          <span className="font-medium truncate max-w-[160px] sm:max-w-xs lg:max-w-none">
            {user.showroomName ? `Showroom ${user.showroomName}` : "Hoofdkantoor"}
          </span>
        </div>

        <div className="flex items-center gap-4 max-lg:gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center" aria-label={user.name ?? "Gebruiker"}>
              <User className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-sm max-lg:hidden">
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.role === "HOOFDKANTOOR" ? "Hoofdkantoor" : "Verkoper"}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition max-lg:p-2 max-lg:-mr-2 mobile-animate-fast"
            aria-label="Uitloggen"
          >
            <LogOut className="w-4 h-4" />
            <span className="max-lg:hidden">Uitloggen</span>
          </button>
        </div>
      </header>

      <Sidebar
        role={user.role}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        mobileOnly
      />
    </>
  );
}

"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import { LogOut, Building2, User } from "lucide-react";

export default function Header({ session }: { session: Session }) {
  const user = session.user as any;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Building2 className="w-4 h-4" />
        <span className="font-medium">
          {user.showroomName
            ? `Showroom ${user.showroomName}`
            : "Hoofdkantoor"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">
              {user.role === "HOOFDKANTOOR" ? "Hoofdkantoor" : "Verkoper"}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition"
        >
          <LogOut className="w-4 h-4" />
          Uitloggen
        </button>
      </div>
    </header>
  );
}

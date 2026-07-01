"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center space-x-2 border border-zinc-850 bg-black hover:bg-zinc-900 hover:border-red-500/30 text-zinc-400 hover:text-white font-semibold text-xs tracking-wider px-5 py-3 rounded-lg transition-all duration-300"
    >
      <LogOut className="h-3.5 w-3.5 text-red-500" />
      <span>LOG OUT</span>
    </button>
  );
}

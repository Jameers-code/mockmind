"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#121212",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: "13px",
            borderRadius: "4px",
          },
          success: {
            iconTheme: {
              primary: "#00ff88",
              secondary: "#000000",
            },
          },
        }}
      />
      {children}
    </SessionProvider>
  );
}

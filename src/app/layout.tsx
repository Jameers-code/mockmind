import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import CursorGlow from "@/components/CursorGlow";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GrillAI | Premium AI Interview Simulator",
  description: "Paste your resume. Choose a target role. Get grilled by technical AI. Built to make you hireable.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "GrillAI | Premium AI Interview Simulator",
    description: "Get interview-ready with real-time AI grilling tailored to your resume.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground bg-grid-pattern relative min-h-screen`}
      >
        <Providers>
          <CursorGlow />
          {children}
        </Providers>
      </body>
    </html>
  );
}

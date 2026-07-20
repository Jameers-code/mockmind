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
  title: "MockMind | AI Interview Simulator",
  description: "Upload your resume, pick a role, and get AI-generated interview questions tailored to your experience. Real-time scoring and feedback.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "MockMind | AI Interview Simulator",
    description: "Practice interviews with AI. Get scored on technical depth, communication, clarity, and confidence.",
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

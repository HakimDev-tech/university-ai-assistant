import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "University AI Assistant",
    template: "%s • University AI Assistant",
  },
  description: "AI-powered assistant for querying and managing university documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={inter.variable}
      suppressHydrationWarning
    >
      <body
        className="
          min-h-screen
          bg-canvas
          text-ink-primary
          font-sans
          antialiased
        "
      >
        <div className="flex min-h-screen flex-col">
          <Navbar />

          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
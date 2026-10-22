import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono, Newsreader } from "next/font/google";
import Navbar from "@/components/Navbar";
import AmbientField from "@/components/AmbientField";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Margin — Study from the source", template: "%s · Margin" },
  description: "A source-first study desk for university material. Ask questions, trace every answer to its passage, and keep your study work grounded in your documents.",
  applicationName: "Margin",
  icons: { icon: "/margin-mark.svg", shortcut: "/margin-mark.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${newsreader.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen">
        <AmbientField />
        <div className="relative z-10 min-h-screen">
          <Navbar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { themeInitScript } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Masomo | School portal for Uganda",
  description:
    "Masomo is a school management portal for Ugandan primary, secondary and vocational institutions: attendance, learning materials, results, fees and messaging in one place.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

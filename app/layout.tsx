import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "DG Motors — Taller Automotriz",
    template: "%s | DG Motors",
  },
  description:
    "Taller automotriz especializado en vehículos americanos, Ford y multimarca. Servicio en Quito y Guayaquil, Ecuador.",
  keywords: ["taller automotriz", "DG Motors", "mecánica", "Ford", "diésel", "Quito", "Guayaquil"],
  openGraph: {
    title: "DG Motors — Taller Automotriz",
    description:
      "Especialistas en vehículos americanos, Ford y multimarca. Diagnóstico, mantenimiento preventivo y correctivo.",
    locale: "es_EC",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${syne.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

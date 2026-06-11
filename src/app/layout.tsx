import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ô de Casa!",
  description:
    "Vizinhos de confiança recebem suas encomendas com foto e comprovante rastreável.",
};

export const viewport: Viewport = {
  themeColor: "#FAF4E8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-creme text-tinta antialiased">
        <ToastProvider>
          <div className="mx-auto min-h-dvh max-w-app bg-creme">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}

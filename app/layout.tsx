import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { FlashToastHandler } from "@/components/ui/flash-toast-handler";
import { fontBody, fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "AsblOS — Gestion ASBL",
  description:
    "Application de gestion simple et sécurisée pour les ASBL belges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={fontVariables}>
      <body className={`${fontBody.className} min-h-screen font-sans antialiased`}>
        {children}
        <Suspense fallback={null}>
          <FlashToastHandler />
        </Suspense>
        <Toaster position="top-center" richColors closeButton duration={5000} />
      </body>
    </html>
  );
}

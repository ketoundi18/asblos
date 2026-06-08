import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { FlashToastHandler } from "@/components/ui/flash-toast-handler";
import { fontBody, fontVariables } from "@/lib/fonts";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="fr" className={cn("font-sans", geist.variable)}>
      <body className={`${fontVariables} ${fontBody.className} min-h-screen font-sans`}>
        {children}
        <Suspense fallback={null}>
          <FlashToastHandler />
        </Suspense>
        <Toaster position="top-center" richColors closeButton duration={5000} />
      </body>
    </html>
  );
}

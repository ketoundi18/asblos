import { Nunito, Source_Sans_3 } from "next/font/google";

/** Titres & UI — Brand Brief AsblOS */
export const fontHeading = Nunito({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

/** Corps de texte — Brand Brief AsblOS */
export const fontBody = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-source-sans",
  display: "swap",
});

export const fontVariables = `${fontHeading.variable} ${fontBody.variable}`;

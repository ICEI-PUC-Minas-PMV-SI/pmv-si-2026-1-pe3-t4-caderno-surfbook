import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SurfBook",
  description:
    "Organize seus estudos em cadernos conectados — projeto Eixo 3 / Sistemas de Informação.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${sora.variable} antialiased`}
    >
      <body className="min-h-full bg-bg text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

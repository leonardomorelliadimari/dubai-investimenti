import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Navigation } from "@/components/Navigation";
import { Cursor } from "@/components/Cursor";
import { ScrollProgress } from "@/components/ScrollProgress";
import { site } from "@/data/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Investire nel mercato immobiliare di Dubai · Guida per investitori italiani",
    template: `%s · ${site.brandName}`,
  },
  description:
    "Una guida chiara al mercato immobiliare di Dubai per investitori italiani: opportunità, aree, off-plan e rischi. Senza promesse irrealistiche.",
  openGraph: {
    title: "Il tuo prossimo investimento potrebbe non essere in Italia.",
    description: "Scopri perché sempre più investitori guardano al mercato immobiliare di Dubai.",
    locale: "it_IT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a href="#contenuto" className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-full bg-ink px-4 py-2 text-sm text-ivory focus:translate-y-0">
          Vai al contenuto
        </a>
        <SmoothScroll>
          <ScrollProgress />
          <Navigation />
          {children}
          <Cursor />
        </SmoothScroll>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Rocket Distro — Wholesale Distribution",
  description: "Official wholesale distributor. Browse our product catalog and place orders online.",
  metadataBase: new URL("https://rocketdistro.site"),
  openGraph: {
    title: "Rocket Distro — Wholesale Distribution",
    description: "Official wholesale distributor. Browse our product catalog and place orders online.",
    url: "https://rocketdistro.site",
    siteName: "Rocket Distro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rocket Distro — Wholesale Distribution",
    description: "Official wholesale distributor. Browse our product catalog and place orders online.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>
          <div className="shooting-star" aria-hidden="true" />
          <div className="shooting-star-2" aria-hidden="true" />
          {children}
        </Providers>
      </body>
    </html>
  );
}

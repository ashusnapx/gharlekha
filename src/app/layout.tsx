import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { CONFIG } from "@/config/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://gharlekha.com"
  ),
  title: {
    default: CONFIG.app.name,
    template: `%s | ${CONFIG.app.name}`,
  },
  description: CONFIG.app.tagline,
  keywords: [
    "rental management",
    "landlord software",
    "tenant billing",
    "rent collection",
    "indian landlords",
    "property management",
    "ghar lekha",
  ],
  authors: [{ name: "Ghar Lekha Team" }],
  creator: "Ghar Lekha",
  publisher: "Ghar Lekha",
  icons: {
    icon: "/icon.png", // Next.js auto-generation
    apple: "/icon.png",
  },
  openGraph: {
    title: CONFIG.app.name,
    description: CONFIG.app.tagline,
    url: "/",
    siteName: CONFIG.app.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: CONFIG.app.name,
    description: CONFIG.app.tagline,
    creator: "@gharlekha",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

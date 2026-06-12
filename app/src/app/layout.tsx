import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATB Combat Simulator — Active Time Battle RPG",
  description: "Simulatore di combattimento per il sistema ATB RPG con carte e timeline attiva. Crea personaggi, mostri e combatti!",
  keywords: ["ATB", "RPG", "Combat", "Simulator", "Card Game", "Active Time Battle"],
  authors: [{ name: "ATB Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ATB Combat Simulator",
    description: "Simulatore di combattimento ATB RPG",
    url: "https://chat.z.ai",
    siteName: "ATB Combat Simulator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ATB Combat Simulator",
    description: "Simulatore di combattimento ATB RPG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Filecoin Digital Asset Marketplace",
  description: "Discover and trade digital assets on Filecoin. Secure, decentralized storage with blockchain-powered transactions.",
  keywords: ["Filecoin", "Digital Assets", "Marketplace", "IPFS", "Blockchain", "NFT", "Web3"],
  authors: [{ name: "Filecoin Marketplace Team" }],
  openGraph: {
    title: "Filecoin Digital Asset Marketplace",
    description: "Discover and trade digital assets on Filecoin with secure, decentralized storage",
    url: "https://filecoin-marketplace.local",
    siteName: "Filecoin Marketplace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Filecoin Digital Asset Marketplace",
    description: "Discover and trade digital assets on Filecoin with secure, decentralized storage",
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
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

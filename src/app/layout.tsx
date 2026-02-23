import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Billmensor - Free GST Billing & Inventory Management Software",
  description: "Billmensor is the best free GST billing software in India. Manage invoices, inventory, quotations, and accounting with ease. Secure, easy-to-use, and production-ready.",
  keywords: ["free billing software", "gst billing india", "inventory management", "invoice generator", "billmensor", "small business accounting"],
  authors: [{ name: "Gopal Krishn Sahu" }],
  openGraph: {
    title: "Billmensor - Free GST Billing & Inventory Management Software",
    description: "The complete solution for small business billing and inventory. Free and secure.",
    type: "website",
    locale: "en_IN",
    siteName: "Billmensor",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

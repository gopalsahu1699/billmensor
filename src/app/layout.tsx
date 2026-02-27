import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";
import { I18nProvider } from "@/components/providers/i18n-provider";

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
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
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
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <I18nProvider>
          {children}
          <Toaster position="top-right" richColors />
        </I18nProvider>
      </body>
    </html>
  );
}

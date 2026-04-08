import type { Metadata, Viewport } from "next";

import "@/styles/globals.css";

import { AppProvider } from "@/providers/AppProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "ImpactPay",
  description: "Reputation-based social finance for MiniPay on Celo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ImpactPay",
  },
};

/** Locks zoom for a native mini-app feel on mobile (MiniPay). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00955f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
          <ServiceWorkerRegister />
        </AppProvider>
      </body>
    </html>
  );
}

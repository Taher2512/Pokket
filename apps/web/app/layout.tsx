import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "../components/AppProviders";

export const metadata: Metadata = {
  title: "Pokket - Ethereum Wallet & Crypto Payments",
  description:
    "Create and manage Ethereum wallets and send crypto via shareable links",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

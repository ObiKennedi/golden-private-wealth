import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Golden Private Wealth Bank",
  description: "The bank of the elite",
  icons: {
    icon: "/icon.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

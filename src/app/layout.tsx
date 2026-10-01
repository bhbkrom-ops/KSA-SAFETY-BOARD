import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KSA SAFETY BOARD",
  description: "Industrial HSE command center for safety reporting, risk, incidents, and corrective actions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

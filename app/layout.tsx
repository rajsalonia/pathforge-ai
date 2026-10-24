import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PathForge AI · Your Goal. Your Path. Your Proof.",
  description: "A living learning workspace. Explore your path, practice real skills, and collect the evidence of your progress.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

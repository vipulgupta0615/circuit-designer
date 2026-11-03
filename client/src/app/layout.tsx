import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Circuit Studio — Interactive 3D Circuit Designer",
  description:
    "Build, wire, and simulate electronics projects in an interactive 3D workbench.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

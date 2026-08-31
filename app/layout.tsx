import type { Metadata } from "next";
import "./globals.css";
import { AppNavigation } from "./navigation";

export const metadata: Metadata = {
  title: "Mexico Supplier Intelligence",
  description: "Evidence-backed intelligence for Mexican manufacturing suppliers."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppNavigation />
        {children}
      </body>
    </html>
  );
}

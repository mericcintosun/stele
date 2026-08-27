import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Stele", template: "%s | Stele" },
  description:
    "A WEEX perpetual futures agent that ties every order to a named thesis, keeps a realized profit and loss ledger for each one, and cuts the capital of any thesis that is losing money.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-line">
          <SiteNav />
        </header>
        <main className="mx-auto max-w-[94rem] px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}

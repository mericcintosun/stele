import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stele · thesis-funded WEEX futures agent",
  description:
    "A WEEX perpetual futures agent that ties every order to a named thesis, keeps a realized profit and loss ledger for each one, and cuts the capital of any thesis that is losing money.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}

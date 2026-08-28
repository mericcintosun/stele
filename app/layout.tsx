import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import { SITE_URL } from "@/lib/config";
import "./globals.css";

// metadataBase is what turns the generated /opengraph-image into an absolute
// URL in view-source. Without it Next emits a relative path and every link
// preview drops the card.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Stele: capital follows the reason",
    template: "%s · Stele",
  },
  description:
    "Agents repeat the reason that lost money. Stele keeps a realized PnL ledger per thesis and sizes the next WEEX order from it.",
  openGraph: {
    title: "Stele: capital follows the reason",
    description:
      "A WEEX perpetual futures agent that ties every order to a named thesis and cuts the capital of any thesis that is losing money.",
    type: "website",
    url: SITE_URL,
    siteName: "Stele",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stele: capital follows the reason",
    description:
      "A WEEX perpetual futures agent that ties every order to a named thesis and cuts the capital of any thesis that is losing money.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden antialiased">
        {/* Sticky, because the console action lives in the nav and the landing
            page is taller than a screen. The blur keeps the token background
            readable over a panel that scrolls under it. */}
        <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
          <SiteNav />
        </header>
        <main className="mx-auto w-full max-w-[94rem] px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}

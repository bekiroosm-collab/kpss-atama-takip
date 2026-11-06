import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Atama Takip | KPSS Ortaöğretim",
  description: "Kamu personel alımlarını tek merkezden takip edin.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Atama Takip" }
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="tr"><body>{children}</body></html>;
}
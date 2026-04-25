import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { cookies } from "next/headers";
import { LocaleProvider } from "@/components/locale-provider";
import { defaultLocale, isLocale, localeCookieName } from "@/lib/i18n";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mboko Reels | Cameroon Movie Reviews",
  description: "A bilingual movie review home page for discovering Cameroonian cinema.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeValue = cookieStore.get(localeCookieName)?.value;
  const initialLocale = isLocale(localeValue) ? localeValue : defaultLocale;

  return (
    <html lang={initialLocale}>
      <body className={montserrat.variable}>
        <LocaleProvider initialLocale={initialLocale}>
          <div className="app-frame">{children}</div>
        </LocaleProvider>
      </body>
    </html>
  );
}

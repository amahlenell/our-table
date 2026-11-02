import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProvider } from "@/features/app-provider";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";
import "./our-table.css";
const fredoka = localFont({
  src: "../../public/fonts/Fredoka-variable.ttf",
  weight: "300 700",
  style: "normal",
  display: "swap",
  variable: "--font-fredoka",
});
const nunito = localFont({
  src: "../../public/fonts/Nunito-variable.ttf",
  weight: "200 1000",
  style: "normal",
  display: "swap",
  variable: "--font-nunito",
});
export const metadata: Metadata = {
  icons: { icon: "/assets/icon.svg" },
  title: {
    default: "Our Table — Your everyday kitchen",
    template: "%s · Our Table",
  },
  applicationName: "Our Table",
  description:
    "A thoughtful shared recipe book. Save the food you love, plan a little ahead, and enjoy the everyday.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" && !configured;
  return (
    <html lang="en-NZ" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <AppProvider demo={demo} configured={configured}>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}

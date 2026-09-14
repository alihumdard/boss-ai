import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Orbitron } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VisibilityGuard } from "@/components/shell/visibility-guard";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

/** Wide techy face used for the BOSS wordmark and the orb label. */
const orbitron = Orbitron({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOSS — Your Personal AI Assistant",
  description:
    "BOSS control centre: agents for website, WhatsApp and customer support.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable} ${orbitron.variable} h-full`}
    >
      {/* tab-visible by default (matches usePageVisible's SSR-safe initial
          value of true) so animations run from first paint; VisibilityGuard
          removes it only once the tab is actually confirmed hidden. */}
      <body className="tab-visible flex min-h-full flex-col">
        <VisibilityGuard />
        <div className="starfield" aria-hidden />
        <TooltipProvider delay={200}>{children}</TooltipProvider>
      </body>
    </html>
  );
}

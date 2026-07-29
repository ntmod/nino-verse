import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nino Verse",
  description: "Welcome to Nino Verse",
};

import { ModalProvider } from "@/lib/modal-context";
import ExpenseModal from "@/components/ExpenseModal";
import GlobalModal from "@/components/GlobalModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem("nori_theme");
                  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                  const theme = savedTheme || systemTheme;
                  if (theme === "dark") {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ModalProvider>
          {children}
          <ExpenseModal />
          <GlobalModal />
        </ModalProvider>
        <div className="fixed bottom-1.5 right-4 md:bottom-4 md:right-6 pointer-events-none select-none z-[10000]">
          <span className="text-[7.5px] md:text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em] italic">
            v0.2.1
          </span>
        </div>
      </body>
    </html>
  );
}

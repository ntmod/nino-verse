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
    >
      <body className="min-h-full flex flex-col">
        <ModalProvider>
          {children}
          <ExpenseModal />
          <GlobalModal />
        </ModalProvider>
        <div className="fixed bottom-4 right-6 pointer-events-none select-none z-[10000]">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
            Build v0.1.0
          </span>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import NoriNavBar from "@/components/NoriNavBar";
import { Chakra_Petch } from "next/font/google";

const chakraPetch = Chakra_Petch({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
});

export default function NoriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <div className={`relative min-h-screen ${chakraPetch.className}`}>
      <NoriNavBar />
      <div className="pt-20">
        {children}
      </div>
    </div>
  );
}

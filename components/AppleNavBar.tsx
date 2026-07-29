"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface AppleNavBarProps {
  title: string;
  links: { label: string; href: string }[];
  actionLabel?: string;
  onActionClick?: () => void;
  actionHref?: string;
}

export default function AppleNavBar({
  title,
  links,
  actionLabel,
  onActionClick,
  actionHref,
}: AppleNavBarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="w-full flex flex-col z-50">
      {/* 1. Global Navigation Bar (44px) - RawBlock layout */}
      <nav className="h-11 bg-[#000000] text-[#ffffff] flex items-center justify-between px-6 md:px-8 border-b-3 border-[#000000] select-none relative z-50 font-mono">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          {/* Brand/Logo */}
          <Link href="/v2" className="flex items-center gap-2 hover:underline">
            <span className="w-3 h-3 bg-[#ffffff] rounded-none" />
            <span className="text-xs font-black tracking-wider uppercase">NINO-VERSE</span>
          </Link>

          {/* Center Links (Desktop only) */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/v2/ninjin"
              className={`text-[12px] uppercase font-bold tracking-wider hover:underline ${
                pathname.startsWith("/v2/ninjin") ? "underline" : ""
              }`}
            >
              Ninjin's Quest
            </Link>
            <Link
              href="/v2/nori"
              className={`text-[12px] uppercase font-bold tracking-wider hover:underline ${
                pathname.startsWith("/v2/nori") ? "underline" : ""
              }`}
            >
              Nori's Note
            </Link>
            <Link
              href="/v2/rinji"
              className={`text-[12px] uppercase font-bold tracking-wider hover:underline ${
                pathname.startsWith("/v2/rinji") ? "underline" : ""
              }`}
            >
              Rinji's Brain
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-5 text-[#ffffff]">
            <button className="hover:underline cursor-pointer p-1">
              <Search className="w-4 h-4" />
            </button>
            <button className="hover:underline cursor-pointer p-1">
              <ShoppingBag className="w-4 h-4" />
            </button>
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden hover:underline cursor-pointer p-1"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="absolute top-11 left-0 w-full bg-[#000000] border-b-3 border-[#000000] flex flex-col p-6 gap-4 text-sm font-bold z-40 md:hidden font-mono uppercase">
            <Link
              href="/v2/ninjin"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:underline"
            >
              Ninjin's Quest
            </Link>
            <Link
              href="/v2/nori"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:underline"
            >
              Nori's Note
            </Link>
            <Link
              href="/v2/rinji"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:underline"
            >
              Rinji's Brain
            </Link>
          </div>
        )}
      </nav>

      {/* 2. Sub-Navigation (52px) - Stark Opaque RawBlock Layout */}
      <div className="sticky top-0 h-[52px] bg-[#ffffff] flex items-center justify-between px-6 md:px-8 border-b-3 border-[#000000] select-none z-40 font-sans">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          {/* Sub-app Category Title */}
          <span className="font-heading text-lg md:text-xl font-normal uppercase tracking-tight text-[#000000]">
            {title}
          </span>

          {/* Sub-nav Links & Action CTA */}
          <div className="flex items-center gap-6">
            {/* Inline links (Desktop only) */}
            <div className="hidden sm:flex items-center gap-5">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs uppercase font-bold tracking-wider hover:underline ${
                    pathname === link.href
                      ? "text-[#000000] underline"
                      : "text-[#777777]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Sticky Action CTA: RawBlock Primary Button */}
            {actionLabel && (
              actionHref ? (
                <Link href={actionHref}>
                  <button className="bg-[#000000] text-[#ffffff] border-3 border-[#000000] px-4 py-1.5 uppercase font-bold text-[11px] tracking-wider transition-colors hover:bg-[#ffffff] hover:text-[#000000] active:scale-95">
                    {actionLabel}
                  </button>
                </Link>
              ) : (
                <button 
                  onClick={onActionClick}
                  className="bg-[#000000] text-[#ffffff] border-3 border-[#000000] px-4 py-1.5 uppercase font-bold text-[11px] tracking-wider transition-colors hover:bg-[#ffffff] hover:text-[#000000] active:scale-95"
                >
                  {actionLabel}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

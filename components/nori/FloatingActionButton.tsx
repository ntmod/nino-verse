'use client'

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, Car, Utensils, Pencil } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import type { Transaction } from "@/lib/types";

interface FloatingActionButtonProps {
  onSuccess?: (newTx: Transaction) => void;
}

export default function FloatingActionButton({ onSuccess }: FloatingActionButtonProps) {
  const { openExpenseModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleAction = (category?: string) => {
    setIsOpen(false);
    if (category) {
      openExpenseModal(onSuccess, { category });
    } else {
      openExpenseModal(onSuccess);
    }
  };

  return (
    <div ref={containerRef} className="fixed bottom-8 right-4 md:bottom-12 md:right-6 z-[10030] h-12 w-12">
      {/* Submenu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.18 } }}
            transition={{ duration: reducedMotion ? 0 : 0.1 }}
            className="pointer-events-none absolute inset-0 select-none"
          >
            {/* Quick Food Expense */}
            <motion.div
              initial={reducedMotion ? false : { x: 0, y: 0, scale: 0.4, rotate: 0 }}
              animate={{ x: -96, y: -8, scale: 1, rotate: 0 }}
              exit={reducedMotion ? {} : { x: 0, y: 0, scale: 0.4, rotate: 0, transition: { duration: 0.16 } }}
              transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 24, delay: 0.03 }}
              className="pointer-events-auto absolute bottom-0 right-0 group"
            >
              <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap bg-white text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                Quick Food
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction("Food & Drink")}
                className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(16,185,129,0.3)] cursor-pointer hover:bg-emerald-600 transition-colors"
                aria-label="Quick food expense"
                title="Quick food expense"
              >
                <Utensils className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
              </motion.button>
            </motion.div>

            {/* Quick Transport Expense */}
            <motion.div
              initial={reducedMotion ? false : { x: 0, y: 0, scale: 0.4, rotate: 0 }}
              animate={{ x: -70, y: -70, scale: 1, rotate: 0 }}
              exit={reducedMotion ? {} : { x: 0, y: 0, scale: 0.4, rotate: 0, transition: { duration: 0.16 } }}
              transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 24, delay: 0.08 }}
              className="pointer-events-auto absolute bottom-0 right-0 group"
            >
              <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap bg-white text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                Quick Transport
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction("Transport")}
                className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(59,130,246,0.3)] cursor-pointer hover:bg-blue-600 transition-colors"
                aria-label="Quick transport expense"
                title="Quick transport expense"
              >
                <Car className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
              </motion.button>
            </motion.div>

            {/* Create New Expense */}
            <motion.div
              initial={reducedMotion ? false : { x: 0, y: 0, scale: 0.4, rotate: 0 }}
              animate={{ x: -8, y: -96, scale: 1, rotate: 0 }}
              exit={reducedMotion ? {} : { x: 0, y: 0, scale: 0.4, rotate: 0, transition: { duration: 0.16 } }}
              transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 24, delay: 0.13 }}
              className="pointer-events-auto absolute bottom-0 right-0 group"
            >
              <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap bg-white text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                Create New Expense
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction()}
                className="w-12 h-12 bg-[#FF9D00] text-white rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(255,157,0,0.3)] cursor-pointer hover:bg-[#E08B00] transition-colors"
                aria-label="Create new expense"
                title="Create new expense"
              >
                <Pencil className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ rotate: isOpen ? 135 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? "Close expense actions" : "Create expense"}
        aria-expanded={isOpen}
        className="relative w-12 h-12 bg-[#FF9D00] text-white rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(255,157,0,0.3)] cursor-pointer z-50 hover:bg-[#E08B00] transition-colors"
      >
        <Plus className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

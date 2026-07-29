'use client'

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Car, Utensils, Pencil } from "lucide-react";
import { useModal } from "@/lib/modal-context";

interface FloatingActionButtonProps {
  onSuccess?: (newTx?: any) => void;
}

export default function FloatingActionButton({ onSuccess }: FloatingActionButtonProps) {
  const { openExpenseModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    <div ref={containerRef} className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 flex flex-col items-end gap-3">
      {/* Submenu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-end gap-2.5 mb-2 select-none"
          >
            {/* Quick Food Expense */}
            <div className="flex items-center gap-2.5 group">
              <span className="bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-lg border border-white/10 dark:border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                Quick Food
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction("Food & Drink")}
                className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-emerald-600 transition-colors"
                title="Quick food expense"
              >
                <Utensils className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
              </motion.button>
            </div>

            {/* Quick Transport Expense */}
            <div className="flex items-center gap-2.5 group">
              <span className="bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-lg border border-white/10 dark:border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                Quick Transport
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction("Transport")}
                className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"
                title="Quick transport expense"
              >
                <Car className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
              </motion.button>
            </div>

            {/* Create New Expense */}
            <div className="flex items-center gap-2.5 group">
              <span className="bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-lg border border-white/10 dark:border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                Create New Expense
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction()}
                className="w-10 h-10 md:w-12 md:h-12 bg-[#FF9D00] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#E08B00] transition-colors"
                title="Create new expense"
              >
                <Pencil className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ rotate: isOpen ? 135 : 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 md:w-16 md:h-16 bg-[#FF9D00] text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer z-50 hover:bg-[#E08B00] transition-colors"
      >
        <Plus className="w-6 h-6 md:w-8 md:h-8" />
      </motion.button>
    </div>
  );
}

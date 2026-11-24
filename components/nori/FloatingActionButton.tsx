'use client'

import { useLanguage } from "@/lib/language-context";

import { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus, Car, Utensils, Pencil } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import type { Transaction } from "@/lib/types";

interface FloatingActionButtonProps {
  onSuccess?: (newTx: Transaction) => void;
}

const actions = [
  { label: "ui_create_new_expense", icon: Pencil, category: undefined },
  { label: "ui_quick_food_expense", icon: Utensils, category: "Food & Drink" },
  { label: "ui_quick_transport_expense", icon: Car, category: "Transport" },
] as const;

export default function FloatingActionButton({ onSuccess }: FloatingActionButtonProps) {
  const { t } = useLanguage();
  const { openExpenseModal } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const actionsId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (containerRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
      setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleAction = (category?: string) => {
    setIsOpen(false);
    openExpenseModal(onSuccess, category ? { category } : undefined);
  };

  return (
    <div ref={containerRef} className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-[10030] lg:bottom-12 lg:right-6">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-label={isOpen ? t("ui_close_expense_actions") : t("ui_create_expense")}
        aria-expanded={isOpen}
        aria-controls={isOpen ? actionsId : undefined}
        className="group grid size-12 cursor-pointer place-items-center rounded-md border border-primary bg-primary text-primary-foreground shadow-(--shadow-page) transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
      >
        <Plus aria-hidden="true" className="size-5 transition-transform group-aria-expanded:rotate-45 motion-reduce:transition-none" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={actionsId}
            role="group"
            aria-label={t("ui_create_expense")}
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 6 }}
            transition={{ duration: reducedMotion ? 0 : 0.16 }}
            className="notebook-leaf absolute! right-0 bottom-full mb-3 w-max max-w-[calc(100vw-2rem)] divide-y divide-dashed divide-border p-1.5"
          >
            {actions.map(({ label, icon: Icon, category }) => (
              <button key={label} type="button" onClick={() => handleAction(category)}
                className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none">
                <Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />
                {t(label)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

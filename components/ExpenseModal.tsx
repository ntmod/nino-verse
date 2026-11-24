'use client';

import { useState, useEffect, useRef } from "react";
import { clearMetadataCache } from "@/lib/metadata-cache";
import { authClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useModal } from "@/lib/modal-context";
import { useLanguage } from "@/lib/language-context";
import { categoryService } from "@/lib/services/categoryService";
import { paymentService } from "@/lib/services/paymentService";
import TransactionReceipt, { type ReceiptData } from "@/components/TransactionReceipt";
import TransactionForm from "./TransactionForm";

export default function ExpenseModal() {
  const { isExpenseModalOpen, closeExpenseModal, onSuccess, editingTransaction } = useModal();
  const { t, language } = useLanguage();
  const { data: account } = authClient.useSession();
  const userId = account?.user.id;
  const savingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  useEffect(() => {
    if (userId) void Promise.all([categoryService.getAll(userId), paymentService.getAll(userId)]).catch(() => {});
    return () => clearMetadataCache();
  }, [userId]);

  return (
    <>
    <AnimatePresence>
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!savingRef.current) closeExpenseModal(); }}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="max-h-[calc(100dvh-2rem)] relative w-full max-w-md bg-card rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-border overflow-y-auto"
          >
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-foreground tracking-tight uppercase font-mono">
                  {editingTransaction && editingTransaction._id ? t("edit_expense") : t("add_expense")}
                </h2>
                <button disabled={isSaving} aria-label={language === "th" ? "ปิด" : t("close")} onClick={closeExpenseModal} className="w-11 h-11 shrink-0 rounded-md border border-border hover:border-border hover:bg-secondary flex items-center justify-center transition-colors disabled:opacity-40">
                  <X className="w-4 h-4 text-ink-soft" />
                </button>
              </div>

              <TransactionForm key={editingTransaction?._id ?? JSON.stringify(editingTransaction ?? {})} variant="modal" initialTransaction={editingTransaction}
                onSavingChange={saving => { savingRef.current = saving; setIsSaving(saving); }}
                onSaved={(savedReceipt, closeAfter) => {
                  onSuccess?.(savedReceipt.transaction);
                  if (closeAfter) { setReceipt(savedReceipt); closeExpenseModal(); }
                }} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    {receipt && <TransactionReceipt receipt={receipt} onClose={() => {
      setReceipt(null);
    }} />}
    </>
  );
}

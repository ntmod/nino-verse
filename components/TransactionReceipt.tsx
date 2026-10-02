'use client';

import { useEffect } from "react";
import { playUISound } from "@/lib/ui-sounds.mjs";
import Image from "next/image";
import ReceiptPaper from "./ReceiptPaper";
import { motion, useReducedMotion } from "framer-motion";
import { Check, PawPrint } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { Transaction } from "@/lib/types";

export interface ReceiptData {
  transaction: Transaction;
  categoryName: string;
  subCategoryName?: string;
  paymentName: string;
  refreshOnClose: boolean;
}

export default function TransactionReceipt({ receipt, onClose }: { receipt: ReceiptData; onClose: () => void }) {
  const { language } = useLanguage();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const timer = window.setTimeout(() => playUISound("stamp"), reducedMotion ? 0 : 1150);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);
  const th = language === "th";
  const locale = th ? "th-TH" : "en-US";
  const { transaction, categoryName, subCategoryName, paymentName } = receipt;

  return (
    <ReceiptPaper onClose={onClose} title={<><Check aria-hidden="true" className="h-4 w-4" />{th ? "บันทึกเรียบร้อย" : "Transaction saved"}</>}>
              <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-stone-400">{th ? "สรุปรายการ" : "Transaction receipt"}</p>

            <div className="my-6 border-y border-dashed border-stone-300 py-5">
              <p className="break-words text-sm font-bold">{transaction.name}</p>
              <p className="mt-3 text-[10px] text-stone-500">{transaction.amount > 0 ? (th ? "รายรับ" : "Income") : (th ? "รายจ่าย" : "Expense")}</p>
              <p className="mt-1 break-words text-3xl font-black tracking-tight">
                {new Intl.NumberFormat(locale, { style: "currency", currency: "THB", currencyDisplay: "narrowSymbol" }).format(Math.abs(transaction.amount))}
              </p>
            </div>

            <dl className="space-y-3 text-xs">
              {[
                [th ? "หมวดหมู่" : "Category", categoryName],
                ...(subCategoryName ? [[th ? "หมวดย่อย" : "Subcategory", subCategoryName]] : []),
                [th ? "ชำระด้วย" : "Payment", paymentName],
                [th ? "วันที่" : "Date", new Date(transaction.date).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[auto_1fr] gap-4">
                  <dt className="text-stone-500">{label}</dt>
                  <dd className="min-w-0 break-words text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <div aria-hidden="true" className="pointer-events-none relative mt-5 h-24 select-none">
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 1.35, rotate: -16 }}
                animate={{ opacity: 1, scale: 1, rotate: -7 }}
                transition={reducedMotion ? { duration: 0 } : { delay: 1.15, duration: 0.18, ease: "easeOut" }}
                className="absolute left-1 top-5 flex max-w-[65%] items-center gap-2 rounded-sm border-2 border-[#508069]/75 px-3 py-2 text-[#416b54] shadow-[inset_0_0_0_2px_#fffdf5,inset_0_0_0_3px_rgba(80,128,105,0.35)]"
              >
                <PawPrint className="h-5 w-5 shrink-0" />
                <span className="text-sm font-black">{th ? "จดให้แล้ว!" : "Noted!"}</span>
              </motion.div>
              {!reducedMotion && (
                <motion.div
                  initial={{ opacity: 0, x: 28, y: 6 }}
                  animate={{ opacity: [0, 1, 1, 1, 1, 0], x: [28, 0, -8, -8, 0, 28], y: [6, 0, -8, 3, 0, 6] }}
                  transition={{ delay: 0.55, duration: 1.6, times: [0, 0.18, 0.34, 0.4, 0.72, 1] }}
                  className="absolute left-[110px] top-0 h-20 w-20"
                >
                  <Image src="/animations/nori/cat-idle.webp" alt="" width={80} height={80} unoptimized />
                  <motion.div
                    initial={{ x: 0, y: 0, rotate: 0 }}
                    animate={{ x: [0, -12, -18, -12, 0], y: [0, -14, 10, -4, 0], rotate: [0, -25, -7, -12, 0] }}
                    transition={{ delay: 0.8, duration: 0.85, times: [0, 0.3, 0.41, 0.65, 1] }}
                    className="absolute -left-1 top-8 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#292722] text-[#e9a342]"
                    style={{ borderRadius: "50%", clipPath: "circle(50%)" }}
                  >
                    <PawPrint className="h-5 w-5" />
                  </motion.div>
                </motion.div>
              )}
            </div>

            <p className="mt-6 border-t border-dashed border-stone-300 pt-4 text-center text-[9px] uppercase tracking-widest text-stone-400">{th ? "เก็บทุกบาทไว้ในความทรงจำ" : "Every little expense, remembered."}</p>
    </ReceiptPaper>
  );
}

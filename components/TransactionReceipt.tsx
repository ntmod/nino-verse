'use client';

import ReceiptPaper from "./ReceiptPaper";
import ReceiptStamp from "./ReceiptStamp";
import { Check } from "lucide-react";
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
  const th = language === "th";
  const locale = th ? "th-TH" : "en-US";
  const { transaction, categoryName, subCategoryName, paymentName } = receipt;

  return (
    <ReceiptPaper onClose={onClose} stampDelay={1.15} title={<><Check aria-hidden="true" className="h-4 w-4" />{th ? "บันทึกเรียบร้อย" : "Transaction saved"}</>}>
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

            <ReceiptStamp />

            <p className="mt-6 border-t border-dashed border-stone-300 pt-4 text-center text-[9px] uppercase tracking-widest text-stone-400">{th ? "เก็บทุกบาทไว้ในความทรงจำ" : "Every little expense, remembered."}</p>
    </ReceiptPaper>
  );
}

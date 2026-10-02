'use client';

import { ReceiptText } from "lucide-react";
import ReceiptPaper from "@/components/ReceiptPaper";
import ReceiptStamp from "@/components/ReceiptStamp";
import { useLanguage } from "@/lib/language-context";
import { summarizeCycle } from "@/lib/cycle-summary.mjs";
import type { Transaction } from "@/lib/types";

export default function CycleReceipt({ transactions, cycle, previousTotal, onClose }: {
  transactions: Transaction[];
  cycle: { startDate: Date; endDate: Date };
  previousTotal: number;
  onClose: () => void;
}) {
  const { language, t } = useLanguage();
  const th = language === "th";
  const locale = th ? "th-TH" : "en-US";
  const summary = summarizeCycle(transactions, cycle, previousTotal);
  const money = (amount: number) => new Intl.NumberFormat(locale, {
    style: "currency", currency: "THB", currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }).format(amount);
  const date = (value: Date | string) => new Date(value).toLocaleDateString(locale, {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
  });

  return (
    <ReceiptPaper onClose={onClose} title={<><ReceiptText aria-hidden="true" className="h-4 w-4" />{t("cycle_receipt_title")}</>}>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-[#7f715d]">{date(cycle.startDate)} — {date(cycle.endDate)}</p>
      <p className="mt-2 text-center text-[10px] font-bold text-[#b97423]">
        {summary.status === 'complete' ? t("cycle_complete") : summary.status === 'upcoming' ? t("cycle_upcoming") : t("cycle_to_date")}
      </p>

      <div className="my-5 border-y border-dashed border-[#d9cebb] py-5 text-center">
        <p className="text-[10px] text-[#7f715d]">{t("total_spent")}</p>
        <p className="mt-2 break-words text-3xl font-black tracking-tight">{money(summary.total)}</p>
        <dl className="mt-4 space-y-2 text-xs">
          {[[t("cycle_expense_count"), `${summary.count} ${t("ui_items")}`],
            [t("daily_average"), money(summary.average)]].map(([label, value]) => (
            <div key={label} className="flex flex-wrap justify-between gap-2"><dt className="text-[#7f715d]">{label}</dt><dd className="font-bold">{value}</dd></div>
          ))}
        </dl>
      </div>

      {summary.count === 0 ? (
        <p className="py-4 text-center text-xs text-[#7f715d]">{t("no_expense_data")}</p>
      ) : (
        <>
          <dl className="space-y-3 text-xs">
            {summary.categories.map(category => (
              <div key={category.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                <dt className="break-words leading-relaxed">{category.name || t("cycle_uncategorized")}</dt>
                <dd className="font-bold">{money(category.amount)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 space-y-4 border-t border-dashed border-[#d9cebb] pt-4 text-xs">
            {summary.change !== null && (
              <div>
                <p className="text-[10px] text-[#7f715d]">{t("cycle_vs_previous_full")}</p>
                <p className={`mt-1 font-bold ${summary.change > 0 ? "text-[#b0523b]" : "text-[#416b54]"}`}>
                  {summary.change > 0 ? "+" : ""}{summary.change.toLocaleString(locale, { maximumFractionDigits: 1 })}%
                </p>
              </div>
            )}
            {summary.topDay && <div><p className="text-[10px] text-[#7f715d]">{t("cycle_top_day")}</p><p className="mt-1 font-bold">{date(`${summary.topDay.date}T00:00:00+07:00`)} · {money(summary.topDay.amount)}</p></div>}
            {summary.largest && <div><p className="text-[10px] text-[#7f715d]">{t("cycle_largest_expense")}</p><p className="mt-1 break-words font-bold leading-relaxed">{summary.largest.name} · {money(summary.largest.amount)}</p></div>}
          </div>
        </>
      )}
      {summary.status === 'complete' && <ReceiptStamp animated={false} label={th ? "ตรวจแล้ว · ปิดยอดแล้ว" : "Verified · Cycle closed"} />}
      <p className="mt-6 border-t border-dashed border-[#d9cebb] pt-4 text-center text-[10px] leading-relaxed text-[#7f715d]">{th ? "จดนิดหน่อย ใช้ชีวิตชัดขึ้น 🐱" : "Small notes. Clearer days. 🐱"}</p>
    </ReceiptPaper>
  );
}

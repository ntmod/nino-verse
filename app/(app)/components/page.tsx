'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { ChartNoAxesCombined, House, NotebookPen, Settings } from 'lucide-react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Dock, DockIcon } from '@/components/ui/dock';
import { Input } from '@/components/ui/input';
import { RippleButton } from '@/components/ui/ripple-button';
import BudgetListCard from '@/components/nori/BudgetListCard';
import CycleGardenCard from '@/components/nori/CycleGardenCard';
import CycleReceipt from '@/components/nori/CycleReceipt';
import ExpensePieChart from '@/components/nori/ExpensePieChart';
import FixedCostCard from '@/components/nori/FixedCostCard';
import MetricsCard from '@/components/nori/MetricsCard';
import NoriHeader from '@/components/nori/NoriHeader';
import PaymentMethodsCard from '@/components/nori/PaymentMethodsCard';
import RecentTransactionsCard from '@/components/nori/RecentTransactionsCard';
import SpendingHeatmapCard from '@/components/nori/SpendingHeatmapCard';
import TotalSpentCard from '@/components/nori/TotalSpentCard';
import LoadingScreen from '@/components/LoadingScreen';
import ReceiptStamp from '@/components/ReceiptStamp';
import TransactionReceipt from '@/components/TransactionReceipt';
import SoundToggle from '@/components/SoundToggle';
import { useLanguage } from '@/lib/language-context';
import { useModal } from '@/lib/modal-context';
import { dashboardSample } from '../preview/dashboard/demo-data';
import type { Transaction } from '@/lib/types';

const colors = [
  'background', 'card', 'secondary', 'muted', 'foreground', 'ink-soft', 'muted-foreground', 'border',
  'paper-edge', 'border-strong', 'journal-margin', 'journal-rule', 'primary', 'primary-hover', 'primary-foreground',
  'accent', 'accent-foreground', 'ring', 'highlight', 'highlight-hover', 'highlight-ink', 'highlight-foreground',
  'destructive', 'destructive-soft', 'destructive-border', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
];
const buttonVariants = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link',
  'apple-primary', 'apple-secondary', 'apple-dark-utility', 'apple-pearl'] as const;
const buttonSizes = ['xs', 'sm', 'default', 'lg', 'icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const;
const sample = dashboardSample(0);
const total = sample.total;
let runningTotal = 0;
const cumulative = sample.days.map(({ day, date, amount }) => ({
  day: day + 1, dateStr: date, dayAmount: amount, amount: runningTotal += amount,
}));
const liveExamples = [
  { path: '/home', names: 'TransactionForm · WalletPicker · LastCycleSummary', th: 'หน้าจดรายการ', en: 'Quick note' },
  { path: '/dashboard', names: 'WalletOverview · FloatingActionButton · ExpenseModal', th: 'ภาพรวม', en: 'Dashboard' },
  { path: '/analytics', names: 'CycleSpendingChart · CycleSpendingDetails', th: 'สถิติ', en: 'Analytics' },
  { path: '/note', names: 'RefundExpense', th: 'รายการที่จด', en: 'Ledger entries' },
  { path: '/settings/cycle', names: 'CycleEditor', th: 'รอบการใช้จ่าย', en: 'Spending cycles' },
];

function Example({ name, children }: { name: string; children: ReactNode }) {
  return (
    <article className="min-w-0 border-t border-border pt-4">
      <h3 className="mb-3 break-words font-mono text-xs text-muted-foreground">{name}</h3>
      {children}
    </article>
  );
}

export default function ComponentGalleryPage() {
  const { language } = useLanguage();
  const th = language === 'th';
  const { openGlobalModal } = useModal();
  const [receipt, setReceipt] = useState<Transaction | 'cycle' | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(0);
  const [loading, setLoading] = useState(false);
  const transactions = sample.records.map(record => ({
    _id: record.id, name: th ? record.name : record.en, category: sample.categories.find(category => category.id === record.category)?.[th ? 'name' : 'en'] ?? record.category,
    subCategory: th ? record.subCategory : record.subEn, amount: -record.amount,
    date: record.date, displayDate: record.date, paymentMethod: record.payment,
    icon: sample.categories.find(category => category.id === record.category)?.icon ?? "🏷️",
  }));
  const categories = sample.categories.map(category => ({
    name: th ? category.name : category.en, amount: category.spent, color: category.color,
  }));
  const budget = sample.categories.map((category, index) => ({
    _id: category.id, category: categories[index].name, limit: category.limit,
    spent: category.spent, color: category.color, icon: category.icon,
  }));
  const methods = [
    { _id: 'cash', name: th ? 'เงินสด' : 'Cash', icon: '💵', color: '#467058' },
    { _id: 'bank', name: th ? 'โอนธนาคาร' : 'Bank transfer', icon: '💳', color: '#56758c' },
  ].map(method => ({ ...method, amount: transactions.filter(tx => tx.paymentMethod === method._id).reduce((sum, tx) => sum - tx.amount, 0) }));
  const receiptData = receipt && receipt !== 'cycle' ? {
    transaction: receipt, categoryName: receipt.category, subCategoryName: receipt.subCategory,
    paymentName: methods.find(method => method._id === receipt.paymentMethod)?.name ?? receipt.paymentMethod,
  } : null;
  const dailyAverage = total / sample.days.length;
  const openExampleModal = () => openGlobalModal({
    header: th ? 'บันทึกเรียบร้อย' : 'Note saved',
    message: th ? 'ข้อความตัวอย่างสำหรับตรวจหน้าตาของกล่องแจ้งผล' : 'Sample feedback for a successful save.',
    type: 'success',
    mainButton: { label: th ? 'ปิด' : 'Close', onClick: () => {} },
  });

  return (
    <main className="notebook-page notebook-page--app min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="notebook-heading mb-8">
          <h1 className="notebook-title">{th ? 'สมุดรวมคอมโพเนนต์' : 'Component gallery'}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{th ? 'ตัวอย่างสำหรับดูธีมและลองกดเล่น' : 'Theme swatches and interactive examples.'}</p>
        </header>

        <nav aria-label={th ? 'สารบัญ' : 'Contents'} className="mb-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary underline underline-offset-4">
          <a href="#tokens">Design tokens</a><a href="#controls">{th ? 'ปุ่มและฟอร์ม' : 'Controls'}</a>
          <a href="#finances">{th ? 'รายจ่ายและงบ' : 'Spending and budgets'}</a><a href="#receipts">{th ? 'ใบเสร็จและ Nori' : 'Receipts and Nori'}</a>
          <a href="#workflows">{th ? 'หน้าที่ใช้งานจริง' : 'Live workflows'}</a>
        </nav>

        <section id="tokens" className="mb-12 scroll-mt-20">
          <h2 className="mb-4 font-heading text-2xl">Design tokens</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {colors.map(color => <li key={color} className="rounded-md border border-border bg-card p-2">
              <div aria-hidden="true" className="h-10 rounded-md border border-border" style={{ backgroundColor: `var(--${color})` }} />
              <code className="mt-2 block break-all text-xs">--{color}</code>
            </li>)}
          </ul>
          <div className="notebook-leaf mt-4 grid gap-4 p-5 sm:grid-cols-3">
            <p className="font-heading text-xl">{th ? 'สมุดรายจ่าย' : 'Spending journal'}</p>
            <p className="font-sans text-sm">{th ? 'วันนี้จดไป 3 รายการ' : '3 records today'}</p>
            <p className="font-mono text-lg tabular-nums">฿1,289.50</p>
          </div>
        </section>

        <section id="controls" className="mb-12 scroll-mt-20">
          <h2 className="mb-4 font-heading text-2xl">{th ? 'ปุ่มและฟอร์ม' : 'Controls'}</h2>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Example name="Button">
              <div className="flex flex-wrap items-center gap-3">
                {buttonVariants.map(variant => <Button type="button" variant={variant} key={variant}>{variant}</Button>)}
                <Button type="button" disabled>disabled</Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {buttonSizes.map(size => <Button type="button" size={size} variant="outline" key={size} aria-label={size}>
                  {size.startsWith('icon') ? <NotebookPen aria-hidden="true" /> : size}
                </Button>)}
              </div>
            </Example>
            <Example name="Card · Input · RippleButton">
              <Card>
                <CardHeader><CardTitle>{th ? 'จดตัวอย่าง' : 'Sample note'}</CardTitle>
                  <CardDescription>{th ? 'ลองพิมพ์หรือกดปุ่มดูได้' : 'Try typing or pressing the button.'}</CardDescription></CardHeader>
                <CardContent className="grid gap-3">
                  <label htmlFor="sample-note" className="text-sm">{th ? 'ชื่อรายการ' : 'Note title'}</label>
                  <Input id="sample-note" placeholder={th ? 'กาแฟตอนเช้า' : 'Morning coffee'} />
                  <RippleButton type="button" className="w-fit">{th ? 'ลองกด' : 'Try the ripple'}</RippleButton>
                </CardContent>
              </Card>
            </Example>
            <Example name="Dialog · GlobalModal · LoadingScreen · SoundToggle · AnimatedThemeToggler">
              <div className="flex flex-wrap items-center gap-3">
                <AnimatedThemeToggler aria-label={th ? 'สลับธีมสว่างและมืด' : 'Toggle light and dark theme'}
                  className="grid size-11 place-items-center rounded-md border border-border bg-card text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-4" />
                <Dialog>
                  <DialogTrigger asChild><Button type="button" variant="outline">Dialog</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{th ? 'จดรายการใหม่' : 'New note'}</DialogTitle>
                      <DialogDescription>{th ? 'ตัวอย่างกล่องโต้ตอบ' : 'A sample dialog.'}</DialogDescription>
                    </DialogHeader>
                    <DialogClose asChild><Button type="button">{th ? 'ปิด' : 'Close'}</Button></DialogClose>
                  </DialogContent>
                </Dialog>
                <Button type="button" variant="outline" onClick={openExampleModal}>GlobalModal</Button>
                <Button type="button" variant="outline" onClick={() => setLoadingPreview(value => value + 1)}>LoadingScreen</Button>
                <SoundToggle />
              </div>
              {loadingPreview > 0 && <LoadingScreen key={loadingPreview} mode="in" />}
            </Example>
            <Example name="Dock · DockIcon">
              <Dock className="mx-0 mt-0" iconMagnification={48}>
                <DockIcon><House aria-hidden="true" /></DockIcon>
                <DockIcon><NotebookPen aria-hidden="true" /></DockIcon>
                <DockIcon><ChartNoAxesCombined aria-hidden="true" /></DockIcon>
                <DockIcon><Settings aria-hidden="true" /></DockIcon>
              </Dock>
            </Example>
          </div>
        </section>

        <section id="finances" className="mb-12 scroll-mt-20">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl">{th ? 'รายจ่ายและงบ' : 'Spending and budgets'}</h2>
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={loading} onChange={event => setLoading(event.target.checked)} className="accent-primary" />
              {th ? 'แสดงสถานะโหลด' : 'Show loading states'}</label>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Example name="TotalSpentCard · NoriPeek"><TotalSpentCard amount={total} percentageChange={8} dailyAverage={dailyAverage}
              startDate={sample.cycle.startDate} endDate={sample.cycle.endDate} cumulativeData={cumulative} isLoading={loading} defaultExpanded /></Example>
            <Example name="SpendingHeatmapCard"><SpendingHeatmapCard transactions={transactions} cycle={sample.cycle} isLoading={loading} ready={!loading} onEdit={setReceipt} /></Example>
            <Example name="ExpensePieChart"><ExpensePieChart data={categories} isLoading={loading} /></Example>
            <Example name="BudgetListCard"><BudgetListCard budgets={budget} isLoading={loading} /></Example>
            <Example name="MetricsCard"><MetricsCard dailyAverage={dailyAverage} todayUsage={sample.days.at(-1)?.amount} isLoading={loading} /></Example>
            <Example name="PaymentMethodsCard"><PaymentMethodsCard methods={methods} isLoading={loading} /></Example>
            <Example name="RecentTransactionsCard"><RecentTransactionsCard transactions={transactions.slice(-5).reverse()} isLoading={loading} /></Example>
            <Example name="FixedCostCard"><FixedCostCard items={[
              { id: 'rent', name: th ? 'ค่าเช่า' : 'Rent', amount: 7500, isPaid: true, icon: '🏡' },
              { id: 'internet', name: th ? 'ค่าอินเทอร์เน็ต' : 'Internet', amount: 599, isPaid: true, icon: '🌐' },
            ]} onSuccess={() => {}} isLoading={loading} /></Example>
          </div>
        </section>

        <section id="receipts" className="mb-12 scroll-mt-20">
          <h2 className="mb-4 font-heading text-2xl">{th ? 'ใบเสร็จและ Nori' : 'Receipts and Nori'}</h2>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Example name="TransactionReceipt · CycleReceipt · ReceiptPaper · ReceiptStamp">
              <div className="notebook-leaf flex flex-wrap items-center gap-3 p-5">
                <Button type="button" variant="outline" onClick={() => setReceipt(transactions[0])}>{th ? 'ใบเสร็จรายการ' : 'Transaction receipt'}</Button>
                <Button type="button" variant="outline" onClick={() => setReceipt('cycle')}>{th ? 'ใบสรุปรอบ' : 'Cycle receipt'}</Button>
                <div className="w-full"><ReceiptStamp animated={false} /></div>
              </div>
            </Example>
            <Example name="NoriHeader"><NoriHeader total={total} count={transactions.length} previousTotal={total / 1.08}
              topCategory={categories[0]} bills={2} paidBills={2} loading={false} ready /></Example>
            <div className="lg:col-span-2">
              <Example name="CycleGardenCard · NoriGardenActor"><CycleGardenCard transactions={transactions} cycle={sample.cycle} isLoading={false} ready onEdit={setReceipt} /></Example>
            </div>
          </div>
        </section>

        <section id="workflows" className="scroll-mt-20">
          <h2 className="mb-4 font-heading text-2xl">{th ? 'หน้าที่ใช้งานจริง' : 'Live workflows'}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{th ? 'คอมโพเนนต์ที่ต้องใช้ข้อมูลบัญชี เปิดดูได้จากหน้าของมัน' : 'Open these components in the screens that supply account data.'}</p>
          <ul className="notebook-leaf divide-y divide-border">
            {liveExamples.map(({ path, names, th: thai, en }) => <li key={path}>
              <Link href={path} className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-secondary">
                <span className="font-semibold text-primary">{th ? thai : en}</span>
                <span className="font-mono text-xs text-muted-foreground">{names}</span>
              </Link>
            </li>)}
          </ul>
        </section>
      </div>
      {receiptData && <TransactionReceipt receipt={receiptData} onClose={() => setReceipt(null)} />}
      {receipt === 'cycle' && <CycleReceipt transactions={transactions} cycle={sample.cycle} previousTotal={total / 1.08} onClose={() => setReceipt(null)} />}
    </main>
  );
}

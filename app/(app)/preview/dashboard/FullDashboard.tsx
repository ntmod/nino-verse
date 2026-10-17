'use client';

// Complete information coverage for the dashboard redesign. All edits are local demo state.
import { useState, type FormEvent } from 'react';
import { Dialog } from 'radix-ui';
import { ArrowUpRight, Check, ChevronDown, CreditCard, ReceiptText, RotateCcw, Settings2, Wallet, X } from 'lucide-react';
import SpendingHeatmapCard from '@/components/nori/SpendingHeatmapCard';
import CycleGardenCard from '@/components/nori/CycleGardenCard';
import NoriHeader from '@/components/nori/NoriHeader';
import CycleReceipt from '@/components/nori/CycleReceipt';
import { cycleDays } from '@/lib/spending-cycle.js';
import type { Transaction } from '@/lib/types';
import { dashboardSample, type DashboardSample, type DemoRecord } from './demo-data';
import { Card, SectionLabel, money, shortDate } from './ConceptParts';
import FullTrend from './FullTrend';
import styles from './concepts.module.css';

type LocalRecord = DemoRecord & { billId?: string };
const bills = [
  { id:'internet', name:'Internet', en:'Internet', amount:590 },
  { id:'music', name:'ฟังเพลง', en:'Music subscription', amount:129 },
  { id:'rent', name:'ค่าเช่าห้อง', en:'Rent', amount:6500 },
];

function EditRecord({ record, th, onSave, onClose }: { record: LocalRecord; th: boolean; onSave: (record: LocalRecord) => void; onClose: () => void }) {
  const [name,setName] = useState(th ? record.name : record.en);
  const [amount,setAmount] = useState(String(record.amount));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    onSave({ ...record, ...(th ? { name } : { en:name }), amount:Math.round(value*100)/100 });
  };
  return <Dialog.Root open onOpenChange={open => { if(!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[20000] bg-[#30382c]/30 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[20001] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#dce3d2] bg-[#fffffb] p-6 text-[#414a38] shadow-xl"><Dialog.Title className="pr-8 text-lg font-semibold">{th ? 'รายละเอียดรายการ' : 'Record details'}</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-6 text-[#a0a394]">{shortDate(record.date,th)} · {th ? 'ทดลองแก้ได้ในหน้านี้ ไม่บันทึกบัญชีจริง' : 'Try editing here. No real account is changed.'}</Dialog.Description><Dialog.Close aria-label={th?'ปิด':'Close'} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-[#a0a394]"><X size={16}/></Dialog.Close><form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-xs">{th?'ชื่อรายการ':'Description'}<input required value={name} onChange={event=>setName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#e1e7d7] bg-[#f6f7f0] px-3 text-sm" /></label><label className="block text-xs">{th?'จำนวนเงิน':'Amount'}<input required type="number" min="0.01" step="0.01" value={amount} onChange={event=>setAmount(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#e1e7d7] bg-[#f6f7f0] px-3 font-mono text-lg" /></label><button type="submit" className="min-h-11 w-full rounded-xl bg-[#627c55] text-xs font-medium text-white">{th?'บันทึกตัวอย่าง':'Save demo edit'}</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export default function FullDashboard({ sample, th, offset }: { sample: DashboardSample; th: boolean; offset: number }) {
  const [records,setRecords] = useState<LocalRecord[]>(sample.records);
  const [editing,setEditing] = useState<LocalRecord|null>(null);
  const [paid,setPaid] = useState<string[]>([]);
  const [receipt,setReceipt] = useState(false);
  const [compare,setCompare] = useState(false);
  const [averageSettings,setAverageSettings] = useState(false);
  const [averageCategories,setAverageCategories] = useState(sample.categories.map(category=>category.id));
  const [dailyLimit,setDailyLimit] = useState(500);
  const [filter,setFilter] = useState<string|null>(null);
  const [notice,setNotice] = useState('');
  const previous = dashboardSample(offset-1,true);
  const total = records.reduce((sum,record)=>sum+Math.round(record.amount*100),0)/100;
  const categories = sample.categories.map(category=>({ ...category, spent:records.filter(record=>record.category===category.id).reduce((sum,record)=>sum+Math.round(record.amount*100),0)/100 }));
  const elapsed = sample.days.length;
  const totalDays = cycleDays(sample.cycle);
  const asOf = sample.days[elapsed-1];
  const allowed = averageCategories.length ? averageCategories : sample.categories.map(category=>category.id);
  const averageRecords = records.filter(record=>allowed.includes(record.category));
  const average = averageRecords.reduce((sum,record)=>sum+Math.round(record.amount*100),0)/100/elapsed;
  const today = averageRecords.filter(record=>record.day===elapsed-1).reduce((sum,record)=>sum+Math.round(record.amount*100),0)/100;
  const projected = average*totalDays;
  const change = (total-previous.total)/previous.total*100;
  const biggest = [...categories].sort((a,b)=>b.spent-a.spent)[0];
  const toTransaction = (record: LocalRecord): Transaction => ({ _id:record.id, name:th?record.name:record.en, category:record.category, subCategory:record.subCategory, amount:-record.amount, date:record.date, displayDate:shortDate(record.date,th), paymentMethod:record.payment });
  const transactions = records.map(toTransaction);
  const openTransaction = (transaction: Transaction) => setEditing(records.find(record=>record.id===transaction._id) ?? null);
  const selectedRecords = records.filter(record=>!filter||record.category===filter).slice().sort((a,b)=>b.day-a.day||b.id.localeCompare(a.id));
  const payBill = (id:string) => {
    if(paid.includes(id)) return;
    const bill=bills.find(item=>item.id===id)!;
    setPaid(values=>[...values,id]);
    setRecords(values=>[...values,{ id:`bill-${id}-${values.length}`, billId:id, name:bill.name, en:bill.en, category:'home', subCategory:'ค่าใช้จ่ายประจำ', subEn:'Recurring', amount:bill.amount, day:elapsed-1, date:asOf.date, payment:'bank' }]);
    setNotice(th?'เพิ่มค่าใช้จ่ายประจำในข้อมูลตัวอย่างแล้ว':'Added the commitment to this demo’s records.');
  };
  const accounts = [{id:'cash',name:th?'เงินสด':'Cash',balance:2540,icon:Wallet},{id:'bank',name:th?'บัญชีธนาคาร':'Bank account',balance:38750,icon:CreditCard}];
  const spendingFor = (method:string) => records.filter(record=>record.payment===method).reduce((sum,record)=>sum+Math.round(record.amount*100),0)/100;
  const sectionTitle = (id:string, title:string, subtitle:string) => <header className="flex flex-wrap items-end justify-between gap-3"><div><h2 id={id} className="text-lg font-semibold">{title}</h2><p className="mt-1 text-xs text-[#a0a394]">{subtitle}</p></div></header>;

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#a0a394]"><span>{th?'ข้อมูลตัวอย่าง ณ':'Sample through'} {shortDate(asOf.date,th)} · {elapsed}/{totalDays} {th?'วันในรอบ':'cycle days'}</span><button type="button" onClick={()=>setReceipt(true)} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#e0e5d7] bg-[#fffffb] px-4 text-[#879775]"><ReceiptText size={14}/>{th?'พิมพ์สรุปรอบ':'Print cycle summary'}</button></div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <section className="rounded-2xl border border-[#d5dfca] bg-[#e3ebd8] p-6 col-span-2 lg:col-span-1 sm:p-7"><SectionLabel>{th?'รายจ่ายในรอบที่เลือก':'Spending this cycle'}</SectionLabel><p className="mt-4 font-mono text-4xl font-medium tracking-tight text-[#526b46]">{money(total)}<span className="ml-2 text-lg text-[#93a481]">฿</span></p><p className="mt-3 text-[10px] text-[#8c9f78]">{change>0?'+':''}{change.toFixed(1)}% {th?'เทียบรอบก่อนเต็มรอบ':'vs. previous full cycle'}</p><div className="mt-5 h-1.5 overflow-hidden rounded-[999px] bg-[#f4f7ec]"><div className="h-full bg-[#9bad85]" style={{width:`${elapsed/totalDays*100}%`}}/></div><p className="mt-2 text-[10px] text-[#93a481]">{th?'ความคืบหน้ารอบ':'Cycle progress'} · {Math.round(elapsed/totalDays*100)}%</p></section>
      <Card><SectionLabel>{th?'รายการรายจ่าย':'Expense records'}</SectionLabel><p className="mt-4 font-mono text-4xl">{records.length}</p><p className="mt-3 text-xs text-[#a0a394]">{th?'รายการในรอบนี้':'notes in this cycle'}</p><div className="mt-6 flex items-center gap-2 text-[10px] text-[#9aa88a]"><Check size={13}/>{th?'ยอดรายจ่ายแยกจากรายรับ':'Expenses are separate from income'}</div></Card>
      <Card><SectionLabel>{th?'งบในหมวดที่ตั้งไว้':'Category budget remaining'}</SectionLabel><p className={`mt-4 font-mono text-3xl ${sample.budget-total<0?'text-[#b6846f]':'text-[#6b8157]'}`}>{money(sample.budget-total)}<span className="ml-1 text-sm">฿</span></p><p className="mt-3 text-xs text-[#a0a394]">{th?'จากวงเงินรายหมวดรวม':'Of category limits totaling'} {money(sample.budget)} ฿</p><p className="mt-5 text-[10px] text-[#a9b29a]">{th?'ยอดเหลือในงบ ไม่ใช่ยอดเงินในบัญชี':'Budget room, separate from account balances'}</p></Card>
    </div>

    <section aria-labelledby="full-patterns" className="space-y-4">{sectionTitle('full-patterns',th?'เห็นจังหวะการใช้เงิน':'Understand your spending',th?'ยอดสะสม ค่าเฉลี่ย และรายละเอียดในแต่ละวัน':'The running total, daily averages, and the detail behind them')}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"><Card><FullTrend records={records} sample={sample} previous={previous} th={th}/></Card><Card><div className="flex items-start justify-between gap-3"><div><SectionLabel>{th?'ค่าเฉลี่ยรายวัน':'Daily average'}</SectionLabel><p className="mt-3 font-mono text-3xl">{money(average)} <small className="text-xs text-[#a0a394]">฿ / {th?'วัน':'day'}</small></p></div><button type="button" aria-label={th?'ตั้งค่าฐานค่าเฉลี่ย':'Configure the daily average'} aria-expanded={averageSettings} onClick={()=>setAverageSettings(value=>!value)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4f6ee] text-[#9aa88a]"><Settings2 size={16}/></button></div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-y border-[#eff0e9] py-4"><div><SectionLabel>{th?'วันนี้ (ตัวอย่าง)':'Today (sample)'}</SectionLabel><p className="mt-2 font-mono text-lg">{money(today)} ฿</p></div><div><SectionLabel>{th?'ประมาณการจบรอบ':'Projected cycle end'}</SectionLabel><p className="mt-2 font-mono text-lg">{money(projected)} ฿</p></div></div>
        <div className="mt-4 flex items-center justify-between gap-3 text-[11px]"><span className={average>dailyLimit?'text-[#b6846f]':'text-[#8fa27e]'}>{average>dailyLimit?(th?'เกิน daily limit':'Above daily limit'):(th?'อยู่ใน daily limit':'Within daily limit')}</span><span className="font-mono text-[#a0a394]">{money(dailyLimit)} ฿/{th?'วัน':'day'}</span></div>
        <details className="mt-4 border-t border-[#eff0e9] pt-3"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[11px] text-[#9aa88a]">{th?'ค่าเฉลี่ยแยกหมวด':'Average by category'}<ChevronDown size={13}/></summary><div className="space-y-3 pb-2">{categories.filter(category=>allowed.includes(category.id)).map(category=><div key={category.id} className="flex justify-between gap-3 text-[11px]"><span className="text-[#a0a394]">{category.icon} {th?category.name:category.en}</span><span className="font-mono">{money(category.spent/elapsed)} ฿</span></div>)}</div></details>
        {averageSettings&&<fieldset className="mt-3 space-y-3 rounded-xl bg-[#f4f6ee] p-4"><legend className="sr-only">{th?'ตั้งค่าค่าเฉลี่ยตัวอย่าง':'Demo daily-average settings'}</legend><p className="text-[10px] leading-5 text-[#a0a394]">{th?'หมวดที่ใช้เป็นฐานค่าเฉลี่ย · ไม่เลือก = ทุกหมวด':'Categories used for this average · none selected = all'}</p>{categories.map(category=><label key={category.id} className="flex min-h-9 items-center gap-2 text-[11px]"><input type="checkbox" checked={averageCategories.includes(category.id)} onChange={()=>setAverageCategories(values=>values.includes(category.id)?values.filter(id=>id!==category.id):[...values,category.id])} className="accent-[#8a9f79]"/>{th?category.name:category.en}</label>)}<label className="block text-[11px]">Daily limit (฿)<input type="number" min={1} value={dailyLimit} onChange={event=>setDailyLimit(Math.max(1,Number(event.target.value)||1))} className="mt-2 min-h-11 w-full rounded-xl border border-[#dfe5d5] bg-white px-3 font-mono"/></label></fieldset>}
      </Card></div>
    </section>

    <section aria-labelledby="full-budgets" className="space-y-4">{sectionTitle('full-budgets',th?'จัดพื้นที่ให้เรื่องสำคัญ':'Make room for what matters',th?'วงเงินรายหมวด และสัดส่วนที่ใช้จริง':'Category limits and where your spending went')}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"><Card><h3 className="text-sm font-semibold">{th?'งบรายหมวด':'Category budgets'}</h3><div className="mt-5 space-y-5">{categories.map(category=><div key={category.id}><div className="mb-2 flex flex-wrap justify-between gap-2 text-[11px]"><span>{category.icon} {th?category.name:category.en}</span><span className="font-mono text-[#a0a394]">{money(category.spent)} / {money(category.limit)}</span></div><div className="h-1.5 overflow-hidden rounded-[999px] bg-[#f1f3eb]"><div className="h-full rounded-[999px]" style={{width:`${Math.min(100,category.spent/category.limit*100)}%`,background:category.spent>category.limit?'#bd8c76':category.color}}/></div><p className={`mt-2 text-right text-[9px] ${category.spent>category.limit?'text-[#bd8c76]':'text-[#a9b29a]'}`}>{category.spent>category.limit?(th?'เกินงบ ':'Over budget by '):(th?'ยังเหลือ ':'Remaining ')}{money(Math.abs(category.limit-category.spent))} ฿</p></div>)}</div></Card>
      <Card><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">{th?'รายจ่ายแยกตามหมวด':'Spending by category'}</h3><button type="button" aria-pressed={compare} onClick={()=>setCompare(value=>!value)} className="min-h-11 rounded-xl bg-[#f4f6ee] px-3 text-[10px] text-[#95a385]">{th?'เทียบรอบก่อน':'Compare previous'}</button></div><div aria-hidden="true" className="mt-5 flex h-6 overflow-hidden rounded-xl">{categories.map(category=><div key={category.id} style={{width:`${category.spent/total*100}%`,background:category.color}}/>)}</div><p className="mt-3 text-[10px] text-[#a9b29a]">{th?'แตะหมวดเพื่อกรองรายการล่าสุด':'Tap a category to filter recent records'}</p><div className="mt-2">{categories.map(category=>{const prior=previous.categories.find(item=>item.id===category.id)!;return <button key={category.id} type="button" aria-pressed={filter===category.id} onClick={()=>setFilter(value=>value===category.id?null:category.id)} className={`flex min-h-16 w-full items-center gap-3 rounded-xl px-2 py-3 text-left ${filter===category.id?'bg-[#eef3e7]':''}`}><span className="h-2 w-2 shrink-0 rounded-[999px]" style={{background:category.color}}/><span className="min-w-0 flex-1"><span className="block text-xs">{th?category.name:category.en}</span>{compare&&<span className="mt-1 block text-[9px] text-[#a9b29a]">{th?'รอบก่อนเต็มรอบ':'Previous full cycle'} · {money(prior.spent)} ฿</span>}</span><span className="text-right"><span className="block font-mono text-xs">{money(category.spent)} ฿</span><span className="mt-1 block text-[9px] text-[#a9b29a]">{Math.round(category.spent/total*100)}%</span></span><ArrowUpRight size={12} className="text-[#b4bda7]"/></button>;})}</div></Card></div>
    </section>

    <section aria-labelledby="full-daily" className="space-y-4">{sectionTitle('full-daily',th?'เปิดดูวันและรายการที่จด':'A closer look at your days',th?'แตะวันที่หรือรายการเพื่อดูและทดลองแก้ไข':'Select a day or record to view and try an edit')}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"><div className={styles.legacyCard}><SpendingHeatmapCard transactions={transactions} cycle={sample.cycle} isLoading={false} ready onEdit={openTransaction}/></div><Card><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{filter?categories.find(item=>item.id===filter)?.[th?'name':'en']:(th?'5 รายการล่าสุด':'5 recent records')}</h3>{filter&&<button type="button" onClick={()=>setFilter(null)} className="min-h-11 text-[10px] text-[#95a385] underline">{th?'ล้างตัวกรอง':'Clear filter'}</button>}</div><ul className="mt-3 divide-y divide-[#eff0e9]">{selectedRecords.slice(0,5).map(record=>{const category=categories.find(item=>item.id===record.category)!;return <li key={record.id}><button type="button" onClick={()=>setEditing(record)} className="flex min-h-20 w-full items-start gap-3 py-4 text-left"><span aria-hidden="true" className="pt-1 text-lg">{category.icon}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{th?record.name:record.en}</span><span className="mt-1 block text-[9px] leading-5 text-[#a9b29a]">{th?category.name:category.en} / {th?record.subCategory:record.subEn}<br/>{shortDate(record.date,th)} · {record.payment==='cash'?(th?'เงินสด':'Cash'):(th?'ธนาคาร':'Bank')}</span></span><span className="shrink-0 pt-1 font-mono text-[11px]">−{money(record.amount)}</span></button></li>;})}</ul></Card></div>
    </section>

    <section aria-labelledby="full-accounts" className="space-y-4">{sectionTitle('full-accounts',th?'บัญชีและเรื่องที่ต้องดูแล':'Accounts and commitments',th?'ยอดใช้ในรอบ แยกจากยอดเงินคงเหลือปัจจุบัน':'Cycle spending alongside current account balances')}
      <div className="grid items-start gap-5 lg:grid-cols-2"><Card><h3 className="text-sm font-semibold">{th?'วิธีจ่ายและบัญชี':'Payment methods & accounts'}</h3><div className="mt-5 space-y-4">{accounts.map(account=>{const Icon=account.icon;const balance=account.balance-(spendingFor(account.id)-sample.records.filter(record=>record.payment===account.id).reduce((sum,record)=>sum+record.amount,0));return <div key={account.id} className="rounded-xl border border-[#e5eadc] p-4"><div className="flex items-center gap-2 text-xs"><Icon size={16} className="text-[#9ba98a]"/>{account.name}</div><div className="mt-4 grid grid-cols-2 gap-3"><div><SectionLabel>{th?'ใช้ในรอบนี้':'Spent this cycle'}</SectionLabel><p className="mt-2 font-mono text-lg">{money(spendingFor(account.id))} ฿</p></div><div><SectionLabel>{th?'คงเหลือปัจจุบัน':'Current balance'}</SectionLabel><p className="mt-2 font-mono text-lg text-[#7d946d]">{money(balance)} ฿</p></div></div></div>;})}</div><p className="mt-4 text-right font-mono text-[10px] text-[#a9b29a]">{th?'ยอดใช้รวมทุกวิธีจ่าย':'Total spent across methods'} · {money(total)} ฿</p></Card>
      <Card><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">{th?'ค่าใช้จ่ายประจำ':'Fixed costs'}</h3><button type="button" onClick={()=>{setPaid([]);setNotice(th?'รีเซ็ตสถานะแล้ว รายการที่จดยังอยู่':'Status reset. Recorded expenses are kept.');}} className="flex min-h-11 items-center gap-1.5 text-[10px] text-[#a0ad90]"><RotateCcw size={12}/>{th?'รีเซ็ตสถานะ':'Reset status'}</button></div><p className="mt-1 text-[11px] text-[#a9b29a]">{th?'จ่ายแล้ว':'Paid'} {paid.length}/{bills.length} · {th?'รวมตามแผน':'Planned total'} {money(bills.reduce((sum,bill)=>sum+bill.amount,0))} ฿</p><ul className="mt-4 divide-y divide-[#eff0e9]">{bills.map(bill=><li key={bill.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="text-xs">{th?bill.name:bill.en}</p><p className="mt-2 font-mono text-sm text-[#a0a394]">{money(bill.amount)} ฿</p></div><button type="button" disabled={paid.includes(bill.id)} onClick={()=>payBill(bill.id)} className={`flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[10px] ${paid.includes(bill.id)?'bg-[#edf3e5] text-[#8da47a]':'bg-[#f5f3e9] text-[#b09c76]'}`}>{paid.includes(bill.id)&&<Check size={12}/ >}{paid.includes(bill.id)?(th?'จ่ายแล้ว':'Paid'):(th?'จดว่าจ่ายแล้ว':'Record payment')}</button></li>)}</ul><p className="mt-2 text-[9px] leading-5 text-[#a9b29a]">{th?'ลองจ่ายแล้วจะเพิ่มรายจ่ายในตัวอย่างนี้เท่านั้น':'Recording a payment adds an expense only to this demo.'}</p></Card></div>
    </section>

    <section aria-labelledby="full-garden" className="space-y-4">{sectionTitle('full-garden',th?'สวนเล็ก ๆ ข้างสมุด':'A garden beside your notes',th?'โตจากวันที่กลับมาจด ไม่ได้โตตามยอดเงิน':'Grown from recorded days, never from how much you spend')}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"><div className={styles.legacyCard}><CycleGardenCard transactions={transactions} cycle={sample.cycle} isLoading={false} ready onEdit={openTransaction}/></div><Card><NoriHeader total={total} count={records.length} previousTotal={previous.total} topCategory={{name:th?biggest.name:biggest.en,amount:biggest.spent}} bills={bills.length} paidBills={paid.length} loading={false} ready/><div className="mt-6 flex justify-between gap-3 border-t border-[#eff0e9] pt-4 text-[11px] text-[#a9b29a]"><span>{th?'วันที่กลับมาจด':'Days with notes'}</span><span className="font-mono">{sample.days.length} / {totalDays}</span></div></Card></div>
    </section>
    {notice&&<p role="status" className="rounded-xl bg-[#eef3e6] px-4 py-3 text-xs text-[#93a382]">{notice}</p>}
    {editing&&<EditRecord key={editing.id} record={editing} th={th} onSave={record=>{setRecords(values=>values.map(item=>item.id===record.id?record:item));setEditing(null);setNotice(th?'แก้ไขข้อมูลตัวอย่างแล้ว':'Demo record updated.');}} onClose={()=>setEditing(null)}/>}
    {receipt&&<CycleReceipt cycle={sample.cycle} previousTotal={previous.total} transactions={transactions.map(transaction=>({...transaction,category:categories.find(category=>category.id===transaction.category)?.[th?'name':'en']??transaction.category}))} onClose={()=>setReceipt(false)}/>}
  </div>;
}

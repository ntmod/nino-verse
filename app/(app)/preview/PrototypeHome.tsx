'use client';

// Throwaway prototype: compare a writing desk, an overview, and a ledger at /preview?variant=A|B|C|D|E.
// All records are fictional and edits exist only in this mounted page.
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PrototypeSwitcher from './PrototypeSwitcher';
import { ArrowDownLeft, ArrowRight, Check, Coffee, Plus, Sprout, Wallet } from 'lucide-react';

type Variant = 'A' | 'B' | 'C' | 'D' | 'E';
type Entry = { id: number; name: string; amount: number; category: string; payment: string; today: boolean };
const variants: Variant[] = ['A', 'B', 'C', 'D', 'E'];
const names = { A: 'Writing desk', B: 'At a glance', C: 'The ledger', D: 'Quick capture', E: 'Daily pocket' };
const options = variants.map(key => ({ key, label: names[key] }));
const initial: Entry[] = [
  { id: 1, name: 'ข้าวกลางวัน', amount: 85, category: 'อาหาร', payment: 'เงินสด', today: true },
  { id: 2, name: 'กาแฟระหว่างทาง', amount: 65, category: 'อาหาร', payment: 'เงินสด', today: true },
  { id: 3, name: 'เดินทางกลับบ้าน', amount: 42, category: 'เดินทาง', payment: 'บัญชีธนาคาร', today: true },
  { id: 4, name: 'ของเข้าบ้าน', amount: 320, category: 'ของใช้', payment: 'บัญชีธนาคาร', today: false },
  { id: 5, name: 'มื้อเย็นกับเพื่อน', amount: 240, category: 'อาหาร', payment: 'เงินสด', today: false },
];
const money = (value: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(value);
const paper = 'border border-[#ddd4c4] bg-[#fffdf7] shadow-[2px_3px_0_#e9e1d2]';
const label = 'font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a7d65]';

export default function PrototypeHome({ variant }: { variant: Variant }) {
  const [entries, setEntries] = useState(initial);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('อาหาร');
  const [payment, setPayment] = useState('เงินสด');
  const [saved, setSaved] = useState(false);
  const [pocketTab, setPocketTab] = useState<'record' | 'overview' | 'garden'>('record');
  const extra = entries.filter(entry => entry.id > 5).reduce((sum, entry) => sum + entry.amount, 0);
  const spent = 8240 + extra;
  const remaining = 15000 - spent;
  const today = entries.filter(entry => entry.today).reduce((sum, entry) => sum + entry.amount, 0);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setEntries(previous => [{ id: Math.max(...previous.map(entry => entry.id)) + 1, name: name.trim() || category, amount: value, category, payment, today: true }, ...previous]);
    setName(''); setAmount(''); setSaved(true);
  };
  const form = <form onSubmit={submit} className={`${paper} p-5 sm:p-7`}>
    <div className="flex items-center justify-between"><span className={label}>A little note</span><Plus size={17} className="text-[#a27c40]" /></div>
    <h2 className="mt-3 text-xl font-bold">วันนี้จ่ายอะไรไปบ้าง?</h2>
    <p className="mt-1 text-xs text-[#94866d]">จดไว้สักนิด แล้วไปใช้ชีวิตต่อ</p>
    <label className="mt-6 block text-xs text-[#8a7d65]" htmlFor="preview-amount">จำนวนเงิน · บาท</label>
    <div className="mt-1 flex items-center gap-3 border-b-2 border-[#d9cdb8]"><span className="text-2xl text-[#b9aa8d]">฿</span><input id="preview-amount" required type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={event => { setAmount(event.target.value); setSaved(false); }} placeholder="0" className="min-w-0 w-full bg-transparent py-3 font-mono text-4xl outline-none placeholder:text-[#d2c8b6] focus:border-[#ac7936]" /></div>
    <label htmlFor="preview-name" className="mt-5 block text-xs">รายการ</label>
    <input id="preview-name" value={name} onChange={event => setName(event.target.value)} placeholder="เช่น ข้าวกลางวัน" className="mt-2 min-h-11 w-full border border-[#ded5c5] bg-[#faf7ef] px-3 text-sm outline-offset-2 focus:outline-[#ad823f]" />
    <div className="mt-4 grid grid-cols-2 gap-3">
      <label className="text-xs">หมวดหมู่<select value={category} onChange={event => setCategory(event.target.value)} className="mt-2 min-h-11 w-full border border-[#ded5c5] bg-[#faf7ef] px-2">{['อาหาร', 'เดินทาง', 'ของใช้', 'ความสุข'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-xs">จ่ายจาก<select value={payment} onChange={event => setPayment(event.target.value)} className="mt-2 min-h-11 w-full border border-[#ded5c5] bg-[#faf7ef] px-2">{['เงินสด', 'บัญชีธนาคาร'].map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <button type="submit" className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 bg-[#4d654b] px-4 py-3 text-sm font-bold text-white hover:bg-[#3d523b]"><Plus size={16} />จดรายการนี้</button>
    <p role="status" className="mt-3 min-h-4 text-center text-[11px] text-[#64815c]">{saved ? '✓ เพิ่มรายการตัวอย่างแล้ว จดต่อได้เลย' : 'ทดลองจดได้ · ไม่บันทึกลงบัญชีจริง'}</p>
  </form>;
  const ledger = <section className={`${paper} overflow-hidden`}>
    <div className="flex items-center justify-between border-b border-[#e7dfd0] p-5 sm:px-7"><div><p className={label}>Pages of your day</p><h2 className="mt-2 text-lg font-bold">รายการที่เพิ่งจด</h2></div><span className="text-[11px] text-[#94866d]">{entries.length} รายการตัวอย่าง</span></div>
    {entries.map((entry, index) => <div key={entry.id}>
      {(index === 0 || entries[index - 1].today !== entry.today) && <p className="bg-[#f5f0e4] px-5 py-2 text-[10px] font-bold text-[#96866b] sm:px-7">{entry.today ? 'วันนี้' : 'เมื่อวาน'}</p>}
      <div className="flex items-center gap-3 border-b border-dashed border-[#e9e0d1] px-5 py-4 last:border-0 sm:px-7"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1ebdc] text-[#9a8053]">{entry.category === 'อาหาร' ? <Coffee size={17} /> : <ArrowDownLeft size={17} />}</div><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{entry.name}</p><p className="mt-1 text-[10px] text-[#a09278]">{entry.category} · {entry.payment}</p></div><span className="shrink-0 font-mono text-sm">−{money(entry.amount)} <small className="text-[#a09278]">฿</small></span></div>
    </div>)}
    <Link href="/note" className="flex min-h-12 items-center justify-center gap-2 text-xs text-[#88714a] hover:bg-[#f5f0e4]">เปิดสมุดจริง<ArrowRight size={13} /></Link>
  </section>;
  const budget = <section className={`${paper} p-5 sm:p-7`}><p className={label}>Room to breathe</p><h2 className="mt-2 text-lg font-bold">พื้นที่ในงบของเรา</h2><div className="mt-5 space-y-5">{[{name:'อาหาร',used:3240,max:5000},{name:'เดินทาง',used:1600,max:2500},{name:'ความสุข',used:900,max:2000}].map(item => <div key={item.name}><div className="mb-2 flex justify-between text-xs"><span>{item.name}</span><span className="font-mono text-[#93856d]">{money(item.used)} / {money(item.max)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#ebe5d7]"><div style={{width:`${item.used/item.max*100}%`}} className="h-full rounded-full bg-[#9aaa7b]" /></div></div>)}</div><p className="mt-5 border-t border-dashed border-[#ddd4c4] pt-4 text-[10px] text-[#97896f]">กราฟงบเป็นข้อมูลตัวอย่างคงที่</p></section>;
  const garden = <section className="flex items-center gap-5 border border-[#d8dfca] bg-[#edf0e3] p-5 sm:p-7"><div className="flex-1"><p className={`${label} !text-[#7c8c65]`}>A little garden</p><h2 className="mt-2 text-base font-bold text-[#536647]">ค่อย ๆ จด ค่อย ๆ โต</h2><p className="mt-2 text-xs leading-6 text-[#7c896b]">ไม่ต้องเป๊ะทุกวัน แค่กลับมาจดก็พอแล้ว</p><p className="mt-3 flex items-center gap-2 text-[10px] text-[#7c896b]"><Sprout size={13} />จดแล้ว 12 วันในรอบนี้ · ตัวอย่าง</p></div><Image src="/animations/nori/teftel-cat-18.webp" alt="Nori อยู่เป็นเพื่อนข้างสมุด" width={95} height={95} className="h-20 w-20 object-contain sm:h-24 sm:w-24" /></section>;
  const stats = <div className="grid grid-cols-3 divide-x divide-[#ded5c5] border-y border-[#ded5c5] py-5 sm:py-7">{[{name:'ใช้ไปในรอบนี้',value:spent},{name:'งบที่ยังเหลือ',value:remaining},{name:'วันนี้ใช้ไป',value:today}].map((item,index) => <div key={item.name} className="px-3 first:pl-0 sm:px-7"><p className="text-[10px] text-[#94866d] sm:text-xs">{item.name}</p><p className={`mt-2 font-mono text-xl font-medium sm:text-3xl ${index===1?'text-[#5d7650]':''}`}>{money(item.value)}<span className="ml-1 text-xs text-[#a79b83]">฿</span></p></div>)}</div>;
  return <main className="min-h-screen bg-[#f5f1e7] px-4 pb-32 pt-4 text-[#423c30] sm:px-8 sm:pt-8">
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[#d9cdb8] pb-4 text-[10px] text-[#95846a]"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#b48b47]" />DESIGN PREVIEW · {variant} / {names[variant]} · ข้อมูลสมมติ</span><Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 hover:underline">กลับ Dashboard<ArrowRight size={12} /></Link><Link href="/preview/dashboard" className="inline-flex min-h-11 items-center gap-2 hover:underline">Dashboard preview<ArrowRight size={12} /></Link></div>
      {variant === 'A' ? <>
        <header className="mb-8 flex items-end justify-between gap-4"><div><p className={label}>Your everyday companion</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">สมุดเล่มเล็ก ของทุกวัน<span className="text-[#a8b18c]">.</span></h1><p className="mt-3 text-xs text-[#94866d]">แวะมาจด แล้วปล่อยให้ตัวเลขเล่าเรื่องเอง</p></div><span className="hidden rotate-[-5deg] border border-[#d5c8ae] bg-[#eee5d2] px-4 py-2 text-[10px] text-[#8c7751] sm:block">one note at a time</span></header>
        {stats}<div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]"><div className="order-2 min-w-0 space-y-6 lg:order-1">{ledger}{budget}{garden}</div><aside className="order-1 min-w-0 lg:sticky lg:top-24 lg:order-2">{form}</aside></div>
      </> : variant === 'B' ? <>
        <header className="mb-8"><p className={label}>A calm overview</p><h1 className="mt-3 text-3xl font-bold">วันนี้ ยังมีพื้นที่ให้ใช้ชีวิต</h1></header>
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]"><section className="relative overflow-hidden bg-[#4d654b] p-7 text-[#fffdf5] sm:p-10"><Wallet className="mb-6 opacity-60" size={22} /><p className="text-sm text-[#d6dfc9]">งบที่ยังเหลือในรอบนี้</p><p className="mt-4 font-mono text-5xl sm:text-6xl">{money(remaining)}<span className="ml-2 text-xl opacity-50">฿</span></p><p className="mt-7 text-xs text-[#c9d4bd]">ใช้ไป {money(spent)} จากงบ 15,000 บาท</p><div className="mt-4 h-1.5 overflow-hidden rounded bg-white/15"><div className="h-full bg-[#dfbd7f]" style={{width:`${Math.min(spent/15000*100,100)}%`}} /></div></section>{budget}</div>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]"><div className="min-w-0 space-y-6">{ledger}{garden}</div>{form}</div>
      </> : variant === 'C' ? <>
        <header className="mb-8 border-b-2 border-[#5c654f] pb-6"><p className={label}>NoriNote / personal ledger</p><h1 className="mt-3 text-4xl font-bold sm:text-5xl">เรื่องเล่าผ่านรายจ่าย</h1><p className="mt-3 text-xs text-[#94866d]">เปิดสมุดหนึ่งหน้า แล้วค่อย ๆ เห็นภาพของตัวเอง</p></header>
        <div className="grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="space-y-6"><div className="border-l-2 border-[#b9a477] pl-5"><p className={label}>This cycle</p><p className="mt-3 font-mono text-3xl">{money(spent)} ฿</p><p className="mt-2 text-xs text-[#8e8066]">เหลืองบ {money(remaining)} บาท</p><p className="mt-4 flex items-center gap-2 text-xs text-[#69805a]"><Check size={14} />วันนี้จดแล้ว {entries.filter(entry=>entry.today).length} รายการ</p></div><div className="hidden lg:block">{garden}</div></aside><div className="min-w-0 space-y-6">{ledger}<div className="grid items-start gap-6 xl:grid-cols-2">{form}{budget}</div><div className="lg:hidden">{garden}</div></div></div>
      </> : variant === 'D' ? <>
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className={label}>Less clicking, more living</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">จดให้จบ ในบรรทัดเดียว</h1><p className="mt-3 text-xs text-[#94866d]">พื้นที่ทำงานเล็ก ๆ สำหรับวันที่มีหลายรายการ</p></div><div className="text-right"><p className={label}>Today so far</p><p className="mt-2 font-mono text-2xl">{money(today)} ฿</p></div></header>
        <section className={`${paper} mb-6 border-t-4 border-t-[#879574] p-5 sm:p-6`}>
          <form onSubmit={submit} className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="min-w-0 text-xs">รายการ<input aria-label="รายการ" value={name} onChange={event => setName(event.target.value)} placeholder="จ่ายอะไรไป?" className="mt-2 min-h-12 w-full border-b border-[#cbbfa8] bg-transparent px-1 text-base outline-offset-2 focus:outline-[#879574]" /></label>
            <label className="min-w-0 text-xs">จำนวนเงิน · บาท<input required type="number" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={event => { setAmount(event.target.value); setSaved(false); }} placeholder="0.00" className="mt-2 min-h-12 w-full border-b border-[#cbbfa8] bg-transparent px-1 font-mono text-xl outline-offset-2 focus:outline-[#879574]" /></label>
            <label className="min-w-0 text-xs">หมวดหมู่<select value={category} onChange={event => setCategory(event.target.value)} className="mt-2 min-h-12 w-full border-b border-[#cbbfa8] bg-transparent">{['อาหาร', 'เดินทาง', 'ของใช้', 'ความสุข'].map(value => <option key={value}>{value}</option>)}</select></label>
            <label className="min-w-0 text-xs">จ่ายจาก<select value={payment} onChange={event => setPayment(event.target.value)} className="mt-2 min-h-12 w-full border-b border-[#cbbfa8] bg-transparent">{['เงินสด', 'บัญชีธนาคาร'].map(value => <option key={value}>{value}</option>)}</select></label>
            <button type="submit" className="flex min-h-12 items-center justify-center gap-2 bg-[#4d654b] px-5 text-sm font-bold text-white hover:bg-[#3d523b] sm:col-span-2 lg:col-span-1"><Plus size={16} />จดเลย</button>
          </form>
          <p role="status" className="mt-3 min-h-4 text-[11px] text-[#64815c]">{saved ? '✓ จดรายการตัวอย่างแล้ว เพิ่มรายการถัดไปได้เลย' : 'ข้อมูลสมมติ · กรอกแล้วกด Enter เพื่อจดต่อเนื่องได้'}</p>
        </section>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className={`${paper} min-w-0 overflow-hidden`}><div className="flex items-center justify-between border-b border-[#e7dfd0] p-5"><h2 className="text-base font-bold">บันทึกทั้งหมด</h2><span className={label}>{entries.length} entries</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-xs"><caption className="sr-only">รายการรายจ่ายตัวอย่าง</caption><thead className="bg-[#f0ebdf] text-[10px] text-[#8a7d65]"><tr>{['วัน', 'รายการ', 'หมวดหมู่', 'จ่ายจาก', 'บาท'].map(title => <th key={title} scope="col" className="px-4 py-3 last:text-right">{title}</th>)}</tr></thead><tbody>{entries.map(entry => <tr key={entry.id} className="border-b border-dashed border-[#e7dfd0] hover:bg-[#faf6eb]"><td className="whitespace-nowrap px-4 py-5 text-[#998a70]">{entry.today ? 'วันนี้' : 'เมื่อวาน'}</td><td className="px-4 py-5 font-medium">{entry.name}</td><td className="px-4 py-5 text-[#8a7d65]">{entry.category}</td><td className="px-4 py-5 text-[#8a7d65]">{entry.payment}</td><td className="px-4 py-5 text-right font-mono">−{money(entry.amount)}</td></tr>)}</tbody></table></div>
            <Link href="/note" className="flex min-h-12 items-center justify-center gap-2 text-xs text-[#88714a]">เปิดสมุดจริง<ArrowRight size={13} /></Link>
          </section>
          <aside className="min-w-0 space-y-6"><section className="border-l-2 border-[#a2ae8d] py-2 pl-5"><p className={label}>This cycle</p><p className="mt-3 text-xs text-[#8a7d65]">ยังใช้ได้อีก</p><p className="mt-2 font-mono text-3xl text-[#5d7650]">{money(remaining)} ฿</p><p className="mt-3 text-[11px] text-[#998a70]">ใช้แล้ว {money(spent)} / 15,000 บาท</p></section>{budget}{garden}</aside>
        </div>
      </> : <div className="mx-auto max-w-xl">
        <header className="mb-6 flex items-center justify-between gap-4"><div><p className={label}>A pocket for your day</p><h1 className="mt-3 text-3xl font-bold">วันนี้ของเรา</h1></div><Image src="/animations/nori/teftel-cat-18.webp" alt="Nori ข้างสมุดพก" width={64} height={64} /></header>
        <section className="mb-5 flex items-center justify-between gap-4 rounded-2xl bg-[#4d654b] px-6 py-5 text-[#fffdf7]"><div><p className="text-[11px] text-[#d0dac4]">วันนี้ใช้ไป</p><p className="mt-2 font-mono text-3xl">{money(today)} ฿</p></div><div className="border-l border-white/20 pl-5 text-right"><p className="text-[10px] text-[#d0dac4]">งบยังเหลือ</p><p className="mt-2 font-mono text-lg">{money(remaining)} ฿</p></div></section>
        <div role="group" aria-label="ส่วนของสมุดพก" className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-[#ded5c5] bg-[#ebe5d8] p-1">{([{key:'record',title:'จดวันนี้'},{key:'overview',title:'ดูภาพรวม'},{key:'garden',title:'พักในสวน'}] as const).map(tab => <button key={tab.key} type="button" aria-pressed={pocketTab===tab.key} onClick={() => setPocketTab(tab.key)} className={`min-h-11 rounded-lg text-xs font-bold transition-colors ${pocketTab===tab.key ? 'bg-[#fffdf7] text-[#4d654b] shadow-sm' : 'text-[#97896f] hover:bg-[#f3eee3]'}`}>{tab.title}</button>)}</div>
        <div className="space-y-6">{pocketTab==='record' ? <>{form}{ledger}</> : pocketTab==='overview' ? <><section className={`${paper} p-6`}><p className={label}>A little perspective</p><h2 className="mt-3 text-xl font-bold">รอบนี้ใช้ไป {money(spent)} บาท</h2><p className="mt-3 text-xs leading-6 text-[#94866d]">งบตัวอย่าง 15,000 บาท · รายการทดลองที่เพิ่มจะรวมในยอดนี้ทันที</p></section>{budget}</> : garden}</div>
      </div>}
    </div><PrototypeSwitcher variant={variant} basePath="/preview" options={options} />
  </main>;
}

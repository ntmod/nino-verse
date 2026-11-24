'use client';
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { authClient } from '@/lib/auth-client';
import { walletService } from '@/lib/services/walletService';
import { categoryService } from '@/lib/services/categoryService';
import type { QuickCategory } from '@/lib/quick-note';
import type { BudgetWallet } from '@/lib/wallet-budget';

export default function WalletPicker({ value, onChange, category, autoSelect = false, allowArchived = false }: { value: string; onChange: (id: string, name?: string) => void; category?: QuickCategory; autoSelect?: boolean; allowArchived?: boolean }) {
  const { language } = useLanguage();
  const th = language === 'th';
  const { data: account } = authClient.useSession();
  const userId = account?.user.id;
  const id = useId();
  const selection = useRef({ value, onChange });
  useEffect(() => { selection.current = { value, onChange }; }, [value, onChange]);
  const [wallets, setWallets] = useState<BudgetWallet[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [defaultNotice, setDefaultNotice] = useState('');
  const defaultLock = useRef(false);
  const savedDefaults = useRef(new Map<string, string>());
  const previousCategory = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (state !== 'ready' || !category || !autoSelect || previousCategory.current === category._id) return;
    const first = previousCategory.current === undefined;
    previousCategory.current = category._id;
    if (first && selection.current.value) return;
    const wallet = wallets.find(item => item._id === (savedDefaults.current.get(category._id) ?? category.defaultWalletId) && !item.archived);
    selection.current.onChange(wallet?._id ?? '', wallet?.name);
  }, [category, autoSelect, state, wallets]);
  const saveDefault = async () => {
    if (!category || defaultLock.current) return;
    defaultLock.current = true;
    try { await categoryService.update(category._id, { defaultWalletId: value }); savedDefaults.current.set(category._id, value); setDefaultNotice(th ? 'จำกระเป๋าสำหรับหมวดนี้แล้ว' : 'Category default saved.'); }
    catch { setDefaultNotice(th ? 'จำค่าไม่สำเร็จ ลองอีกครั้ง' : 'Could not save default. Please retry.'); }
    finally { defaultLock.current = false; }
  };
  useEffect(() => {
    let active = true;
    walletService.getChoices(userId).then(wallets => { if (active) { setWallets(wallets); setState('ready');
        if (selection.current.value) { const selected = wallets.find(wallet => wallet._id === selection.current.value); if (selected) selection.current.onChange(selected.archived && !allowArchived ? '' : selected._id, selected.archived && !allowArchived ? undefined : selected.name); } } })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [retry, allowArchived, userId]);
  if (state !== 'ready' && !value && !category?.defaultWalletId) return null;
  if (state === 'ready' && !value && !wallets.some(wallet => !wallet.archived)) return null;
  return <div className="mt-4 text-left">
    <label htmlFor={id} className="text-xs text-muted-foreground">{th ? 'หักจากกระเป๋างบ · ไม่บังคับ' : 'Budget wallet · Optional'}</label>
    <select id={id} value={value} disabled={state !== 'ready'} onChange={event => onChange(event.target.value, wallets.find(wallet => wallet._id === event.target.value)?.name)} className="mt-2 min-h-11 w-full min-w-0 border border-border bg-secondary px-3 text-sm outline-offset-2 focus:outline-ring">
      <option value="">{th ? 'ไม่ใช้กระเป๋า' : 'No wallet'}</option>
      {value && !wallets.some(wallet => wallet._id === value) && <option value={value}>{th ? 'กระเป๋าที่เลือกไว้' : 'Saved wallet'}</option>}
      {wallets.filter(wallet => !wallet.archived || wallet._id === value).map(wallet => <option key={wallet._id} value={wallet._id} disabled={wallet.archived}>{wallet.name}{wallet.archived ? (th ? ' · เก็บเข้าคลังแล้ว' : ' · Archived') : ''}</option>)}
    </select>
    {state === 'loading' && <p role="status" className="mt-1 text-[11px] text-muted-foreground">{th ? 'กำลังโหลดกระเป๋า… ยังจดรายการได้ตามปกติ' : 'Loading wallets… You can still save a note.'}</p>}
    {state === 'error' && <p role="alert" className="mt-1 text-[11px] text-destructive">{th ? 'โหลดกระเป๋าไม่สำเร็จ' : 'Could not load wallets.'} <button type="button" onClick={() => setRetry(previous => previous + 1)} className="min-h-11 px-2 underline">{th ? 'ลองอีกครั้ง' : 'Retry'}</button></p>}
    {category && <button type="button" onClick={() => void saveDefault()} className="mt-1 inline-flex min-h-11 items-center text-[11px] text-muted-foreground underline">{th ? `จำตัวเลือกนี้สำหรับหมวด ${category.name}` : `Remember this choice for ${category.name}`}</button>}
    {defaultNotice && <p role="status" className="text-[11px]">{defaultNotice}</p>}
    <Link href="/wallets" className="mt-1 inline-flex min-h-11 items-center text-[11px] text-muted-foreground underline">{th ? 'จัดการกระเป๋างบ' : 'Manage budget wallets'}</Link>
  </div>;
}

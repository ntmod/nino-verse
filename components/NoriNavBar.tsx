'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ChartNoAxesCombined, ChevronDown, Globe, House, LayoutDashboard, LoaderCircle, LogOut, NotebookPen, Settings } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { useLanguage } from '@/lib/language-context';
import { authClient } from '@/lib/auth-client';
import Image from 'next/image';
import Link from 'next/link';
import SoundToggle from './SoundToggle';

const NAV_CONFIG = [
  { key: 'nav_home', path: '/home', icon: House },
  { key: 'nav_dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'nav_analytics', path: '/analytics', icon: ChartNoAxesCombined },
  { key: 'nav_notes', path: '/note', icon: NotebookPen },
  { key: 'nav_settings', path: '/settings', icon: Settings },
];
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#879574]';

export default function NoriNavBar() {
  useEffect(() => { document.documentElement.classList.remove('dark'); }, []);
  const { data: account } = authClient.useSession();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const logoutPending = useRef(false);
  const profile = account?.user;
  const router = useRouter();
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();
  const th = language === 'th';
  const activePath = NAV_CONFIG.find(item => pathname === item.path || pathname.startsWith(`${item.path}/`))?.path;

  const logout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    setLoggingOut(true); setLogoutError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error('Logout failed');
      router.replace('/login');
      router.refresh();
    } catch { setLogoutError(true); }
    finally { logoutPending.current = false; setLoggingOut(false); }
  };

  return <>
    <header className="fixed inset-x-0 top-0 z-[10000] h-16 border-b border-[#e1d9c9] bg-[#fffdf7]/95 text-[#635744] backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/home" aria-label={th ? 'NoriNote · หน้าแรก' : 'NoriNote · Home'} className={`flex shrink-0 items-center gap-2.5 rounded-lg ${focus}`}>
          <span aria-hidden="true" className="flex h-9 w-9 -rotate-6 items-center justify-center rounded-xl border border-[#d7dfc9] bg-[#eaf0e1] text-[#5b7151]"><NotebookPen size={18} strokeWidth={1.7} /></span>
          <span className="text-lg font-bold tracking-tight text-[#423c30]">NoriNote<span className="text-[#9ba985]">.</span></span>
        </Link>
        <nav aria-label={th ? 'เมนูหลัก' : 'Main navigation'} className="hidden items-center gap-1 rounded-full bg-[#f2eee4] p-1 lg:flex">
          {NAV_CONFIG.map(({ key, path, icon: Icon }) => <Link key={path} href={path} aria-current={activePath === path ? 'page' : undefined}
            className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-medium transition-colors ${focus} ${activePath === path ? 'bg-[#4d654b] text-[#fffdf7] shadow-sm' : 'text-[#93846b] hover:bg-[#e8e3d7] hover:text-[#423c30]'}`}>
            <Icon aria-hidden="true" size={15} strokeWidth={1.8} />{t(key)}
          </Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button type="button" onClick={toggleLanguage} aria-label={th ? 'เปลี่ยนเป็นภาษาอังกฤษ' : 'Switch to Thai'} title={th ? 'เปลี่ยนเป็นภาษาอังกฤษ' : 'Switch to Thai'} className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-full text-[10px] font-bold text-[#8a7d65] hover:bg-[#f2eee4] ${focus}`}><Globe aria-hidden="true" size={14} className="hidden sm:block" />{language.toUpperCase()}</button>
          <SoundToggle />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger aria-label={th ? 'เมนูบัญชี' : 'Account menu'} className={`ml-1 flex min-h-11 items-center gap-1 rounded-full px-1 ${focus}`}>
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#ded5c5] bg-[#eee6d6] text-xs font-bold text-[#8b7858]">
                {profile?.image && failedImage !== profile.image ? <Image src={profile.image} alt="" width={32} height={32} unoptimized referrerPolicy="no-referrer" onError={() => setFailedImage(profile.image ?? null)} className="h-full w-full object-cover" /> : <span aria-hidden="true">{Array.from(profile?.name || profile?.email || 'N')[0]?.toUpperCase()}</span>}
              </span><ChevronDown aria-hidden="true" size={12} className="hidden sm:block text-[#a09278]" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={10} collisionPadding={16} className="z-[11000] w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#ded5c5] bg-[#fffdf7] p-2 text-[#635744] shadow-xl">
              <DropdownMenu.Label className="px-3 py-3"><span className="block truncate text-sm font-bold">{profile?.name || 'NoriNote'}</span><span className="mt-1 block truncate text-[11px] font-normal text-[#a09278]">{profile?.email}</span></DropdownMenu.Label>
              <DropdownMenu.Separator className="mx-2 my-1 h-px bg-[#e9e1d2]" />
              <DropdownMenu.Item asChild><Link href="/settings" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs outline-none data-highlighted:bg-[#f2eee4]"><Settings aria-hidden="true" size={15} />{t('nav_settings')}</Link></DropdownMenu.Item>
              <DropdownMenu.Item disabled={loggingOut} onSelect={() => { void logout(); }} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-xs text-[#a56350] outline-none data-highlighted:bg-[#f7ece6] data-disabled:opacity-50">{loggingOut ? <LoaderCircle aria-hidden="true" size={15} className="animate-spin motion-reduce:animate-none" /> : <LogOut aria-hidden="true" size={15} />}{loggingOut ? (th ? 'กำลังออก…' : 'Signing out…') : t('nav_logout')}</DropdownMenu.Item>
            </DropdownMenu.Content></DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      {logoutError && <p role="alert" className="border-b border-[#e5cbbd] bg-[#fff4ed] px-4 py-3 text-center text-xs text-[#a56350]">{th ? 'ออกจากระบบไม่สำเร็จ ลองอีกครั้งได้ที่เมนูบัญชี' : 'Could not sign out. Please retry from the account menu.'}</p>}
    </header>
    <nav aria-label={th ? 'เมนูหลักบนมือถือ' : 'Mobile navigation'} className="fixed inset-x-0 bottom-0 z-[10000] grid grid-cols-5 border-t border-[#e1d9c9] bg-[#fffdf7]/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[#8a7d65] backdrop-blur-md lg:hidden">
      {NAV_CONFIG.map(({ key, path, icon: Icon }) => <Link key={path} href={path} aria-current={activePath === path ? 'page' : undefined} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] transition-colors ${focus} ${activePath === path ? 'bg-[#eaf0e1] font-bold text-[#4d654b]' : 'hover:bg-[#f2eee4]'}`}><Icon aria-hidden="true" size={20} strokeWidth={activePath === path ? 2 : 1.6} /><span>{t(key)}</span></Link>)}
    </nav>
  </>;
}

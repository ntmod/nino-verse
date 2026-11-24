'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { ChartNoAxesCombined, ChevronDown, Globe, House, LayoutDashboard, LoaderCircle, LogOut, NotebookPen, Settings } from 'lucide-react';
import { DropdownMenu, Tooltip } from 'radix-ui';
import { useLanguage } from '@/lib/language-context';
import { authClient } from '@/lib/auth-client';
import Image from 'next/image';
import Link from 'next/link';
import SoundToggle from './SoundToggle';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Dock, DockIcon } from '@/components/ui/dock';

const NAV_CONFIG = [
  { key: 'nav_home', path: '/home', icon: House },
  { key: 'nav_dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'nav_analytics', path: '/analytics', icon: ChartNoAxesCombined },
  { key: 'nav_notes', path: '/note', icon: NotebookPen },
  { key: 'nav_settings', path: '/settings', icon: Settings },
];
const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export default function NoriNavBar() {
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
    <header className="fixed inset-x-0 top-0 z-[10000] h-16 border-b border-border bg-card/95 text-ink-soft backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <Link href="/home" aria-label={th ? 'NoriNote · หน้าแรก' : 'NoriNote · Home'} className={`flex shrink-0 items-center gap-2 rounded-md ${focus}`}>
          <span aria-hidden="true" className="flex size-8 -rotate-6 sm:size-9 items-center justify-center rounded-md border border-[#d7dfc9] bg-accent text-accent-foreground"><NotebookPen size={18} strokeWidth={1.7} /></span>
          <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">NoriNote<span className="text-[#9ba985]">.</span></span>
        </Link>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button type="button" onClick={toggleLanguage} aria-label={th ? 'เปลี่ยนเป็นภาษาอังกฤษ' : 'Switch to Thai'} title={th ? 'เปลี่ยนเป็นภาษาอังกฤษ' : 'Switch to Thai'} className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-md text-[10px] font-bold text-muted-foreground hover:bg-secondary ${focus}`}><Globe aria-hidden="true" size={14} className="hidden sm:block" />{language.toUpperCase()}</button>
          <SoundToggle />
          <AnimatedThemeToggler variant="circle" duration={320} aria-label={th ? 'สลับธีมสว่างและมืด' : 'Toggle light and dark theme'}
            className={`grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-highlight-ink [&_svg]:size-4 ${focus}`} />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger aria-label={th ? 'เมนูบัญชี' : 'Account menu'} className={`ml-1 flex min-h-11 items-center gap-1 rounded-md px-1 ${focus}`}>
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-bold text-[#8b7858]">
                {profile?.image && failedImage !== profile.image ? <Image src={profile.image} alt="" width={32} height={32} unoptimized referrerPolicy="no-referrer" onError={() => setFailedImage(profile.image ?? null)} className="h-full w-full object-cover" /> : <span aria-hidden="true">{Array.from(profile?.name || profile?.email || 'N')[0]?.toUpperCase()}</span>}
              </span><ChevronDown aria-hidden="true" size={12} className="hidden sm:block text-muted-foreground" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={10} collisionPadding={16} className="z-[11000] w-64 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-card p-2 text-ink-soft shadow-xl">
              <DropdownMenu.Label className="px-3 py-3"><span className="block truncate text-sm font-bold">{profile?.name || 'NoriNote'}</span><span className="mt-1 block truncate text-[11px] font-normal text-muted-foreground">{profile?.email}</span></DropdownMenu.Label>
              <DropdownMenu.Separator className="mx-2 my-1 h-px bg-paper-edge" />
              <DropdownMenu.Item asChild><Link href="/settings" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-xs outline-none data-highlighted:bg-secondary"><Settings aria-hidden="true" size={15} />{t('nav_settings')}</Link></DropdownMenu.Item>
              <DropdownMenu.Item disabled={loggingOut} onSelect={() => { void logout(); }} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-xs text-destructive outline-none data-highlighted:bg-destructive-soft data-disabled:opacity-50">{loggingOut ? <LoaderCircle aria-hidden="true" size={15} className="animate-spin motion-reduce:animate-none" /> : <LogOut aria-hidden="true" size={15} />}{loggingOut ? (th ? 'กำลังออก…' : 'Signing out…') : t('nav_logout')}</DropdownMenu.Item>
            </DropdownMenu.Content></DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
      {logoutError && <p role="alert" className="border-b border-destructive-border bg-destructive-soft px-4 py-3 text-center text-xs text-destructive">{th ? 'ออกจากระบบไม่สำเร็จ ลองอีกครั้งได้ที่เมนูบัญชี' : 'Could not sign out. Please retry from the account menu.'}</p>}
    </header>
    <nav aria-label={th ? 'เมนูหลัก' : 'Main navigation'} className="pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[10000] flex justify-center">
      <Tooltip.Provider delayDuration={200}>
        <Dock iconSize={52} iconMagnification={58} iconDistance={80}
          className="pointer-events-auto mt-0 h-[68px] gap-0.5 rounded-md border-border bg-card/95 px-1.5 py-1 shadow-lg shadow-foreground/10">
          {NAV_CONFIG.map(({ key, path, icon: Icon }) => (
            <DockIcon key={path} className="shrink-0">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Link href={path} aria-label={t(key)} aria-current={activePath === path ? 'page' : undefined}
                    className={`flex size-full items-center justify-center rounded-md transition-colors ${focus} ${activePath === path ? 'bg-primary text-card' : 'text-ink-soft hover:bg-secondary'}`}>
                    <Icon aria-hidden="true" size={22} strokeWidth={activePath === path ? 2 : 1.6} />
                  </Link>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content side="top" sideOffset={12} collisionPadding={8} className="z-[10001] rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
                    {t(key)}
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </DockIcon>
          ))}
        </Dock>
      </Tooltip.Provider>
    </nav>
  </>;
}

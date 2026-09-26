'use client';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Home,
  LogOut,
  Menu as MenuIcon,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  Wallet,
  Store,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type ReactNode } from 'react';
import { LogoMark, Logo } from '@/components/Logo';
import { LangSwitcher, ThemeToggle } from '@/components/Switchers';
import { Sheet } from '@/components/ui';
import { useI18n, type TKey } from '@/i18n';
import { getDb } from '@/lib/db';
import { useApp } from './AppContext';
import { AppLink, useRouter, type RouteName } from './router';
import { SyncPill, SyncDetails, useSyncState } from './SyncStatus';

interface NavItem {
  href: string;
  key: TKey;
  icon: typeof Home;
  match: RouteName[];
  owner?: boolean;
}

const NAV: NavItem[] = [
  { href: '/app', key: 'nav.home', icon: Home, match: ['home'] },
  { href: '/app/vendre', key: 'nav.sell', icon: ShoppingBag, match: ['sell'] },
  { href: '/app/ventes', key: 'nav.sales', icon: Receipt, match: ['sales', 'receipt'] },
  { href: '/app/stock', key: 'nav.stock', icon: Package, match: ['stock', 'product', 'productNew'] },
  { href: '/app/credit', key: 'nav.credit', icon: BookOpen, match: ['credit', 'customer'] },
  { href: '/app/depenses', key: 'nav.expenses', icon: Wallet, match: ['expenses'], owner: true },
  { href: '/app/rapports', key: 'nav.reports', icon: BarChart3, match: ['reports'], owner: true },
  { href: '/app/reglages', key: 'nav.settings', icon: Settings, match: ['settings'] },
];

function useLowCount() {
  const { shop } = useApp();
  return (
    useLiveQuery(
      async () =>
        shop
          ? (await getDb().products.where('shop_id').equals(shop.id).toArray()).filter((p) => !p.archived && p.quantity <= p.low_stock).length
          : 0,
      [shop?.id],
    ) ?? 0
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { route } = useRouter();
  const { shop, isOwner, user, member, signOut } = useApp();
  const [more, setMore] = useState(false);
  const low = useLowCount();
  const sync = useSyncState();
  const items = NAV.filter((n) => !n.owner || isOwner);
  const active = (n: NavItem) => n.match.includes(route.name);

  const logout = async () => {
    if (sync.pending > 0 && !confirm(t('set.pendingLogout', { n: sync.pending }))) return;
    await signOut();
  };

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col border-r border-line bg-surface/70 px-4 pb-5 pt-6 backdrop-blur-xl lg:flex">
        <AppLink href="/app" className="px-2">
          <Logo size={34} />
        </AppLink>
        <AppLink
          href="/app/reglages"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-brand/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Store size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold" data-testid="shop-name">{shop?.name}</span>
            <span className="block truncate text-xs text-muted">
              {shop?.commune} · {t(isOwner ? 'role.owner' : 'role.seller')}
            </span>
          </span>
          <ChevronRight size={16} className="text-muted" />
        </AppLink>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {items.map((n) => (
            <AppLink
              key={n.href}
              href={n.href}
              data-testid={`nav-${n.href.split('/')[2] ?? 'home'}`}
              className={clsx(
                'group relative flex h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold transition-colors',
                active(n) ? 'text-brand' : 'text-muted hover:bg-surface-2 hover:text-ink',
              )}
            >
              {active(n) && (
                <motion.span layoutId="side-active" className="absolute inset-0 rounded-2xl bg-brand-soft" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
              )}
              <n.icon size={20} className="relative" />
              <span className="relative flex-1">{t(n.key)}</span>
              {n.href === '/app/stock' && low > 0 && (
                <span className="relative rounded-full bg-danger px-2 py-0.5 text-[11px] font-bold text-white">{low}</span>
              )}
            </AppLink>
          ))}
        </nav>
        <div className="space-y-3 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <SyncPill />
            <div className="flex items-center">
              <LangSwitcher compact />
              <ThemeToggle />
            </div>
          </div>
          <SyncDetails />
          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cocoa text-sm font-bold text-cream dark:bg-cream dark:text-cocoa">
              {(member?.display_name || user?.name || '?').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{member?.display_name || user?.name}</span>
              <span className="block truncate text-xs text-muted">{user?.email}</span>
            </span>
            <button onClick={logout} aria-label={t('nav.logout')} title={t('nav.logout')} className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-danger">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        {/* Mobile / tablet header */}
        <header className="pt-safe sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center gap-2 px-4">
            <AppLink href="/app" className="flex min-w-0 flex-1 items-center gap-2.5">
              <LogoMark size={32} />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold leading-tight" data-testid="shop-name-mobile">{shop?.name}</span>
                <span className="block truncate text-[11.5px] text-muted">{shop?.commune}</span>
              </span>
            </AppLink>
            <SyncPill className="shrink-0" />
            <LangSwitcher compact className="shrink-0" />
            <ThemeToggle className="shrink-0 -mr-1.5" />
          </div>
        </header>
        {!sync.online && (
          <div className="border-b border-gold/30 bg-gold-soft px-4 py-2 text-center text-[12.5px] font-medium text-ink lg:mt-0" data-testid="offline-banner">
            {t('sync.offlineHint')}
          </div>
        )}
        <main className="pb-tabbar mx-auto w-full max-w-[1240px] px-4 pt-5 sm:px-6 lg:px-10 lg:pt-8">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-line/80 bg-surface/90 backdrop-blur-xl lg:hidden" aria-label={t('nav.menu')}>
        <div className="h-tabbar pb-safe mx-auto grid max-w-xl grid-cols-5 items-start px-2">
          <Tab href="/app" icon={Home} label={t('nav.home')} active={route.name === 'home'} id="home" />
          <Tab href="/app/stock" icon={Package} label={t('nav.stock')} active={['stock', 'product', 'productNew'].includes(route.name)} badge={low} id="stock" />
          <AppLink href="/app/vendre" className="flex flex-col items-center" data-testid="tab-sell" aria-label={t('nav.sell')}>
            <motion.span
              whileTap={{ scale: 0.9 }}
              className={clsx(
                '-mt-5 flex h-[60px] w-[60px] items-center justify-center rounded-[22px] bg-brand text-white shadow-[0_12px_24px_-10px_var(--brand)] ring-4 ring-bg',
                route.name === 'sell' && 'bg-brand-strong',
              )}
            >
              <ShoppingBag size={26} />
            </motion.span>
            <span className={clsx('mt-1 text-[11px] font-semibold', route.name === 'sell' ? 'text-brand' : 'text-muted')}>{t('nav.sell')}</span>
          </AppLink>
          <Tab href="/app/credit" icon={BookOpen} label={t('nav.credit')} active={['credit', 'customer'].includes(route.name)} id="credit" />
          <button
            type="button"
            onClick={() => setMore(true)}
            data-testid="tab-more"
            className={clsx(
              'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold',
              ['sales', 'receipt', 'expenses', 'reports', 'settings'].includes(route.name) ? 'text-brand' : 'text-muted',
            )}
          >
            <MenuIcon size={22} />
            {t('nav.more')}
          </button>
        </div>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title={t('nav.more')}>
        <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3">
          {items
            .filter((n) => !['/app', '/app/vendre', '/app/stock', '/app/credit'].includes(n.href))
            .map((n) => (
              <AppLink
                key={n.href}
                href={n.href}
                onClick={() => setMore(false)}
                data-testid={`more-${n.href.split('/')[2]}`}
                className={clsx(
                  'flex flex-col gap-3 rounded-3xl border p-4 transition',
                  active(n) ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface hover:bg-surface-2',
                )}
              >
                <n.icon size={24} />
                <span className="text-[15px] font-bold">{t(n.key)}</span>
              </AppLink>
            ))}
          <button
            onClick={logout}
            className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-4 text-left text-danger transition hover:bg-danger-soft"
          >
            <LogOut size={24} />
            <span className="text-[15px] font-bold">{t('nav.logout')}</span>
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
          <SyncDetails />
          <span className="text-xs text-muted">{user?.email}</span>
        </div>
      </Sheet>
    </div>
  );
}

function Tab({ href, icon: Icon, label, active, badge, id }: { href: string; icon: typeof Home; label: string; active: boolean; badge?: number; id: string }) {
  return (
    <AppLink href={href} className="relative flex h-16 flex-col items-center justify-center gap-1" data-testid={`tab-${id}`}>
      <motion.span whileTap={{ scale: 0.85 }} className={clsx('relative', active ? 'text-brand' : 'text-muted')}>
        <Icon size={22} strokeWidth={active ? 2.4 : 2} />
        {!!badge && (
          <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-[18px] text-white ring-2 ring-surface">
            {badge}
          </span>
        )}
      </motion.span>
      <span className={clsx('text-[11px] font-semibold', active ? 'text-brand' : 'text-muted')}>{label}</span>
      <AnimatePresence>
        {active && <motion.span layoutId="tab-dot" className="absolute top-1 h-1 w-6 rounded-full bg-brand" />}
      </AnimatePresence>
    </AppLink>
  );
}

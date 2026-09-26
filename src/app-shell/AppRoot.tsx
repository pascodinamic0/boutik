'use client';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Splash } from '@/components/Splash';
import { useI18n } from '@/i18n';
import { AppProvider, useApp } from './AppContext';
import { AppShell } from './AppShell';
import { RouterProvider, useRouter } from './router';
import { Dashboard } from '@/views/Dashboard';
import { Pos } from '@/views/Pos';
import { SalesHistory } from '@/views/SalesHistory';
import { ReceiptView } from '@/views/Receipt';
import { StockList } from '@/views/StockList';
import { ProductDetail } from '@/views/ProductDetail';
import { ProductNew } from '@/views/ProductForm';
import { CreditList } from '@/views/CreditList';
import { CustomerDetail } from '@/views/CustomerDetail';
import { Expenses } from '@/views/Expenses';
import { Reports } from '@/views/Reports';
import { SettingsView } from '@/views/Settings';
import { Onboarding } from '@/views/Onboarding';
import { NotFoundView } from '@/views/NotFoundView';

function Routes() {
  const { route, navigate } = useRouter();
  const { status, shop, shops, bootstrapped, isOwner } = useApp();
  const { t } = useI18n();

  const needsOnboarding = status === 'ready' && bootstrapped && shops.length === 0;
  useEffect(() => {
    if (needsOnboarding && route.name !== 'onboarding') navigate('/app/bienvenue', { replace: true });
  }, [needsOnboarding, route.name, navigate]);

  if (status !== 'ready' || (!shop && !needsOnboarding && route.name !== 'onboarding')) return <Splash text={t('splash.loading')} />;
  if (route.name === 'onboarding' || !shop) return <Onboarding />;

  const ownerOnly = ['expenses', 'reports'].includes(route.name) && !isOwner;
  let view: React.ReactNode;
  switch (ownerOnly ? 'home' : route.name) {
    case 'home':
      view = <Dashboard />;
      break;
    case 'sell':
      view = <Pos />;
      break;
    case 'sales':
      view = <SalesHistory />;
      break;
    case 'receipt':
      view = <ReceiptView id={route.id!} />;
      break;
    case 'stock':
      view = <StockList />;
      break;
    case 'productNew':
      view = <ProductNew />;
      break;
    case 'product':
      view = <ProductDetail id={route.id!} />;
      break;
    case 'credit':
      view = <CreditList />;
      break;
    case 'customer':
      view = <CustomerDetail id={route.id!} />;
      break;
    case 'expenses':
      view = <Expenses />;
      break;
    case 'reports':
      view = <Reports />;
      break;
    case 'settings':
      view = <SettingsView />;
      break;
    default:
      view = <NotFoundView />;
  }
  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={route.path}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {view}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

export default function AppRoot() {
  // Rendered only on the client: the URL, session and data all live on the device.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Splash />;
  return (
    <RouterProvider>
      <AppProvider>
        <Routes />
      </AppProvider>
    </RouterProvider>
  );
}

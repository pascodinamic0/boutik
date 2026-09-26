'use client';
import clsx from 'clsx';
import { CloudOff, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { syncStore, type SyncState } from '@/lib/sync';
import { useI18n } from '@/i18n';

const server: SyncState = { online: true, syncing: false, pending: 0, failed: 0, lastSyncAt: null, lastError: null };
export function useSyncState() {
  return useSyncExternalStore(syncStore.subscribe, syncStore.get, () => server);
}

export function SyncPill({ className, onClick }: { className?: string; onClick?: () => void }) {
  const s = useSyncState();
  const { t } = useI18n();
  let tone = 'bg-ok-soft text-ok';
  let icon = <span className="h-2 w-2 rounded-full bg-ok shadow-[0_0_0_3px_color-mix(in_srgb,var(--ok)_25%,transparent)]" />;
  let label = t('sync.online');
  let state = 'online';
  if (!s.online) {
    tone = 'bg-surface-2 text-muted';
    icon = <CloudOff size={14} />;
    label = t('sync.offline');
    state = 'offline';
  } else if (s.syncing) {
    tone = 'bg-info-soft text-info';
    icon = <RefreshCw size={13} className="animate-spin" />;
    label = t('sync.syncing');
    state = 'syncing';
  } else if (s.failed > 0) {
    tone = 'bg-danger-soft text-danger';
    icon = <AlertTriangle size={13} />;
    label = t('sync.failed', { n: s.failed });
    state = 'failed';
  } else if (s.pending > 0) {
    tone = 'bg-gold-soft text-gold';
    icon = <RefreshCw size={13} />;
    label = t('sync.pending', { n: s.pending });
    state = 'pending';
  }
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="sync-pill"
      data-state={state}
      data-pending={s.pending}
      className={clsx('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-colors', tone, className)}
    >
      {icon}
      <span className="hidden whitespace-nowrap min-[400px]:inline lg:inline">{label}</span>
      {!s.online && s.pending > 0 && <span className="rounded-full bg-gold px-1.5 text-[11px] text-white">{s.pending}</span>}
    </button>
  );
}

export function SyncDetails() {
  const s = useSyncState();
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted">
      {s.online && !s.pending && !s.failed ? <Check size={15} className="text-ok" /> : null}
      <span>
        {s.lastSyncAt
          ? t('sync.last', { t: new Date(s.lastSyncAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) })
          : t('sync.never')}
      </span>
    </div>
  );
}

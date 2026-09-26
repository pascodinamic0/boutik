'use client';
import { AppLink } from '@/app-shell/router';
import { EmptyState } from '@/components/common';
import { useI18n } from '@/i18n';

export function NotFoundView() {
  const { t } = useI18n();
  return (
    <EmptyState
      image="/img/marche.webp"
      title={t('err.notFound')}
      hint={t('err.notFoundHint')}
      action={
        <AppLink href="/app" className="inline-flex h-11 items-center rounded-2xl bg-brand px-5 font-semibold text-white">
          {t('nav.home')}
        </AppLink>
      }
    />
  );
}

'use client';
import { Download, Share, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { installStore, isIos, isStandalone } from '@/lib/install';
import type { PublicStorefront } from '@/lib/storefront';

export function InstallShopPrompt({ shop }: { shop: PublicStorefront }) {
  const [canInstall, setCanInstall] = useState(false);
  const [iosSheet, setIosSheet] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const key = `boutik.sf-install-dismiss:${shop.slug}`;
    setDismissed(!!localStorage.getItem(key) || isStandalone());
    setCanInstall(installStore.canPrompt());
    const unsub = installStore.subscribe(() => setCanInstall(installStore.canPrompt()));
    return () => {
      unsub();
    };
  }, [shop.slug]);

  if (dismissed || isStandalone()) return null;
  const show = canInstall || isIos();
  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(`boutik.sf-install-dismiss:${shop.slug}`, '1');
    setDismissed(true);
    setIosSheet(false);
  };

  const onInstall = async () => {
    if (canInstall) {
      await installStore.prompt();
      dismiss();
      return;
    }
    setIosSheet(true);
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[calc(env(safe-area-inset-top)+4.25rem)]">
        <div className="pointer-events-auto flex max-w-md items-center gap-2 rounded-full border border-black/10 bg-white/90 py-1.5 pl-3.5 pr-1.5 shadow-[0_12px_40px_rgb(0_0_0/0.12)] backdrop-blur-xl">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-bold text-[#0a0a0a]">Installer cette boutique</p>
          </div>
          <button
            type="button"
            onClick={onInstall}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#c2531f] px-3 text-[12px] font-bold text-white active:scale-95"
            data-testid="sf-install"
          >
            <Download size={13} /> Installer
          </button>
          <button type="button" onClick={dismiss} aria-label="Fermer" className="rounded-full p-1.5 text-[#7a6554] hover:bg-black/5">
            <X size={15} />
          </button>
        </div>
      </div>

      {iosSheet && (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/40 p-0 sm:items-center sm:justify-center sm:p-6" onClick={() => setIosSheet(false)}>
          <div
            className="w-full max-w-md rounded-t-[28px] border border-[#e5d8c8] bg-[#fffaf3] p-6 pb-safe sm:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Installer sur iPhone"
          >
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-bold text-[#1c120c]">Sur l&apos;écran d&apos;accueil</h2>
            <ol className="mt-5 space-y-4 text-sm text-[#4a382c]">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1c120c] text-xs font-bold text-[#fffaf3]">1</span>
                <span>
                  Touchez <Share className="mx-1 inline" size={14} /> <b>Partager</b> dans Safari
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1c120c] text-xs font-bold text-[#fffaf3]">2</span>
                <span>
                  Choisissez <b>Sur l&apos;écran d&apos;accueil</b>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c2531f] text-xs font-bold text-white">3</span>
                <span>
                  Validez — {shop.name} s&apos;ouvre comme une appli
                </span>
              </li>
            </ol>
            <button type="button" onClick={dismiss} className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-[#1c120c] text-sm font-bold text-[#fffaf3]">
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}

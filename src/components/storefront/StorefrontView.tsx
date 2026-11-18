'use client';
import type { ComponentType } from 'react';
import { AtelierTheme } from '@/components/storefront/themes/AtelierTheme';
import { CinemaTheme } from '@/components/storefront/themes/CinemaTheme';
import { MarcheTheme } from '@/components/storefront/themes/MarcheTheme';
import { resolveStorefrontTheme, type StorefrontThemeId } from '@/lib/storefront-themes';
import type { PublicStorefront } from '@/lib/storefront';

const THEME_VIEWS: Record<StorefrontThemeId, ComponentType<{ shop: PublicStorefront }>> = {
  cinema: CinemaTheme,
  marche: MarcheTheme,
  atelier: AtelierTheme,
};

/** Routes the public storefront to the shop's selected theme layout. */
export function StorefrontView({
  shop,
  themeOverride,
}: {
  shop: PublicStorefront;
  /** Demo / preview: `?theme=` wins over the persisted shop theme. */
  themeOverride?: string | null;
}) {
  const theme = resolveStorefrontTheme(themeOverride ?? shop.theme);
  const View = THEME_VIEWS[theme];
  return <View shop={{ ...shop, theme }} />;
}

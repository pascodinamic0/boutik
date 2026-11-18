/** Allow-listed storefront themes — distinct layouts, not mere color swaps. */
export const STOREFRONT_THEME_IDS = ['cinema', 'marche', 'atelier'] as const;
export type StorefrontThemeId = (typeof STOREFRONT_THEME_IDS)[number];

export const DEFAULT_STOREFRONT_THEME: StorefrontThemeId = 'cinema';

export interface StorefrontThemeMeta {
  id: StorefrontThemeId;
  name: string;
  tagline: string;
  /** PWA / meta theme */
  themeColor: string;
  backgroundColor: string;
  /** Short art-direction note for the picker */
  vibe: string;
}

export const STOREFRONT_THEMES: Record<StorefrontThemeId, StorefrontThemeMeta> = {
  cinema: {
    id: 'cinema',
    name: 'Cinéma',
    tagline: 'Sombre, éditorial, scroll immersif',
    themeColor: '#0c0b0a',
    backgroundColor: '#0c0b0a',
    vibe: 'Dark · photo XXL · rails À la une / Nouveautés',
  },
  marche: {
    id: 'marche',
    name: 'Marché',
    tagline: 'Vif, dense, couleurs marché, Android-first',
    themeColor: '#ea580c',
    backgroundColor: '#fff8ec',
    vibe: 'Mosaïque · typo bold · grille serrée',
  },
  atelier: {
    id: 'atelier',
    name: 'Atelier',
    tagline: 'Luxe calme, monochrome, grande photo, sérif',
    themeColor: '#111111',
    backgroundColor: '#f7f6f4',
    vibe: 'Quiet luxury · whitespace · collection',
  },
};

export function isStorefrontThemeId(v: unknown): v is StorefrontThemeId {
  return typeof v === 'string' && (STOREFRONT_THEME_IDS as readonly string[]).includes(v);
}

export function resolveStorefrontTheme(raw: unknown): StorefrontThemeId {
  return isStorefrontThemeId(raw) ? raw : DEFAULT_STOREFRONT_THEME;
}

export function storefrontThemeList(): StorefrontThemeMeta[] {
  return STOREFRONT_THEME_IDS.map((id) => STOREFRONT_THEMES[id]);
}

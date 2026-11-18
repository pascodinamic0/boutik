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
    tagline: 'Éditorial scroll, scène 3D, typo Fraunces',
    themeColor: '#c2531f',
    backgroundColor: '#faf8f4',
    vibe: 'Scroll-scrub · callouts produit · motion premium',
  },
  marche: {
    id: 'marche',
    name: 'Marché',
    tagline: 'Grille vive, blocs couleur, tactile et rapide',
    themeColor: '#e85d04',
    backgroundColor: '#fff8ec',
    vibe: 'Dense · Android-friendly · accents marché',
  },
  atelier: {
    id: 'atelier',
    name: 'Atelier',
    tagline: 'Luxe monochrome, photo XXL, transitions lentes',
    themeColor: '#111111',
    backgroundColor: '#f7f6f4',
    vibe: 'Minimal · sérif raffiné · whitespace',
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

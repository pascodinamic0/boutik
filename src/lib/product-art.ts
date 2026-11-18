/** Visual-first product art: category palettes + initials (no grey boxes). */

export interface CategoryArt {
  from: string;
  to: string;
  ink: string;
  glyph: string;
}

const ARTS: Record<string, CategoryArt> = {
  Alimentation: { from: '#f3d9b8', to: '#c2531f', ink: '#fff6ea', glyph: 'A' },
  Boissons: { from: '#d8e8f2', to: '#2c6aa8', ink: '#f4f9fd', glyph: 'B' },
  'Produits frais': { from: '#dcefdc', to: '#23804e', ink: '#f3faf4', glyph: 'F' },
  Hygiène: { from: '#efe4f5', to: '#7a4d9a', ink: '#fbf7fd', glyph: 'H' },
  Ménage: { from: '#e8e2d6', to: '#6b5846', ink: '#faf7f2', glyph: 'M' },
  Médicaments: { from: '#f8e0df', to: '#c2322b', ink: '#fff6f5', glyph: '+' },
  Cosmétiques: { from: '#f7e5ef', to: '#a8457a', ink: '#fff7fb', glyph: 'C' },
  Divers: { from: '#ebe4da', to: '#8a6b4a', ink: '#fffaf3', glyph: '·' },
};

export function categoryArt(category: string): CategoryArt {
  return ARTS[category] ?? ARTS.Divers;
}

export function productInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '·';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

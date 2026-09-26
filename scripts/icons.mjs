// Generates all PNG icon sizes + iOS splash screens from brand/mark.svg
import sharp from 'sharp';
import fs from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const mark = fs.readFileSync(root + 'brand/mark.svg', 'utf8');
const glyph = mark.match(/<g id="mark">[\s\S]*?<\/g>/)[0];
const defs = mark.match(/<defs>[\s\S]*?<\/defs>/)[0];
const out = root + 'public/icons/';
fs.mkdirSync(out, { recursive: true });
// Full-bleed square (no rounded corners) with glyph scaled by `scale`
const square = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
<rect width="512" height="512" fill="url(#bg)"/><rect width="512" height="512" fill="url(#shine)"/>
<g transform="translate(256 256) scale(${scale}) translate(-256 -255)">${glyph}</g></svg>`;
const jobs = [
  ['icon-192.png', mark, 192], ['icon-512.png', mark, 512], ['icon-1024.png', mark, 1024],
  ['favicon-32.png', mark, 32], ['favicon-16.png', mark, 16],
  ['maskable-192.png', square(0.98), 192], ['maskable-512.png', square(0.98), 512],
  ['apple-touch-icon.png', square(1.08), 180],
];
for (const [name, svg, size] of jobs) await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out + name);
fs.copyFileSync(out + 'apple-touch-icon.png', root + 'public/apple-touch-icon.png');
fs.copyFileSync(root + 'brand/mark.svg', root + 'public/icons/mark.svg');
fs.copyFileSync(root + 'brand/mark.svg', root + 'src/app/icon.svg');
fs.copyFileSync(out + 'apple-touch-icon.png', root + 'src/app/apple-icon.png');
// iOS splash screens (portrait): [cssW, cssH, dpr]
const splash = [[375,667,2],[390,844,3],[393,852,3],[430,932,3],[440,956,3],[402,874,3],[360,780,3],[1024,1366,2],[820,1180,2]];
fs.mkdirSync(root + 'public/splash', { recursive: true });
for (const [w,h,d] of splash) {
  const W=w*d,H=h*d,S=Math.round(Math.min(W,H)*0.28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="r" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#FFF8EF"/><stop offset="1" stop-color="#F6E7D3"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#r)"/></svg>`;
  const icon = await sharp(Buffer.from(mark)).resize(S,S).png().toBuffer();
  await sharp(Buffer.from(svg)).composite([{input: icon, top: Math.round(H*0.42 - S/2), left: Math.round((W-S)/2)}]).png({compressionLevel:9}).toFile(`${root}public/splash/splash-${W}x${H}.png`);
}
console.log('icons done');

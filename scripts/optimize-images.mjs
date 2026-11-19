/*
  Makes the site's images web-ready. Run after adding or replacing a photo:

    npm run images

  What it does (each step skips files that are already done, so it is safe to run again):

    • product photos   public/images/catalogue/<id>.webp  → adds <id>.avif beside each
    • studio photos    public/images/hero-products/*.webp → a 640 px copy (-640) + AVIF of both
    • story photos     public/images/stories/*.webp       → a 768 px copy (-768) + AVIF of both
    • CEO portrait     public/images/team/*-portrait.webp → a 560 px copy (-560) + AVIF of both
    • video posters    public/media/posters/*.jpg         → .webp (the <video poster> uses the WebP)
    • range photos     public/images/products/*.png       → 640 px .webp (the home page's product list)
    • share images     public/images/og/*.jpg             → 1200 × 630, cut from the posters (see OG below)

  The components that show these files: src/components/site/Picture.tsx (picks AVIF, then WebP,
  and the right size for the screen). Originals that have been converted (posters .jpg, range
  .png) can be deleted afterwards; this script never deletes anything.
*/
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const pub = path.join(process.cwd(), 'public');
const p = (...s) => path.join(pub, ...s);
const exists = (f) => fs.existsSync(f);
const files = (dir, ext) => (exists(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(ext)) : []);
let made = 0;

const AVIF = { quality: 55, effort: 6 };
const WEBP = { quality: 78, effort: 6 };

// the smaller copies this script makes: <name>-640.webp and so on (product codes also end in numbers, so only these count)
const WIDTHS = [560, 640, 768];
const isCopy = (f) => WIDTHS.some((w) => f.endsWith(`-${w}.webp`));

async function write(src, out, { width, format, opts }) {
  if (exists(out)) return;
  let img = sharp(src);
  if (width) img = img.resize({ width, withoutEnlargement: true });
  await img[format](opts).toFile(out);
  made++;
  console.log('  +', path.relative(pub, out), `${Math.round(fs.statSync(out).size / 1024)} KB`);
}

/** <name>.webp → <name>.avif, and <name>-<w>.webp / .avif for each smaller width */
async function variants(dir, { widths = [], skip = () => false } = {}) {
  for (const f of files(dir, '.webp')) {
    if (isCopy(f) || skip(f)) continue;
    const base = path.join(dir, f.replace(/\.webp$/, ''));
    await write(`${base}.webp`, `${base}.avif`, { format: 'avif', opts: AVIF });
    for (const w of widths) {
      await write(`${base}.webp`, `${base}-${w}.webp`, { width: w, format: 'webp', opts: WEBP });
      await write(`${base}.webp`, `${base}-${w}.avif`, { width: w, format: 'avif', opts: AVIF });
    }
  }
}

// share images (Open Graph): 1200 × 630, the size WhatsApp, LinkedIn and Google expect
const OG = {
  factory: 'media/posters/hero-exterior.jpg',
  quality: 'media/posters/inspect.jpg',
  contact: 'media/posters/signage.jpg',
  clients: 'media/posters/pack-box.jpg',
};

console.log('Product photos');
await variants(p('images/catalogue'));
console.log('Studio photos');
await variants(p('images/hero-products'), { widths: [640] });
console.log('Story photos');
await variants(p('images/stories'), { widths: [768] });
console.log('Portrait');
await variants(p('images/team'), { widths: [560], skip: (f) => !f.includes('portrait') });

console.log('Share images');
fs.mkdirSync(p('images/og'), { recursive: true });
for (const [name, src] of Object.entries(OG)) {
  if (!exists(p(src))) continue;
  const out = p('images/og', `${name}.jpg`);
  if (exists(out)) continue;
  await sharp(p(src)).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
  made++;
  console.log('  +', path.relative(pub, out));
}

console.log('Video posters');
for (const f of files(p('media/posters'), '.jpg')) {
  await write(p('media/posters', f), p('media/posters', f.replace(/\.jpg$/, '.webp')), { format: 'webp', opts: { quality: 72, effort: 6 } });
}

console.log('Range photos');
for (const f of files(p('images/products'), '.png')) {
  await write(p('images/products', f), p('images/products', f.replace(/\.png$/, '.webp')), { width: 640, format: 'webp', opts: { ...WEBP, alphaQuality: 90 } });
}

console.log(made ? `Done: ${made} files made.` : 'Nothing to do: every image is already converted.');

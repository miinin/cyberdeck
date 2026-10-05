// Generates the header logo and favicons from the source logo. Run: node scripts/brand-icons.mjs
import sharp from 'sharp';

const src = 'src/assets/brand/cyberdeck-tcg-logo.webp';
const black = { r: 0, g: 0, b: 0, alpha: 1 };

await sharp(src).resize({ width: 480 }).webp({ quality: 90 }).toFile('src/assets/brand/cyberdeck-tcg-logo-header.webp');

// Square icon: the angular "C" of the logo (left 440 px, rows 50–300 of the 2000 px source) centred on black.
const letter = await sharp(src).extract({ left: 0, top: 50, width: 440, height: 250 }).toBuffer();

async function icon(size, file) {
  const inner = Math.round(size * 0.94);
  const fitted = await sharp(letter).resize({ width: inner, height: inner, fit: 'inside' }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: black } })
    .composite([{ input: fitted, gravity: 'centre' }])
    .png()
    .toFile(file);
}
await icon(32, 'public/favicon.png');
await icon(180, 'public/apple-touch-icon.png');
await icon(192, 'public/icon-192.png');

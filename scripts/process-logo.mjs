/*
  Turn the raw generated art (logo-full.png / logo-icon.png, both 1254x1254 RGBA)
  into the site's logo assets.

  The source is near-binary in alpha but carries ~2% faint semi-transparent
  speckle in the near-transparent regions. We harden the alpha channel in a raw
  pass (below the cutoff -> fully transparent, above -> fully opaque) so nothing
  but the emblem survives. The MARK is additionally flattened to one flat token
  colour (#8b949e) so it stays crisp at 16px; the HERO keeps its metallic detail.

  Source art lives in design/ (emblem-src.png, mark-src.png).
  Usage:  node scripts/process-logo.mjs [emblem-src.png] [mark-src.png]
*/
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
const [, , fullSrc = path.join(root, 'design', 'emblem-src.png'), iconSrc = path.join(root, 'design', 'mark-src.png')] = process.argv;

const ALPHA_CUTOFF = 96;
const FLAT = [0x8b, 0x94, 0x9e];

/** load an image, threshold its alpha hard, optionally flatten rgb to `flat` */
async function clean(src, { flatten = false } = {}) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = new Uint8Array(data);
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < ALPHA_CUTOFF) {
      px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0;
    } else {
      px[i + 3] = 255;
      if (flatten) [px[i], px[i + 1], px[i + 2]] = FLAT;
    }
  }
  return sharp(Buffer.from(px), { raw: { width: info.width, height: info.height, channels: 4 } });
}

const T = '#00000000';

async function main() {
  // ---- HERO: keep detail, gentle contrast lift on the near-blacks ----
  const heroBuf = await (await clean(fullSrc)).linear(1.06, -6).png().toBuffer();
  const hero = () => sharp(heroBuf).clone();

  await hero().resize(1024, 1024, { fit: 'contain', background: T })
    .png({ compressionLevel: 9 }).toFile(path.join(pub, 'emblem.png'));

  // OG / social card: emblem centred on the page ground, 1200x630
  const ogEmblem = await hero().resize(520, 520, { fit: 'contain', background: T }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#07080a' } })
    .composite([{ input: ogEmblem, gravity: 'centre' }])
    .png({ compressionLevel: 9 }).toFile(path.join(pub, 'og-default.png'));

  // ---- MARK: flat single colour, trimmed to its bounding box ----
  const markBuf = await (await clean(iconSrc, { flatten: true }))
    .png().toBuffer()
    .then((b) => sharp(b).trim({ threshold: 1 }).png().toBuffer());
  const mark = () => sharp(markBuf).clone();

  await mark().resize(512, 512, { fit: 'contain', background: T }).png().toFile(path.join(pub, 'mark.png'));
  for (const size of [16, 32, 48]) {
    await mark().resize(size, size, { fit: 'contain', background: T }).png().toFile(path.join(pub, `favicon-${size}.png`));
  }
  await mark().resize(180, 180, { fit: 'contain', background: T }).png().toFile(path.join(pub, 'apple-touch-icon.png'));

  console.log('wrote emblem.png, og-default.png, mark.png, favicon-{16,32,48}.png, apple-touch-icon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

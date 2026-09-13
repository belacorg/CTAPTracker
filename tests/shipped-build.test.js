// What gets uploaded to the trial URL is its own thing to get right. The app
// source can be perfectly local-only while the build step quietly ships
// something that isn't — that is exactly what was happening: Vite's dep cache
// sits inside app/ and holds the entire bundled Supabase client, and a
// copy-everything build put it on the public origin.
//
// These tests run the real build and inspect its output, because "no network
// dependency" is a property of the deployed folder, not of the repo.
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { inflateSync } from 'node:zlib';

const DIST = 'dist';

// Shipped files document themselves, and a comment explaining that the app does
// NOT use fonts.googleapis.com must not read as using it. Strip comments before
// asserting on references; what matters is what the browser would fetch.
const stripComments = (src) => src
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

let files;
beforeAll(() => {
  execFileSync('node', ['build.mjs'], { stdio: 'pipe' });
  files = walk(DIST).map((p) => relative(DIST, p));
}, 60_000);

describe('the deployed folder', () => {
  it('carries no Supabase client, bundled or otherwise', () => {
    for (const f of files) {
      expect(f).not.toMatch(/supabase/i);
      if (/\.(js|cjs|css|html|json|map)$/.test(f)) {
        expect(readFileSync(join(DIST, f), 'utf8')).not.toMatch(/@supabase\/supabase-js|createClient\(/);
      }
    }
  });

  it('never leaves Vite build leftovers in the upload', () => {
    for (const f of files) {
      expect(f).not.toMatch(/(^|[\\/])\.vite([\\/]|$)/);
      expect(f).not.toMatch(/\.map$/);
    }
  });

  it('requests nothing from a third-party origin', () => {
    const textual = files.filter((f) => /\.(js|cjs|css|html|json)$/.test(f));
    for (const f of textual) {
      const src = stripComments(readFileSync(join(DIST, f), 'utf8'));
      // w3.org appears as the SVG namespace, which is an identifier, not a fetch.
      const urls = (src.match(/https?:\/\/[^\s"')]+/g) || [])
        .filter((u) => !u.startsWith('http://www.w3.org/'));
      expect(urls, `${f} reaches outside the origin`).toEqual([]);
    }
  });

  it('serves its own fonts, so typography survives with no signal', () => {
    expect(files).toContain(join('fonts', 'DMSans-latin.woff2'));
    const css = stripComments(readFileSync(join(DIST, 'fonts.css'), 'utf8'));
    expect(css).toMatch(/@font-face/);
    expect(css).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    const html = stripComments(readFileSync(join(DIST, 'index.html'), 'utf8'));
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });
});

describe('installing to a home screen', () => {
  it('serves the manifest at the path index.html asks for', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    const href = html.match(/<link rel="manifest" href="([^"]+)"/)[1];
    expect(files).toContain(href.replace(/^\.?\//, ''));
  });

  it('resolves every manifest icon to a file that exists', () => {
    // The bundled build hashed the manifest into assets/, so its relative icon
    // paths resolved to assets/icons/… and the home-screen icon came out blank.
    const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) {
      expect(files, `manifest icon ${icon.src} is missing`).toContain(icon.src.replace(/^\.?\//, ''));
    }
  });
});

describe('the service worker precache', () => {
  it('names only files the build actually produces', () => {
    // A precache entry that 404s is worse than no precache: install still
    // "succeeds" and the engineer finds out it was empty when they go offline.
    const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
    const base = sw.match(/const BASE\s*=\s*'([^']*)'/)[1];
    const paths = [...sw.matchAll(/BASE \+ '([^']+)'/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(5);
    for (const p of paths) {
      if (p === '/') continue;   // the directory index, served as index.html
      expect(files, `precached ${base}${p} is not in the build`).toContain(p.replace(/^\//, ''));
    }
  });
});

// Decodes enough of a PNG to prove it is an image and not merely PNG-shaped.
// The original icons had a valid signature, valid chunks and valid CRCs — every
// check short of reading the pixels passed — while the pixel data itself never
// decoded, so every phone got a blank icon. So this inflates the image data and
// checks each scanline is the length the header promises and starts with a real
// filter byte.
const decodePng = (buf) => {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!sig.every((b, i) => buf[i] === b)) throw new Error('not a PNG signature');
  let pos = 8, width, height, bitDepth, colorType, interlace;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    }
    if (type === 'IDAT') idat.push(data);
    if (type === 'IEND') break;
    pos += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels || bitDepth !== 8 || interlace !== 0) {
    throw new Error(`unsupported PNG: colour type ${colorType}, depth ${bitDepth}, interlace ${interlace}`);
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels + 1;
  if (raw.length !== stride * height) throw new Error(`pixel data is ${raw.length} bytes, header promises ${stride * height}`);
  for (let y = 0; y < height; y++) {
    if (raw[y * stride] > 4) throw new Error(`row ${y} starts with invalid filter byte ${raw[y * stride]}`);
  }
  return { width, height };
};

describe('icons that actually open', () => {
  it('decodes every manifest icon at the size it declares', () => {
    const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
    for (const icon of manifest.icons) {
      const [w, h] = icon.sizes.split('x').map(Number);
      const img = decodePng(readFileSync(join(DIST, icon.src)));
      expect(img, icon.src).toEqual({ width: w, height: h });
    }
  });

  it('gives iOS a real home-screen icon rather than a screenshot of the page', () => {
    const html = stripComments(readFileSync(join(DIST, 'index.html'), 'utf8'));
    const href = html.match(/<link rel="apple-touch-icon" href="([^"]+)"/)?.[1];
    expect(href, 'index.html has no apple-touch-icon').toBeTruthy();
    expect(decodePng(readFileSync(join(DIST, href)))).toEqual({ width: 180, height: 180 });
  });

  it('serves a favicon that decodes', () => {
    const html = stripComments(readFileSync(join(DIST, 'index.html'), 'utf8'));
    const href = html.match(/<link rel="icon"[^>]*href="([^"]+)"/)?.[1];
    expect(href, 'index.html has no favicon').toBeTruthy();
    expect(decodePng(readFileSync(join(DIST, href)))).toEqual({ width: 32, height: 32 });
  });
});

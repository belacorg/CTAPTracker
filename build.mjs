// The shipped app is the files in app/, copied verbatim.
//
// It used to go through a Vite bundle, which existed to hash one stylesheet —
// and cost more than it bought. Vite rewrote <link rel="manifest"> to
// assets/manifest-<hash>.json, so the manifest's relative icon paths resolved
// to assets/icons/… and every engineer who added the app to their home screen
// got a blank icon. The service worker, meanwhile, precached /style.css, which
// no longer existed under that name in the build output, so the precache it
// reported was partly fiction.
//
// app.js, data.cjs and pixel-engineer.js were always copied raw and cache-busted
// with ?v=; style.css and fonts.css now work the same way. Dev and production
// serve byte-identical files, which means what is tested is what ships.
//
// Vite still runs the dev server (npm run dev) — that part it does well.
//
// SHIP is an allowlist, not a denylist, and that is deliberate. app/ also holds
// the parked cloud layer (src/, ADR-0015), the shots harness, and Vite's dep
// cache at app/app/.vite — which contains the whole bundled Supabase client.
// None of it is loaded, but an app that tells engineers nothing leaves their
// device should not be serving a database client from its own origin, and a
// denylist is one forgotten entry away from doing exactly that. Anything new
// that needs to ship gets named here.
import { cp, rm, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const SRC = 'app';
const OUT = 'dist';

const SHIP = [
  'index.html',
  'app.js',
  'data.cjs',
  'pixel-engineer.js',
  'style.css',
  'fonts.css',
  'fonts',
  'sw.js',
  'manifest.json',
  'icons',
  // TEMPORARY — a diagnostic page for voice capture on iPhone, linked from
  // nowhere in the app. Remove, along with the file, once voice is settled.
  'voice-lab.html',
  'guide',
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const name of SHIP) {
  const from = join(SRC, name);
  await stat(from);   // a renamed or deleted file fails the build, not the trial
  await cp(from, join(OUT, name), { recursive: true });
}

console.log(`built ${OUT}/ from ${SRC}/ — ${SHIP.length} entries`);

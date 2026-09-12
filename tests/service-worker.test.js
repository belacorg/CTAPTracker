// The service worker is the whole offline promise, and it is the one part of the
// app that cannot be exercised by opening it — a worker only registers over
// https or localhost, and never inside the embedded browsers used to check the
// rest. It has also been wrong before, in both directions: activate once deleted
// every cache including the one install had just filled, and the offline
// fallback matched strictly while assets are requested with a ?v= cache-buster,
// so bumping the version turned every cached entry into a miss.
//
// So it gets driven directly. sw.js is evaluated against a synthetic worker
// scope and its listeners are invoked the way the browser would.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SW_SRC = readFileSync('app/sw.js', 'utf8');

// A Cache Storage stand-in that is honest about the two behaviours the worker
// actually depends on: addAll rejecting as a unit, and match honouring
// ignoreSearch.
function makeCaches() {
  const store = new Map();
  const open = async (name) => {
    if (!store.has(name)) store.set(name, new Map());
    const entries = store.get(name);
    return {
      addAll: async (urls) => {
        for (const u of urls) {
          if (!fetchable.has(u)) throw new TypeError(`failed to fetch ${u}`);
          entries.set(u, { url: u, body: fetchable.get(u) });
        }
      },
      put: async (req, res) => { entries.set(typeof req === 'string' ? req : req.url, res); },
      keys: async () => [...entries.keys()].map((url) => ({ url })),
    };
  };
  const fetchable = new Map();
  return {
    fetchable,
    store,
    api: {
      open,
      keys: async () => [...store.keys()],
      delete: async (name) => store.delete(name),
      match: async (req, opts = {}) => {
        const url = typeof req === 'string' ? req : req.url;
        for (const entries of store.values()) {
          if (entries.has(url)) return entries.get(url);
          if (opts.ignoreSearch) {
            const bare = url.split('?')[0];
            for (const [k, v] of entries) if (k.split('?')[0] === bare) return v;
          }
        }
        return undefined;
      },
    },
  };
}

function loadWorker({ fetchImpl } = {}) {
  const listeners = new Map();
  const c = makeCaches();
  const scope = {
    self: null,
    caches: c.api,
    fetch: fetchImpl || (async () => { throw new TypeError('offline'); }),
    Promise, TypeError, URL, console,
  };
  scope.self = {
    addEventListener: (type, fn) => listeners.set(type, fn),
    skipWaiting: () => { scope.self.skipWaitingCalled = true; },
    clients: { claim: async () => { scope.self.claimed = true; } },
  };
  vm.createContext(scope);
  vm.runInContext(SW_SRC, scope);

  const fire = async (type, extra = {}) => {
    let waited = Promise.resolve();
    let responded;
    const event = {
      waitUntil: (p) => { waited = p; },
      respondWith: (p) => { responded = p; },
      ...extra,
    };
    await listeners.get(type)(event);
    await waited;
    return responded;
  };
  return { fire, caches: c, scope };
}

const CACHE = SW_SRC.match(/const CACHE\s*=\s*'([^']+)'/)[1];
const BASE = SW_SRC.match(/const BASE\s*=\s*'([^']*)'/)[1];
const PRECACHED = [...SW_SRC.matchAll(/BASE \+ '([^']+)'/g)].map((m) => BASE + m[1]);

describe('installing', () => {
  it('fills the cache with the whole shell, not just the page', () => {
    // A cached copy has to be a complete working app: there is no server to
    // fall back to for the rest of it.
    const w = loadWorker();
    for (const u of PRECACHED) w.caches.fetchable.set(u, 'x');
    return w.fire('install').then(async () => {
      const entries = [...w.caches.store.get(CACHE).keys()];
      for (const u of PRECACHED) expect(entries).toContain(u);
    });
  });

  it('survives one asset 404ing instead of caching nothing at all', async () => {
    // addAll is all-or-nothing, so without the catch a single renamed file
    // leaves an engineer with an empty cache and no warning.
    const w = loadWorker();
    for (const u of PRECACHED.slice(1)) w.caches.fetchable.set(u, 'x');
    await expect(w.fire('install')).resolves.not.toThrow();
  });

  it('takes over straight away rather than waiting for every tab to close', async () => {
    const w = loadWorker();
    for (const u of PRECACHED) w.caches.fetchable.set(u, 'x');
    await w.fire('install');
    expect(w.scope.self.skipWaitingCalled).toBe(true);
  });
});

describe('activating', () => {
  it('keeps the cache install just filled', async () => {
    // This deleted every key including CACHE itself, so the precache was gone
    // seconds after install and a fresh install had nothing to fall back on
    // until it had been online once.
    const w = loadWorker();
    for (const u of PRECACHED) w.caches.fetchable.set(u, 'x');
    await w.fire('install');
    await w.fire('activate');
    expect([...w.caches.store.keys()]).toContain(CACHE);
    expect(w.caches.store.get(CACHE).size).toBeGreaterThan(0);
  });

  it('clears superseded caches so old versions do not accumulate', async () => {
    const w = loadWorker();
    await w.caches.api.open('jct-v1');
    await w.caches.api.open('jct-v2');
    await w.caches.api.open(CACHE);
    await w.fire('activate');
    expect([...w.caches.store.keys()]).toEqual([CACHE]);
  });
});

describe('fetching', () => {
  const req = (url, method = 'GET') => ({ url, method, clone: () => ({ url, method }) });

  it('prefers the network, so a deploy reaches engineers on their next load', async () => {
    const fresh = { ok: true, body: 'fresh', clone: () => ({ body: 'fresh' }) };
    const w = loadWorker({ fetchImpl: async () => fresh });
    const res = await w.fire('fetch', { request: req(BASE + '/app.js') });
    expect((await res).body).toBe('fresh');
  });

  it('falls back to a cached copy with no network', async () => {
    const w = loadWorker();
    for (const u of PRECACHED) w.caches.fetchable.set(u, 'x');
    await w.fire('install');
    const res = await w.fire('fetch', { request: req(BASE + '/app.js') });
    expect(await res).toBeTruthy();
  });

  it('serves a cache-busted asset offline from the entry cached under another version', async () => {
    // Assets are requested as app.js?v=171. A strict match misses app.js?v=170
    // and hands the engineer a blank screen; offline, a slightly stale app beats
    // no app, and the next online load corrects it.
    const w = loadWorker();
    for (const u of PRECACHED) w.caches.fetchable.set(u, 'x');
    await w.fire('install');
    const res = await w.fire('fetch', { request: req(BASE + '/app.js?v=9999') });
    expect(await res).toBeTruthy();
  });

  it('leaves writes alone rather than trying to cache them', async () => {
    const w = loadWorker({ fetchImpl: async () => ({ ok: true, clone: () => ({}) }) });
    const res = await w.fire('fetch', { request: req(BASE + '/anything', 'POST') });
    expect(res).toBeUndefined();
  });
});

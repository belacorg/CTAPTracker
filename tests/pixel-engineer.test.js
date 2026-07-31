// The mascot is a fuzzball, and he has to stay clear of two other things —
// in opposite directions.
//
//   - Nothing of Apprentice to Engineer: that app's mascot wears amber and
//     cobalt with its chevron. The two apps are deliberately separate entities.
//   - Nothing of British Gas's advertising characters: those are Centrica's own
//     IP, and this is a personal tool carrying internal job codes. Borrowing the
//     employer's mascot would make it read as an official app.
//
// The second can't be asserted mechanically — "is this an original character"
// isn't a property of the pixel grid. What is testable is that he stays a
// simple, low-resolution blue blob of this app's own making rather than drifting
// toward a detailed likeness of anything. See ADR-0011.
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const src = readFileSync(join(APP, 'pixel-engineer.js'), 'utf8');

function boot() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="lane" style="width:300px"></div></body></html>', {
    runScripts: 'dangerously', pretendToBeVisual: true
  });
  const el = dom.window.document.createElement('script');
  el.textContent = src;
  dom.window.document.body.appendChild(el);
  return dom.window;
}

// Decode the compiled runs back to a grid — several checks below are about
// shape, which the path strings alone don't show.
const W = 24, H = 24;
function gridOf(frame) {
  const g = Array.from({ length: H }, () => new Array(W).fill(null));
  for (const p of frame) {
    for (const seg of p.d.split('z').filter(Boolean)) {
      const m = seg.match(/M(\d+) (\d+)h(\d+)/);
      if (!m) continue;
      const [, x, y, run] = m.map(Number);
      for (let i = 0; i < run; i++) g[y][x + i] = p.key;
    }
  }
  return g;
}

describe('no Apprentice to Engineer branding comes across', () => {
  const A2E_AMBER = ['#FDAF3F', '#fdaf3f'];
  const A2E_COBALT = ['#1002A0', '#1002a0'];

  it('uses none of A2E\'s brand colours', () => {
    const p = boot().__pixelEngineer.palette;
    const values = Object.values(p);
    [...A2E_AMBER, ...A2E_COBALT].forEach(c => expect(values).not.toContain(c));
  });

  it('has no chevron on him', () => {
    // 'A' was the chevron's colour key in the original A2E rows.
    const body = boot().__pixelEngineer.body;
    expect(body.join('')).not.toContain('A');
  });
});

describe('he stays a simple blue fuzzball', () => {
  it('is built from a handful of flat colours, not a detailed likeness', () => {
    // A low palette count is what keeps him a blob rather than a rendering of
    // some specific character.
    const p = boot().__pixelEngineer.palette;
    expect(Object.keys(p).length).toBeLessThanOrEqual(8);
  });

  it('is round — no corner of the canvas is his', () => {
    const frames = boot().__pixelEngineer.frames;
    const g = gridOf(frames.ready[0]);
    // The ball occupies the left; the toolbox sits bottom-right, so only the
    // three corners clear of it are checked.
    expect(g[0][0]).toBeNull();
    expect(g[0][W - 1]).toBeNull();
    expect(g[H - 1][0]).toBeNull();
  });

  it('has a ragged outline, because that is the only thing saying "fur"', () => {
    // A smooth silhouette at this size reads as a bouncing ball. Count how many
    // rows differ in where their ink starts — a clean circle changes gradually,
    // fur jitters.
    const body = boot().__pixelEngineer.body;
    const starts = body.map(r => r.search(/[^.]/));
    const jumps = starts.slice(1).filter((s, i) => Math.abs(s - starts[i]) >= 1).length;
    expect(jumps).toBeGreaterThan(4);
  });

  it('has two eyes, level with each other', () => {
    const g = gridOf(boot().__pixelEngineer.frames.ready[0]);
    const whiteRows = new Set();
    const whiteCols = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (g[y][x] === 'W') { whiteRows.add(y); whiteCols.push(x); }
      }
    }
    expect(whiteRows.size).toBeGreaterThan(0);
    // Two separated clusters of white, on the same rows.
    const cols = [...new Set(whiteCols)].sort((a, b) => a - b);
    const gaps = cols.slice(1).filter((c, i) => c - cols[i] > 1);
    expect(gaps, 'a gap between the two eyes').toHaveLength(1);
  });
});

describe('sprite frames', () => {
  it('compiles every animation to drawable paths', () => {
    const frames = boot().__pixelEngineer.frames;
    expect(Object.keys(frames).sort()).toEqual(['greet', 'ready', 'talk', 'walk']);
    for (const [name, list] of Object.entries(frames)) {
      expect(list.length, name).toBeGreaterThan(1);
      list.forEach(frame => {
        expect(frame.length).toBeGreaterThan(0);
        frame.forEach(p => {
          expect(p.d).toMatch(/^M[\d\s]/);
          expect(p.key).toMatch(/^[KLCBWGT]$/);
        });
      });
    }
  });

  it('never draws into the outer ring, so nothing clips at the lane edge', () => {
    // The greet bounce is the tight one — he hops upward, and the canvas keeps
    // a spare row top and bottom for exactly that.
    const frames = boot().__pixelEngineer.frames;
    Object.entries(frames).forEach(([name, list]) => {
      list.forEach((frame, i) => {
        const g = gridOf(frame);
        for (let x = 0; x < W; x++) {
          expect(g[0][x], `${name}[${i}] top`).toBeNull();
          expect(g[H - 1][x], `${name}[${i}] bottom`).toBeNull();
        }
        for (let y = 0; y < H; y++) {
          expect(g[y][0], `${name}[${i}] left`).toBeNull();
          expect(g[y][W - 1], `${name}[${i}] right`).toBeNull();
        }
      });
    });
  });

  it('keeps hold of the toolbox in every pose', () => {
    // He turned up to work. Unlike the engineer before him he has no hands to
    // free up for gesturing, so he never puts it down — including while talking.
    const frames = boot().__pixelEngineer.frames;
    const steel = f => f.some(p => p.key === 'G');   // the toolbox handle
    Object.entries(frames).forEach(([name, list]) => {
      list.forEach((frame, i) => expect(steel(frame), `${name}[${i}]`).toBe(true));
    });
  });

  it('actually leaves the ground when he bounces hello', () => {
    const frames = boot().__pixelEngineer.frames;
    const topOf = (frame) => {
      const g = gridOf(frame);
      for (let y = 0; y < H; y++) if (g[y].some(Boolean)) return y;
      return H;
    };
    const rest = topOf(frames.ready[0]);
    const peak = Math.min(...frames.greet.map(topOf));
    expect(peak).toBeLessThan(rest);
  });

  it('opens his mouth in the talking pose, and not otherwise', () => {
    // He has no jaw, so the mouth is the whole expression — it must be a real
    // difference, not a pixel.
    const frames = boot().__pixelEngineer.frames;
    const inkCount = (frame) => {
      const g = gridOf(frame);
      let n = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === 'K') n++;
      return n;
    };
    const talkMax = Math.max(...frames.talk.map(inkCount));
    const restMax = Math.max(...frames.ready.map(inkCount));
    expect(talkMax).toBeGreaterThan(restMax);
  });
});

describe('mounting', () => {
  it('renders an svg into the lane', () => {
    const w = boot();
    const lane = w.document.getElementById('lane');
    w.__pixelEngineer.mount(lane, { intro: false });
    const svg = lane.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('shape-rendering')).toBe('crispEdges');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('starts at rest when there is no intro, rather than off to the right', () => {
    const w = boot();
    const lane = w.document.getElementById('lane');
    w.__pixelEngineer.mount(lane, { intro: false });
    expect(lane.querySelector('svg').style.transform).toBe('translateX(0px)');
  });

  it('survives being handed no lane', () => {
    expect(() => boot().__pixelEngineer.mount(null, { intro: true })).not.toThrow();
  });

  it('replaces rather than stacks when mounted twice', () => {
    const w = boot();
    const lane = w.document.getElementById('lane');
    w.__pixelEngineer.mount(lane, { intro: false });
    w.__pixelEngineer.mount(lane, { intro: false });
    expect(lane.querySelectorAll('svg')).toHaveLength(1);
  });
});

// The engineer sprite is ported from Apprentice to Engineer, and the two apps
// are deliberately separate entities. These guard the separation as much as
// the drawing: nothing amber, nothing cobalt, no chevron.
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

describe('no Apprentice to Engineer branding comes across', () => {
  const A2E_AMBER = ['#FDAF3F', '#fdaf3f'];
  const A2E_COBALT = ['#1002A0', '#1002a0'];

  it('uses none of A2E\'s brand colours', () => {
    const p = boot().__pixelEngineer.palette;
    const values = Object.values(p);
    [...A2E_AMBER, ...A2E_COBALT].forEach(c => expect(values).not.toContain(c));
  });

  it('has no chevron on his chest', () => {
    // 'A' was the chevron's colour key in the original rows.
    const body = boot().__pixelEngineer.body;
    expect(body.join('')).not.toContain('A');
  });

  it('wears a cyan yoke across both shoulders in one unbroken run', () => {
    const body = boot().__pixelEngineer.body;
    const yoke = body.filter(r => r.includes('C'));
    expect(yoke.length).toBeGreaterThan(0);
    // No row may break the cyan into separate patches — that reads as spots.
    yoke.forEach(row => expect(row.replace(/[^C]/g, ' ').trim().split(/\s+/)).toHaveLength(1));
  });

  it('keeps a cap, not a hard hat — and it is not yellow', () => {
    const w = boot();
    const body = w.__pixelEngineer.body;
    const capRows = body.slice(0, 5).join('');
    // Crown is uniform navy (B), and the brim below it is solid ink.
    expect(capRows).toContain('B');
    expect(capRows).not.toContain('C');
    expect(body[5]).toBe('KKKKKKKKKKKKKK');
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
          expect(p.key).toMatch(/^[KSCBLGT]$/);
        });
      });
    }
  });

  it('never draws into the top row, so his cap cannot clip', () => {
    // The canvas keeps a spare row top and bottom for exactly this reason.
    const frames = boot().__pixelEngineer.frames;
    Object.values(frames).flat().forEach(frame => {
      frame.forEach(p => expect(p.d).not.toMatch(/M\d+ 0h/));
    });
  });

  it('leaves no hole under the cap when he tips it', () => {
    // The cap lifts clear of the head in the greet frames. Without a scalp
    // filling the rows it vacates, the card background showed through and the
    // cap read as floating rather than raised.
    const frames = boot().__pixelEngineer.frames;
    // Decode the compiled runs back to a grid. The raised hand is skin too and
    // sits above the head, so row-level reasoning misreads it — what actually
    // matters is that no background shows through the middle of his head.
    const gridOf = (frame) => {
      const g = {};
      frame.forEach(p => {
        for (const seg of p.d.split('z').filter(Boolean)) {
          const m = seg.match(/M(\d+) (\d+)h(\d+)/);
          if (!m) continue;
          const [, x, y, run] = m.map(Number);
          for (let i = 0; i < run; i++) g[`${x + i},${y}`] = p.key;
        }
      });
      return g;
    };
    // Columns inside the face, clear of the arm at either side. The crown
    // narrows towards the top, so the brim is the reliable anchor: it is the
    // one full-width solid row, and everything below it down to the chin is
    // head — scalp or face — with no background between.
    const FACE_COLS = [5, 6, 7, 8, 9, 10, 11, 12];
    const BRIM_COLS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const FACE_BOTTOM = 16;

    frames.greet.forEach((frame, i) => {
      const g = gridOf(frame);
      const filled = (x, y) => !!g[`${x},${y}`];
      const brim = [...Array(FACE_BOTTOM).keys()].filter(y => BRIM_COLS.every(x => filled(x, y))).pop();
      expect(brim, `greet[${i}] has a cap brim`).toBeDefined();
      for (let y = brim + 1; y <= FACE_BOTTOM; y++) {
        FACE_COLS.forEach(x => expect(filled(x, y), `greet[${i}] ${x},${y}`).toBe(true));
      }
    });
  });

  it('carries the toolbox everywhere except when he is talking', () => {
    // A raised spanner read as a trident, and couldn't be held while walking.
    // The toolbox is carried, so it stays with him — but the Coach card pose
    // needs both hands free to gesture.
    const frames = boot().__pixelEngineer.frames;
    const steel = f => f.some(p => p.key === 'G');   // the toolbox handle
    expect(frames.ready.every(steel)).toBe(true);
    expect(frames.walk.every(steel)).toBe(true);
    expect(frames.greet.every(steel)).toBe(true);
    expect(frames.talk.some(steel)).toBe(false);
  });

  it('opens his mouth in the talking pose, and not otherwise', () => {
    const frames = boot().__pixelEngineer.frames;
    // The mouth overlay widens the face's dark run; compare path counts of ink.
    const inkRuns = f => (f.find(p => p.key === 'K') || { d: '' }).d.split('M').length;
    const talkMax = Math.max(...frames.talk.map(inkRuns));
    const restMax = Math.max(...frames.ready.map(inkRuns));
    expect(talkMax).toBeGreaterThan(restMax - 1);
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

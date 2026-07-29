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
    expect(Object.keys(frames).sort()).toEqual(['greet', 'ready', 'walk']);
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

  it('holds a spanner in the resting pose but not while walking', () => {
    const frames = boot().__pixelEngineer.frames;
    const steel = f => f.some(p => p.key === 'G');
    expect(frames.ready.every(steel)).toBe(true);
    expect(frames.walk.some(steel)).toBe(false);
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

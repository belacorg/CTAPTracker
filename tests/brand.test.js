// The header mark.
//
// The old mark looked out of place for reasons that are all checkable: it
// carried a blue of its own, a shade off the accent beside it, drawn in the
// markup where no theme could reach it. The time C takes its colours from the
// stylesheet instead, and these tests keep it that way.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { bootApp } from './helpers/app-harness.js';

describe('the brand mark', () => {
  it('renders in the header beside the app name', () => {
    const h = bootApp();
    expect(h.$('.top-bar .brand-mark')).toBeTruthy();
    expect(h.$('.top-bar').textContent).toMatch(/CTAP Tracker/);
  });

  it('hard-codes no colour, so it cannot drift from the theme', () => {
    const h = bootApp();
    for (const el of h.$('.top-bar .brand-mark').querySelectorAll('*')) {
      expect(el.getAttribute('stroke'), 'stroke set in markup').toBeNull();
      expect(String(el.getAttribute('fill') ?? ''), 'fill set in markup').not.toMatch(/^#|rgb/i);
    }
  });

  it('takes the accent for the C and the text colour for the hands', () => {
    const css = readFileSync('app/style.css', 'utf8');
    expect(css).toMatch(/\.brand-mark-c\s*\{[^}]*stroke:\s*var\(--accent\)/);
    expect(css).toMatch(/\.brand-mark-hands\s*\{[^}]*stroke:\s*var\(--text\)/);
  });

  it('is decorative, so a screen reader reads the name once rather than a picture of it', () => {
    const h = bootApp();
    expect(h.$('.top-bar .brand-mark').getAttribute('aria-hidden')).toBe('true');
  });

  it('carries no trace of the old mark and its separate blue', () => {
    for (const f of ['app/app.js', 'app/style.css', 'app/index.html']) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/4169e1/i);
    }
  });
});

// One typeface.
//
// Log Job's figures were set in JetBrains Mono — a coding font with a dotted
// zero — beside DM Sans everywhere else, and it read as a different app. Figures
// now use DM Sans with tabular-nums, which keeps columns aligned the way the
// monospace face was there to do.
describe('typography', () => {
  const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('sets every figure in the app font, with no monospace face', () => {
    expect(noComments(readFileSync('app/style.css', 'utf8'))).not.toMatch(/font-mono|monospace|JetBrains/i);
  });

  it('keeps Log Job figures on tabular numerals, so credits still line up', () => {
    const css = readFileSync('app/style.css', 'utf8');
    for (const sel of ['lj-row-credit', 'lj-chip-credit', 'lj-session-val', 'voice-item-credit', 'voice-total-val']) {
      expect(css, sel).toMatch(new RegExp(`\\.${sel}\\s*\\{[^}]*tabular-nums`));
    }
  });

  it('loads and precaches DM Sans alone', () => {
    expect(noComments(readFileSync('app/fonts.css', 'utf8'))).not.toMatch(/JetBrains/);
    expect(noComments(readFileSync('app/sw.js', 'utf8'))).not.toMatch(/JetBrains/);
  });
});

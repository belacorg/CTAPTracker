// The engineer walks in along the greeting line while the greeting is being
// typed out a character at a time.
//
// The lane is `flex: 1` beside the greeting, so anything that changes the
// greeting's width moves the lane's left edge — and the sprite is positioned
// from that edge. Typing straight into the greeting element widened it ~19
// times during the walk-in, shunting him ~20px right per frame while he stepped
// only ~5px left. He read as skipping to the right rather than strolling in.
//
// The fix is a hidden ghost that holds the final width (trailing dots included)
// from the very first frame, with the typed text laid over it. These guard the
// shape of that fix: jsdom does no layout, but it can prove the ghost survives
// the typewriter — and if anyone types into the parent again, it won't.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

function dashboard() {
  const h = bootApp();
  h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
  return h;
}

describe('the greeting reserves its width so the lane cannot move', () => {
  it('renders a ghost and a live layer inside the greeting', () => {
    const h = dashboard();
    expect(h.$('.dash-greeting-ghost')).toBeTruthy();
    expect(h.$('.dash-greeting-live')).toBeTruthy();
  });

  it('sizes the ghost to the greeting plus its trailing dots', () => {
    const h = dashboard();
    const greeting = h.$('#greeting-text').dataset.greeting;
    expect(greeting.length).toBeGreaterThan(0);
    // The dots roll on after typing finishes. Without them in the ghost the box
    // grows three characters mid-walk and he jumps right again.
    expect(h.$('.dash-greeting-ghost').textContent).toBe(greeting + '...');
  });

  it('leaves the ghost untouched when the typewriter clears the line', () => {
    // The typewriter starts by emptying the text. If it empties the parent
    // rather than the live layer, the ghost goes with it and the width is lost.
    const h = dashboard();
    const greeting = h.$('#greeting-text').dataset.greeting;
    expect(h.$('.dash-greeting-ghost').textContent).toBe(greeting + '...');
    expect(h.$('.dash-greeting-live').textContent).toBe('');
  });

  it('keeps the lane a sibling of the greeting, not a child of it', () => {
    // Nested inside, it would inherit the reflow the ghost exists to prevent.
    const h = dashboard();
    const lane = h.$('#pixel-lane');
    expect(lane).toBeTruthy();
    expect(lane.parentElement.classList.contains('dash-greeting-row')).toBe(true);
    expect(h.$('#greeting-text').contains(lane)).toBe(false);
  });
});

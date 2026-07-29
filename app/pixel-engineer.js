// The little engineer — 8-bit sprite on a 22×27 grid.
//
// Ported from the Apprentice to Engineer app, re-dressed for this one. The two
// apps stay separate entities: none of A2E's branding comes across. Its mascot
// wears amber and cobalt with the A2E chevron on his chest — here the chevron
// is gone entirely and the palette is a British Gas engineer's: navy uniform,
// cyan shoulder yoke and upper sleeves, navy cap. Cap, not a hard hat —
// domestic gas engineers don't wear site PPE.
//
// Sprites are rows of single-character colour keys, compiled once at load into
// one SVG path per colour, so a frame is ~6 <path>s rather than 300 <rect>s.
// Frame rates are low on purpose: the snapping is what makes it read as a
// sprite rather than a smooth animation with a pixel filter over it.
(function () {
  'use strict';

  var PALETTE = {
    K: '#0B0A14', // ink outline
    S: '#F7C99B', // face
    C: '#3FC1F0', // cyan — shoulder yoke and sleeves
    B: '#1D4E89', // navy uniform
    L: '#2A6BB0', // limbs, a lift on the navy
    G: '#D6DBEF', // steel
    T: '#FFC857'  // sparks
  };

  // Rows 11–12 are the cyan yoke: a solid band across both shoulders and the
  // top of the chest, which is where the real uniform carries it. In the A2E
  // original those pixels were the brand chevron — replacing rather than
  // deleting them keeps his silhouette identical while removing the branding.
  // Cyan picked out per-shoulder instead reads as four disconnected patches at
  // this size; it needs to be one unbroken run to say "yoke".
  var BODY = [
    '.....KKKK.....',
    '...KKBBBBKK...',
    '..KBBBBBBBBK..',
    '.KBBBBBBBBBBK.',
    'KBBBBBBBBBBBBK',
    'KKKKKKKKKKKKKK',
    '.KSSSSSSSSSSK.',
    '.KSKKSSSSKKSK.',
    '.KSSSSSSSSSSK.',
    '.KSSSSKKSSSSK.',
    '..KKSSSSSSKK..',
    '...KCCCCCCK...',
    '..KCCCCCCCCK..',
    '..KBBBBBBBBK..',
    '..KBBBBBBBBK..',
    '...KBBBBBBK...',
    '....KBKKBK....',
    '....KBKKBK....',
    '...KKKKKKKK...'
  ];

  var CAP = BODY.slice(0, 6);
  var BELOW_CAP = BODY.slice(6);
  var ABOVE_LEGS = BODY.slice(0, 16);
  var LEGS_STRIDE = ['...KBK..KBK...', '..KBK....KBK..', '..KKK....KKK..'];

  // Cyan sleeve on the upper arm, continuing the yoke out along the shoulder.
  var ARM_DOWN = ['KCK', 'KCK', 'KSK', 'KKK'];
  var ARM_HIGH = ['KKK', 'KSK', 'KSK', 'KLK', 'KCK', 'KCK', 'KKK'];
  var ARM_SWING = ['KKK', 'KCK', 'KCK', 'KSK', 'KKK'];
  var SPANNER_UP = ['.K.K.', 'KGKGK', 'KG.GK', 'KGKGK', 'KGGGK', '.KGK.', '.KGK.', '.KGK.', '.KKK.'];

  var W = 22, H = 27, BX = 2, BY = 6;

  function paint(layers) {
    var grid = [];
    for (var r = 0; r < H; r++) { grid.push(new Array(W).fill('.')); }
    layers.forEach(function (l) {
      for (var r = 0; r < l.sp.length; r++) {
        for (var c = 0; c < l.sp[r].length; c++) {
          var key = l.sp[r][c];
          if (key === '.') continue;
          var gy = l.y + r, gx = l.x + c;
          if (gy < 0 || gy >= H || gx < 0 || gx >= W) continue;
          grid[gy][gx] = key;
        }
      }
    });
    return grid;
  }

  // Merge each colour's pixels into one path, run by run along each row.
  function compile(layers) {
    var grid = paint(layers);
    var runs = {};
    for (var y = 0; y < H; y++) {
      var x = 0;
      while (x < W) {
        var key = grid[y][x];
        if (key === '.') { x++; continue; }
        var run = 1;
        while (x + run < W && grid[y][x + run] === key) run++;
        (runs[key] = runs[key] || []).push('M' + x + ' ' + y + 'h' + run + 'v1h-' + run + 'z');
        x += run;
      }
    }
    return Object.keys(runs).filter(function (k) { return PALETTE[k]; })
      .map(function (k) { return { key: k, d: runs[k].join('') }; });
  }

  // ── poses ──
  function armsDown(bob) {
    return [{ sp: ARM_DOWN, x: BX, y: BY + 12 + bob }, { sp: ARM_DOWN, x: BX + 11, y: BY + 12 + bob }];
  }
  function stand(bob) {
    bob = bob || 0;
    return [{ sp: BODY, x: BX, y: BY + bob }].concat(armsDown(bob));
  }
  function stride(bob) {
    return [
      { sp: ABOVE_LEGS, x: BX, y: BY + bob },
      { sp: LEGS_STRIDE, x: BX, y: BY + bob + 16 },
      { sp: ARM_SWING, x: BX, y: BY + bob + 11 },
      { sp: ARM_SWING, x: BX + 11, y: BY + bob + 13 }
    ];
  }
  function tipCap(lift) {
    return [
      { sp: BELOW_CAP, x: BX, y: BY + 6 },
      { sp: CAP, x: BX - 2, y: BY - lift },
      { sp: ARM_DOWN, x: BX, y: BY + 12 },
      { sp: ARM_HIGH, x: BX + 11, y: BY + 1 }
    ];
  }
  // Spanner shouldered — his resting pose here, since he's turned up to work.
  function holdUp(bob) {
    return stand(bob).concat([
      { sp: ARM_HIGH, x: BX + 11, y: BY + 4 + bob },
      { sp: SPANNER_UP, x: BX + 12, y: BY - 4 + bob }
    ]);
  }

  var FRAMES = {
    walk: [compile(stride(0)), compile(stand(0)), compile(stride(1)), compile(stand(0))],
    greet: [
      compile(stand(0)), compile(tipCap(2)), compile(tipCap(2)),
      compile(tipCap(1)), compile(stand(0)), compile(stand(1))
    ],
    ready: [compile(holdUp(0)), compile(holdUp(0)), compile(holdUp(1)), compile(holdUp(0))]
  };
  var FPS = { walk: 8, greet: 3, ready: 2 };

  function draw(svg, paths) {
    svg.innerHTML = paths.map(function (p) {
      return '<path fill="' + PALETTE[p.key] + '" d="' + p.d + '"/>';
    }).join('');
  }

  var _timer = null;

  function stop() {
    if (_timer) { clearTimeout(_timer); _timer = null; }
  }

  // Walks in from the right, tips his cap, then settles holding the spanner.
  // `intro: false` skips straight to the resting pose — a re-render shouldn't
  // send him walking on again.
  function mount(lane, opts) {
    stop();
    if (!lane) return;
    opts = opts || {};
    lane.innerHTML = '';

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('class', 'pixel-eng');
    lane.appendChild(svg);

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!opts.intro || reduced) {
      svg.style.transform = 'translateX(0px)';
      draw(svg, FRAMES.ready[0]);
      if (!reduced) loop('ready', 0);
      return;
    }

    // Distance to cross, stepped in whole pixels per frame so the movement
    // snaps like the sprite does rather than gliding underneath it.
    var travel = Math.max(0, lane.clientWidth - svg.getBoundingClientRect().width);
    var walkFrames = 16;
    var step = travel / walkFrames;
    var i = 0;

    (function walkTick() {
      svg.style.transform = 'translateX(' + Math.round(travel - step * i) + 'px)';
      draw(svg, FRAMES.walk[i % FRAMES.walk.length]);
      i++;
      if (i <= walkFrames) {
        _timer = setTimeout(walkTick, 1000 / FPS.walk);
      } else {
        svg.style.transform = 'translateX(0px)';
        playOnce('greet', function () { loop('ready', 0); });
      }
    })();

    function playOnce(name, done) {
      var f = 0;
      (function tick() {
        draw(svg, FRAMES[name][f]);
        f++;
        if (f < FRAMES[name].length) _timer = setTimeout(tick, 1000 / FPS[name]);
        else if (done) done();
      })();
    }

    function loop(name, from) {
      var f = from || 0;
      (function tick() {
        draw(svg, FRAMES[name][f % FRAMES[name].length]);
        f++;
        _timer = setTimeout(tick, 1000 / FPS[name]);
      })();
    }
  }

  window.__pixelEngineer = {
    mount: mount,
    stop: stop,
    palette: PALETTE,
    body: BODY,
    frames: FRAMES
  };
})();

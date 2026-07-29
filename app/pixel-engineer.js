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
  // A carried toolbox rather than a raised spanner — held up, the spanner's
  // open jaws read as a trident. Carried at the hip it also lets him keep it
  // while walking, which a raised tool can't.
  // Handle in steel, not ink — an ink handle on a dark card is invisible, which
  // left just the cyan body reading as a slab on the floor.
  var TOOLBOX = [
    '..GGG..',
    '.G...G.',
    'KKKKKKK',
    'KCCCCCK',
    'KCCCCCK',
    'KKKKKKK'
  ];
  // Mouth open — the talking overlay for the Coach card.
  var MOUTH_OPEN = ['KKKK'];
  var ARM_OUT = ['KKKKK', 'KCLSK', 'KKKKK'];

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
  // The toolbox hangs off his right hand, so the cap is tipped with the left —
  // and the cap tilts away from the lifting arm, hence the shift right.
  function tipCap(lift) {
    return [
      { sp: BELOW_CAP, x: BX, y: BY + 6 },
      { sp: CAP, x: BX + 2, y: BY - lift },
      { sp: ARM_HIGH, x: BX - 1, y: BY + 1 },
      { sp: ARM_DOWN, x: BX + 11, y: BY + 12 },
      { sp: TOOLBOX, x: 11, y: BY + 12 }
    ];
  }
  // Stood with the toolbox — his resting pose, since he's turned up to work.
  function carry(bob) {
    bob = bob || 0;
    return stand(bob).concat([{ sp: TOOLBOX, x: 11, y: BY + 12 + bob }]);
  }
  // Walking with it: the near arm swings, the far one keeps hold.
  function strideCarry(bob) {
    return [
      { sp: ABOVE_LEGS, x: BX, y: BY + bob },
      { sp: LEGS_STRIDE, x: BX, y: BY + bob + 16 },
      { sp: ARM_SWING, x: BX, y: BY + bob + 11 },
      { sp: ARM_DOWN, x: BX + 11, y: BY + bob + 12 },
      { sp: TOOLBOX, x: 12, y: BY + bob + 13 }
    ];
  }
  // Mid-sentence, for the Coach card — mouth open, one hand doing the talking.
  function talking(gesture) {
    return stand(0)
      .concat([{ sp: MOUTH_OPEN, x: BX + 5, y: BY + 9 }])
      .concat(gesture ? [{ sp: ARM_OUT, x: BX + 11, y: BY + 11 }] : []);
  }

  var FRAMES = {
    // No vertical bob: combined with the horizontal step it read as hopping
    // rather than walking. Legs alternate, height stays put.
    walk: [compile(strideCarry(0)), compile(carry(0))],
    greet: [
      compile(carry(0)), compile(tipCap(2)), compile(tipCap(2)),
      compile(tipCap(1)), compile(carry(0)), compile(carry(1))
    ],
    ready: [compile(carry(0)), compile(carry(0)), compile(carry(1)), compile(carry(0))],
    talk: [
      compile(talking(false)), compile(talking(true)), compile(stand(0)),
      compile(talking(true)), compile(talking(false)), compile(stand(0))
    ]
  };
  var FPS = { walk: 8, greet: 3, ready: 2, talk: 4 };

  function draw(svg, paths) {
    svg.innerHTML = paths.map(function (p) {
      return '<path fill="' + PALETTE[p.key] + '" d="' + p.d + '"/>';
    }).join('');
  }

  var _timers = [];

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    _timers.push(id);
    return id;
  }

  // Clears every running sprite. A full render rebuilds all the lanes, so the
  // caller stops everything once and then mounts what's on the page.
  function stop() {
    _timers.forEach(function (t) { clearTimeout(t); });
    _timers = [];
  }

  // Walks in from the right, tips his cap, then settles holding the spanner.
  // `intro: false` skips straight to the resting pose — a re-render shouldn't
  // send him walking on again.
  function mount(lane, opts) {
    if (!lane) return;
    opts = opts || {};
    var pose = opts.pose || 'ready';
    lane.innerHTML = '';

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('class', 'pixel-eng');
    lane.appendChild(svg);

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!opts.intro || reduced) {
      svg.style.transform = 'translateX(0px)';
      draw(svg, FRAMES[pose][0]);
      if (!reduced) loop(pose, 0);
      return;
    }

    // Step size is set in sprite pixels, not by dividing the distance up — the
    // latter gave ~20px lurches that read as hopping. Three sprite pixels a
    // frame is the usual pixel-art walk, and the legs swap every other frame so
    // a stride covers six rather than flickering.
    var spriteW = svg.getBoundingClientRect().width || 44;
    var scale = spriteW / W;
    var step = 3 * scale;
    var RUN_IN = 120;   // he strolls in from nearby; crossing the full width was a route march
    var travel = Math.min(RUN_IN, Math.max(0, lane.clientWidth - spriteW));
    var walkFrames = Math.max(1, Math.round(travel / step));
    var i = 0;

    (function walkTick() {
      svg.style.transform = 'translateX(' + Math.round(travel - step * i) + 'px)';
      draw(svg, FRAMES.walk[Math.floor(i / 2) % FRAMES.walk.length]);
      i++;
      if (i <= walkFrames) {
        later(walkTick, 1000 / FPS.walk);
      } else {
        svg.style.transform = 'translateX(0px)';
        playOnce('greet', function () { loop(pose, 0); });
      }
    })();

    function playOnce(name, done) {
      var f = 0;
      (function tick() {
        draw(svg, FRAMES[name][f]);
        f++;
        if (f < FRAMES[name].length) later(tick, 1000 / FPS[name]);
        else if (done) done();
      })();
    }

    function loop(name, from) {
      var f = from || 0;
      (function tick() {
        draw(svg, FRAMES[name][f % FRAMES[name].length]);
        f++;
        later(tick, 1000 / FPS[name]);
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

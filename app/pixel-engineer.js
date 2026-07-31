// The little fuzzball — 8-bit sprite on a 24×24 grid.
//
// He replaces the pixel engineer who stood here before. Two separations matter,
// and they point in opposite directions:
//
//   1. Nothing of Apprentice to Engineer comes across. That app's mascot wears
//      amber and cobalt with its chevron on his chest. None of those colours
//      appear here and there is no chevron. The apps stay separate entities.
//
//   2. He is not one of British Gas's advertising characters either. Those are
//      Centrica's own IP, and this is a personal tool that already carries
//      internal job codes — borrowing the employer's mascot would make it read
//      as an official app, which is the thing to avoid. So he is an original:
//      a round blue fuzzball of this app's own design, sharing nothing with
//      that campaign beyond being blue and being fuzzy.
//
// He keeps the toolbox. He turned up to work.
//
// Sprites are rows of single-character colour keys, compiled once at load into
// one SVG path per colour, so a frame is ~6 <path>s rather than 500 <rect>s.
// Frame rates are low on purpose: the snapping is what makes it read as a
// sprite rather than a smooth animation with a pixel filter over it.
(function () {
  'use strict';

  var PALETTE = {
    K: '#0B0A14', // ink outline
    L: '#7FD8F7', // lit fur, catching the light up top
    C: '#3FC1F0', // cyan — his body colour
    B: '#1D4E89', // navy — the shadow he sits in
    W: '#FFFFFF', // eyes
    G: '#D6DBEF', // steel
    T: '#FFC857'  // sparks
  };

  // Sixteen rows square. The silhouette is deliberately ragged rather than a
  // clean circle — at this resolution a smooth outline reads as a bouncing
  // ball, and the single-pixel bumps are the only thing saying "fur".
  var BALL = [
    '....K.KK.KK.K...',
    '...KKKKKKKKKKK..',
    '..KKLLLLLLLLLKK.',
    '.KLLLLLLLLLLLLK.',
    'KKLLLLLLLLLLLLKK',
    'KLLLLLLLLLLLLLLK',
    'KLLLLLLLLLLLLLLK',
    'KLLLLLLLLLLLLLLK',
    'KCCCCCCCCCCCCCCK',
    'KCCCCCCCCCCCCCCK',
    'KCCCCCCCCCCCCCCK',
    'KKCCCCCCCCCCCCKK',
    '.KCCCCCCCCCCCCK.',
    '.KKBBBBBBBBBBKK.',
    '..KKKBBBBBBKKK..',
    '....KKK..KKK....'
  ];

  var BODY_NO_FEET = BALL.slice(0, 15);
  var FEET_STAND  = ['....KKK..KKK....'];
  // Mid-stride: one foot forward, one trailing. Two pixels of travel is enough
  // to read at 8fps — more and he waddles.
  var FEET_STRIDE = ['..KKK.....KKK...'];

  // Eyes sit high on the body, which is what stops him reading as a face drawn
  // on a beachball. No ink border: outlined at this size they read as goggles,
  // and he is not wearing glasses. White straight onto the fur, pupil centred.
  var EYE_OPEN = [
    '.WW.',
    'WKKW',
    'WKKW',
    '.WW.'
  ];
  var EYE_SHUT = [
    '....',
    'KKKK',
    '....',
    '....'
  ];
  // Talking overlay. He has no jaw, so the mouth is the whole expression.
  var MOUTH_OPEN  = ['KKKK', 'KKKK'];
  var MOUTH_SMALL = ['KKKK'];

  // Carried rather than raised: held up, the spanner it replaced read as a
  // trident, and a raised tool can't be kept while walking.
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

  var W = 24, H = 24, BX = 1, BY = 3;
  var EYE_Y = 6, EYE_LX = 3, EYE_RX = 9;   // relative to the ball
  var BOX_X = 15, BOX_Y = 13;

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
  // Every pose is the same ball with different feet, eyes and overlays, so he
  // never changes shape between frames — which is what a fuzzball should do.
  function base(bob, feet, eye) {
    var y = BY + bob;
    return [
      { sp: BODY_NO_FEET, x: BX, y: y },
      { sp: feet || FEET_STAND, x: BX, y: y + 15 },
      { sp: eye || EYE_OPEN, x: BX + EYE_LX, y: y + EYE_Y },
      { sp: eye || EYE_OPEN, x: BX + EYE_RX, y: y + EYE_Y }
    ];
  }
  function withBox(layers, bob) {
    return layers.concat([{ sp: TOOLBOX, x: BOX_X, y: BOX_Y + bob }]);
  }
  // His resting pose — stood holding the toolbox.
  function carry(bob) {
    bob = bob || 0;
    return withBox(base(bob), bob);
  }
  function stride(bob) {
    return withBox(base(bob, FEET_STRIDE), bob);
  }
  // Greeting is a bounce and a blink. He has no cap to tip and no arm worth
  // waving at this size, but a ball that hops reads as pleased to see you.
  function bounce(bob, eye) {
    return withBox(base(bob, FEET_STAND, eye), bob);
  }
  // Mid-sentence, for the Coach card.
  function talking(wide) {
    return withBox(
      base(0).concat([{ sp: wide ? MOUTH_OPEN : MOUTH_SMALL, x: BX + 6, y: BY + 11 }]),
      0
    );
  }

  var FRAMES = {
    // No vertical bob: combined with the horizontal step it read as hopping
    // rather than walking. Feet alternate, height stays put.
    walk: [compile(stride(0)), compile(carry(0))],
    // The hop tops out at -2: BY is 3, so -3 would put his top tufts in row 0
    // and the lane would shave them off at the peak of the bounce.
    greet: [
      compile(carry(0)), compile(bounce(-1)), compile(bounce(-2)),
      compile(bounce(-1)), compile(bounce(0, EYE_SHUT)), compile(carry(0))
    ],
    ready: [compile(carry(0)), compile(carry(0)), compile(carry(1)), compile(carry(0))],
    talk: [
      compile(talking(false)), compile(talking(true)), compile(carry(0)),
      compile(talking(true)), compile(talking(false)), compile(carry(0))
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

  // Rolls in from the right, bounces hello, then settles holding the toolbox.
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
    // frame is the usual pixel-art walk, and the feet swap every other frame so
    // a stride covers six rather than flickering.
    var spriteW = svg.getBoundingClientRect().width || 44;
    var scale = spriteW / W;
    var step = 3 * scale;
    var RUN_IN = 120;   // he ambles in from nearby; crossing the full width was a route march
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
    body: BALL,
    frames: FRAMES
  };
})();

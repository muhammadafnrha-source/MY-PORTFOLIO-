/* ----------------------------------------------------------------
   Afnan Portfolio — Gemini-inspired electric lightning border.
   - Continuous energy trail traveling all four viewport edges (rAF loop).
   - Smooth cursor glow + magnetic edge proximity boost.
   - Electric particles, soft pulses, multi-layer neon glow.
   - pointer-events: none — never blocks clicks, scrolls or selection.
   - Respects prefers-reduced-motion (static glowing border, no loop).
   - Reduced particle count / DPR on low-powered devices & mobile.
------------------------------------------------------------------ */
(function () {
  'use strict';

  var canvas = document.getElementById('electric-border');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  /* --- Theme-aware palette: deep navy base + electric blue / cyan / violet --- */
  var LIGHT = { stroke: 'rgba(37,99,235,0.55)', glow1: 'rgba(56,189,248,0.16)', glow2: 'rgba(124,58,237,0.10)', core: 'rgba(255,255,255,0.85)', pulse: 'rgba(14,165,233,0.14)', particle: 'rgba(56,189,248,0.85)' };
  var DARK  = { stroke: 'rgba(96,165,250,0.60)', glow1: 'rgba(56,189,248,0.20)', glow2: 'rgba(167,139,250,0.14)', core: 'rgba(255,255,255,0.95)', pulse: 'rgba(139,92,246,0.16)', particle: 'rgba(125,211,252,0.9)' };
  function palette() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? DARK : LIGHT;
  }

  var W = 0, H = 0, dpr = 1, raf = null, particles = [];
  var mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, has: false };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  var TRAIL_LEN = isMobile || lowPower ? 90 : 150;      // head-to-tail arc length
  var TRAIL_SPEED = 150;                                 // px / s — smooth continuous flow
  var MAX_PARTICLES = isMobile || lowPower ? 10 : 26;

  /* --- Geometry: rounded-rectangle path inset from viewport, perimeter walk --- */
  var PATH = null; // {pts:[{x,y}], cum:[...], total}
  function buildPath() {
    var inset = 10, r = 26;
    var x0 = inset, y0 = inset, x1 = W - inset, y1 = H - inset;
    var pts = [];
    function line(x, y, x2, y2, step) {
      var dx = x2 - x, dy = y2 - y;
      var len = Math.hypot(dx, dy);
      var n = Math.max(1, Math.ceil(len / step));
      for (var i = 0; i < n; i++) { pts.push({ x: x + dx * (i / n), y: y + dy * (i / n) }); }
    }
    var s = 6;
    line(x0 + r, y0, x1 - r, y0, s);                    // top edge
    // top-right corner (quadratic arc)
    var cx = x1, cy = y0, ex = x1, ey = y0 + r;
    for (var a = 0; a <= 10; a++) { var t = a / 10, q1 = 1 - t; pts.push({ x: q1 * q1 * (x1 - r) + 2 * q1 * t * cx + t * t * ex, y: q1 * q1 * cy + 2 * q1 * t * cy + t * t * ey }); }
    line(x1, y0 + r, x1, y1 - r, s);                    // right edge
    var cx2 = x1, cy2 = y1, ex2 = x1 - r, ey2 = y1;     // bottom-right
    for (var b = 0; b <= 10; b++) { var t2 = b / 10, q2 = 1 - t2; pts.push({ x: q2 * q2 * x1 + 2 * q2 * t2 * cx2 + t2 * t2 * ex2, y: q2 * q2 * (y1 - r) + 2 * q2 * t2 * cy2 + t2 * t2 * ey2 }); }
    line(x1 - r, y1, x0 + r, y1, s);                    // bottom edge
    var cx3 = x0, cy3 = y1, ex3 = x0, ey3 = y1 - r;     // bottom-left
    for (var c = 0; c <= 10; c++) { var t3 = c / 10, q3 = 1 - t3; pts.push({ x: q3 * q3 * (x0 + r) + 2 * q3 * t3 * cx3 + t3 * t3 * ex3, y: q3 * q3 * y1 + 2 * q3 * t3 * cy3 + t3 * t3 * ey3 }); }
    line(x0, y1 - r, x0, y0 + r, s);                    // left edge
    var cx4 = x0, cy4 = y0, ex4 = x0 + r, ey4 = y0;     // top-left
    for (var d = 0; d <= 10; d++) { var t4 = d / 10, q4 = 1 - t4; pts.push({ x: q4 * q4 * x0 + 2 * q4 * t4 * cx4 + t4 * t4 * ex4, y: q4 * q4 * (y0 + r) + 2 * q4 * t4 * cy4 + t4 * t4 * ey4 }); }

    var cum = [0];
    for (var i = 1; i <= pts.length; i++) {
      var p = pts[i % pts.length], prev = pts[i - 1];
      cum.push(cum[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y));
    }
    PATH = { pts: pts, cum: cum, total: cum[cum.length - 1] };
  }
  function pointAt(dist) {
    var total = PATH.total;
    var d = ((dist % total) + total) % total;
    var cum = PATH.cum, pts = PATH.pts;
    var lo = 0, hi = cum.length - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (cum[mid] < d) lo = mid + 1; else hi = mid; }
    var i = Math.max(1, lo);
    var seg = cum[i] - cum[i - 1] || 1;
    var f = (d - cum[i - 1]) / seg;
    var a = pts[(i - 1) % pts.length], b = pts[i % pts.length];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }

  /* --- Sizing (CSS pixels, DPR-capped for performance) --- */
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, isMobile || lowPower ? 1.5 : 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPath();
  }
  window.addEventListener('resize', resize, { passive: true });

  /* --- Mouse: smoothed target + magnetic edge proximity --- */
  function onMove(e) {
    mouse.tx = e.clientX; mouse.ty = e.clientY; mouse.has = true;
  }
  document.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseleave', function () { mouse.has = false; }, { passive: true });
  document.addEventListener('touchmove', function () { mouse.has = false; }, { passive: true });
  function edgeProximity(x, y) {
    // 1 near any edge → stronger glow near cursor; 0 deep inside
    var dEdge = Math.min(x, W - x, y, H - y);
    return Math.max(0, 1 - dEdge / 220);
  }

  /* --- Render loop --- */
  var head = 0, last = 0, pulsePhase = 0;
  function draw(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    head = (head + TRAIL_SPEED * dt) % PATH.total;
    pulsePhase += dt * 0.9;

    // ease cursor toward target — no jerks
    if (mouse.has) {
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
    }
    var c = palette();
    var proximity = mouse.has ? edgeProximity(mouse.x, mouse.y) : 0;

    ctx.clearRect(0, 0, W, H);

    // layer 1: soft breathing pulse (full border halo)
    var pulse = 0.5 + 0.5 * Math.sin(pulsePhase);
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.35 * pulse;
    ctx.strokeStyle = c.pulse;
    ctx.lineWidth = 16 + 6 * pulse;
    ctx.shadowColor = 'rgba(56,189,248,0.35)';
    ctx.shadowBlur = 22;
    tracePath(ctx);
    ctx.stroke();
    ctx.restore();

    // layer 2: outer neon glow of the whole border
    ctx.save();
    ctx.strokeStyle = c.glow1;
    ctx.lineWidth = 9;
    ctx.shadowColor = 'rgba(56,189,248,0.55)';
    ctx.shadowBlur = 18;
    tracePath(ctx);
    ctx.stroke();
    ctx.restore();

    // layer 3: main border line
    ctx.save();
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(99,102,241,0.6)';
    ctx.shadowBlur = 10;
    tracePath(ctx);
    ctx.stroke();
    ctx.restore();

    // layer 4: the traveling lightning trail (head bright → tail fading)
    drawTrail(c, proximity);

    // layer 5: cursor glow orb
    if (mouse.has && !isMobile) {
      var r = 46 + 26 * proximity + 6 * pulse;
      var grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, r);
      grad.addColorStop(0, 'rgba(147,197,253,0.30)');
      grad.addColorStop(0.55, 'rgba(56,189,248,0.12)');
      grad.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // layer 6: electric particles along the border
    spawnParticles(dt, c);
    drawParticles(c);

    raf = window.requestAnimationFrame(draw);
  }

  function tracePath(c) {
    c.beginPath();
    var pts = PATH.pts;
    c.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.closePath();
  }

  function drawTrail(c, proximity) {
    var steps = Math.floor(TRAIL_LEN / 8);
    // tail → head so the head draws on top
    for (var i = steps; i >= 0; i--) {
      var f = i / steps;                 // 0 head … 1 tail
      var p = pointAt(head - f * TRAIL_LEN);
      var alpha = (1 - f) * (1 - f * 0.35);
      var w = 5.2 * (1 - f) + 0.6;
      var extra = proximity * 3 * (1 - f);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (f < 0.25) ctx.strokeStyle = c.core; else ctx.strokeStyle = f < 0.6 ? c.stroke : c.glow1;
      ctx.lineWidth = w + extra;
      ctx.shadowColor = 'rgba(56,189,248,0.85)';
      ctx.shadowBlur = 14 + 16 * (1 - f) + 10 * proximity;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      var q = pointAt(head - (f - 1 / steps) * TRAIL_LEN);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function spawnParticles(dt, c) {
    if (particles.length < MAX_PARTICLES && Math.random() < dt * 6) {
      var p = pointAt(head - Math.random() * TRAIL_LEN);
      particles.push({
        x: p.x, y: p.y,
        vx: (Math.random() - 0.5) * 26,
        vy: (Math.random() - 0.5) * 26,
        life: 1, decay: 0.35 + Math.random() * 0.4,
        size: 1 + Math.random() * 2.2,
        color: c.particle
      });
    }
  }
  function drawParticles(c) {
    particles = particles.filter(function (p) { return p.life > 0; });
    particles.forEach(function (p) {
      p.x += p.vx * 0.016; p.y += p.vy * 0.016; p.life -= p.decay * 0.016;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life) * 0.9;
      ctx.fillStyle = p.color;
      ctx.shadowColor = 'rgba(56,189,248,0.9)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /* --- Reduced motion: draw one static glowing frame, no loop --- */
  function staticFrame() {
    if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    var c = palette();
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.strokeStyle = c.glow1;
    ctx.lineWidth = 10;
    ctx.shadowColor = 'rgba(56,189,248,0.5)';
    ctx.shadowBlur = 18;
    tracePath(ctx); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = 2.4;
    tracePath(ctx); ctx.stroke();
    ctx.restore();
  }

  function start() {
    resize();
    if (reduceMotion.matches) { staticFrame(); return; }
    if (!raf) { last = performance.now(); raf = window.requestAnimationFrame(draw); }
  }
  function stop() { if (raf) { window.cancelAnimationFrame(raf); raf = null; } }

  // pause when tab hidden → no wasted CPU/GPU
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', function () {
      if (reduceMotion.matches) staticFrame(); else start();
    });
  }

  start();
})();

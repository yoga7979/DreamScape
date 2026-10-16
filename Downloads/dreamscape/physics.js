(() => {
  const canvas = document.getElementById('physicsCanvas');
  const ctx = canvas.getContext('2d');
  const layer = document.getElementById('physicsLayer');
  const readout = document.getElementById('gravityReadout');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const palette = ['#f6efd9', '#8580a7', '#b88791', '#7997ac', '#dfc879', '#d3484f'];
  const world = { width: 0, height: 0, bodies: [], gravity: { x: 0, y: .55 }, pointer: { x: 0, y: 0 }, dragging: null, raf: 0, last: 0, active: false, settleTimer: 0, keyFound: false };
  let callbacks = {};

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    world.width = window.innerWidth; world.height = window.innerHeight;
    canvas.width = Math.floor(world.width * dpr); canvas.height = Math.floor(world.height * dpr);
    canvas.style.width = `${world.width}px`; canvas.style.height = `${world.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function body(data) { return { ...data, vx: data.vx ?? (Math.random() - .5) * 3, vy: data.vy ?? -Math.random() * 4, vr: data.vr ?? (Math.random() - .5) * .08, rot: data.rot ?? (Math.random() - .5), grabbed: false }; }
  function seed() {
    const text = 'DREAMSCAPE'.split('').map((char, i) => body({ type: 'letter', text: char, x: world.width * (.15 + (i % 5) * .17), y: world.height * (.17 + Math.floor(i / 5) * .13), w: 58, h: 72, color: palette[i % palette.length], mass: 1.2 }));
    const fragments = [
      body({ type: 'door', text: '◌', x: world.width * .14, y: world.height * .56, w: 110, h: 180, color: '#303354', mass: 3 }),
      body({ type: 'photo', text: 'NOT THIS ROOM', x: world.width * .76, y: world.height * .26, w: 112, h: 132, color: '#cdbfc3', mass: 1.5 }),
      body({ type: 'clock', text: '13', x: world.width * .31, y: world.height * .68, w: 82, h: 82, color: '#dbd3bf', mass: 1.5 }),
      body({ type: 'chair', text: '', x: world.width * .56, y: world.height * .65, w: 95, h: 105, color: '#9b6f74', mass: 2.1 }),
      body({ type: 'symbol', text: '☾', x: world.width * .68, y: world.height * .46, w: 54, h: 54, color: '#f6efd9', mass: .8 }),
      body({ type: 'symbol', text: '👁', x: world.width * .86, y: world.height * .62, w: 54, h: 54, color: '#d3484f', mass: .8 }),
      body({ type: 'key', text: '🔑', x: world.width * .49, y: world.height * .26, w: 54, h: 54, color: '#dfc879', mass: .55, isKey: true }),
      body({ type: 'fragment', text: 'THE ROOM', x: world.width * .23, y: world.height * .35, w: 150, h: 30, color: '#7997ac', mass: .8 }),
      body({ type: 'fragment', text: 'YOU WERE HERE', x: world.width * .72, y: world.height * .78, w: 170, h: 30, color: '#b88791', mass: .8 })
    ];
    world.bodies = [...text, ...fragments];
    world.keyFound = false;
  }
  function setGravity(dx, dy) {
    const magnitude = Math.hypot(dx, dy) || 1;
    const nx = Math.max(-1, Math.min(1, dx / magnitude));
    const ny = Math.max(-1, Math.min(1, dy / magnitude));
    world.gravity.x = nx * .72; world.gravity.y = ny * .72;
    if (Math.abs(dx) > Math.abs(dy)) readout.textContent = dx > 0 ? 'RIGHT' : 'LEFT';
    else readout.textContent = dy > 0 ? 'DOWN' : 'UP';
  }
  function bounds(item) { return { left: item.x - item.w / 2, right: item.x + item.w / 2, top: item.y - item.h / 2, bottom: item.y + item.h / 2 }; }
  function hit(item, x, y) { const b = bounds(item); return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; }
  function update(dt) {
    const drag = prefersReduced.matches ? .97 : .992;
    world.bodies.forEach((item) => {
      if (item.grabbed) return;
      item.vx += world.gravity.x * dt * 5;
      item.vy += world.gravity.y * dt * 5;
      item.vx *= drag; item.vy *= drag; item.vr *= .999;
      item.x += item.vx * dt * 60; item.y += item.vy * dt * 60; item.rot += item.vr * dt * 60;
      const b = bounds(item);
      if (b.left < 0) { item.x = item.w / 2; item.vx = Math.abs(item.vx) * .72; }
      if (b.right > world.width) { item.x = world.width - item.w / 2; item.vx = -Math.abs(item.vx) * .72; }
      if (b.top < 0) { item.y = item.h / 2; item.vy = Math.abs(item.vy) * .72; }
      if (b.bottom > world.height) { item.y = world.height - item.h / 2; item.vy = -Math.abs(item.vy) * .72; }
    });
    for (let a = 0; a < world.bodies.length; a += 1) {
      for (let b = a + 1; b < world.bodies.length; b += 1) {
        const one = world.bodies[a]; const two = world.bodies[b];
        const dx = two.x - one.x; const dy = two.y - one.y; const min = (Math.min(one.w, one.h) + Math.min(two.w, two.h)) * .24; const dist = Math.hypot(dx, dy) || .001;
        if (dist < min) { const nx = dx / dist; const ny = dy / dist; const impulse = .12; one.vx -= nx * impulse; one.vy -= ny * impulse; two.vx += nx * impulse; two.vy += ny * impulse; const push = (min - dist) * .2; one.x -= nx * push; one.y -= ny * push; two.x += nx * push; two.y += ny * push; }
      }
    }
  }
  function draw(time) {
    if (!world.active) return;
    const dt = Math.min(0.032, (time - world.last || 16) / 1000); world.last = time;
    ctx.clearRect(0, 0, world.width, world.height);
    ctx.fillStyle = 'rgba(8, 10, 22, .82)'; ctx.fillRect(0, 0, world.width, world.height);
    ctx.strokeStyle = 'rgba(246,239,217,.06)'; ctx.lineWidth = 1;
    for (let y = 0; y < world.height; y += 38) { ctx.beginPath(); ctx.moveTo(0, y + (time * .01 % 38)); ctx.lineTo(world.width, y + (time * .01 % 38)); ctx.stroke(); }
    update(dt);
    world.bodies.forEach((item) => {
      ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(item.rot); ctx.globalAlpha = item.grabbed ? 1 : .9;
      if (item.type === 'letter' || item.type === 'fragment') { ctx.fillStyle = item.color; ctx.font = item.type === 'letter' ? '600 64px Space Grotesk' : '11px DM Mono'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(item.text, 0, 0); }
      else if (item.type === 'door') { ctx.fillStyle = item.color; ctx.fillRect(-item.w / 2, -item.h / 2, item.w, item.h); ctx.strokeStyle = '#8580a7'; ctx.strokeRect(-item.w / 2, -item.h / 2, item.w, item.h); ctx.fillStyle = '#dfc879'; ctx.font = '26px DM Mono'; ctx.fillText(item.text, item.w * .23, 0); }
      else if (item.type === 'photo') { ctx.fillStyle = '#ddd3b7'; ctx.fillRect(-item.w / 2, -item.h / 2, item.w, item.h); ctx.fillStyle = '#54657b'; ctx.fillRect(-item.w * .34, -item.h * .28, item.w * .68, item.h * .45); ctx.fillStyle = '#111326'; ctx.beginPath(); ctx.arc(0, -2, 18, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#111326'; ctx.fillRect(-15, 13, 30, 30); ctx.fillStyle = '#111326'; ctx.font = '8px DM Mono'; ctx.fillText(item.text, 0, item.h * .39); }
      else if (item.type === 'clock') { ctx.fillStyle = item.color; ctx.beginPath(); ctx.arc(0, 0, item.w / 2, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#303354'; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#303354'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -22); ctx.moveTo(0, 0); ctx.lineTo(24, 8); ctx.stroke(); }
      else if (item.type === 'chair') { ctx.strokeStyle = item.color; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-28, -45); ctx.lineTo(28, -45); ctx.lineTo(28, 4); ctx.moveTo(-35, 0); ctx.lineTo(35, 0); ctx.moveTo(0, 3); ctx.lineTo(0, 48); ctx.moveTo(-24, 48); ctx.lineTo(24, 48); ctx.stroke(); }
      else { ctx.font = item.isKey ? '34px serif' : '31px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (item.isKey || world.keyFound) { ctx.shadowColor = '#dfc879'; ctx.shadowBlur = item.isKey ? 22 : 0; } ctx.fillStyle = item.color; ctx.fillText(item.text, 0, 0); }
      ctx.restore();
    });
    world.raf = requestAnimationFrame(draw);
  }
  function pointerPosition(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
  function pointerDown(event) { if (!world.active) return; const p = pointerPosition(event); world.pointer = p; const item = [...world.bodies].reverse().find((candidate) => hit(candidate, p.x, p.y)); if (item) { if (item.isKey && !world.keyFound) { world.keyFound = true; item.vx = 0; item.vy = 0; callbacks.onKeyFound?.(); } item.grabbed = true; world.dragging = item; canvas.setPointerCapture?.(event.pointerId); } }
  function pointerMove(event) { if (!world.active) return; const p = pointerPosition(event); const dx = p.x - world.pointer.x; const dy = p.y - world.pointer.y; world.pointer = p; if (Math.abs(dx) + Math.abs(dy) > 1) setGravity(dx, dy); if (world.dragging) { world.dragging.vx = dx * .25; world.dragging.vy = dy * .25; world.dragging.x = p.x; world.dragging.y = p.y; } }
  function pointerUp() { if (world.dragging) world.dragging.grabbed = false; world.dragging = null; }
  function start(options = {}) { callbacks = options; resize(); seed(); world.active = true; layer.classList.add('is-active'); layer.setAttribute('aria-hidden', 'false'); cancelAnimationFrame(world.raf); world.last = 0; world.raf = requestAnimationFrame(draw); }
  function stop() { world.active = false; layer.classList.remove('is-active'); layer.setAttribute('aria-hidden', 'true'); cancelAnimationFrame(world.raf); }
  window.addEventListener('resize', resize, { passive: true });
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove); canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', pointerUp);
  window.DreamPhysics = { start, stop, setGravity, slow() { world.bodies.forEach((item) => { item.vx *= .08; item.vy *= .08; item.vr *= .08; }); world.gravity.x = 0; world.gravity.y = .03; readout.textContent = 'REST'; } };
})();

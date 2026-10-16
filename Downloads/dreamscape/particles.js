(() => {
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const pointer = { x: 0.5, y: 0.5 };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let raf = 0;
  let last = 0;
  let hidden = document.hidden;

  const palette = {
    room: ['rgba(246,239,217,', 'rgba(211,72,79,', 'rgba(133,128,167,'],
    ocean: ['rgba(214,228,223,', 'rgba(121,151,172,', 'rgba(246,239,217,'],
    hallway: ['rgba(223,200,121,', 'rgba(246,239,217,', 'rgba(184,135,145,'],
    void: ['rgba(246,239,217,', 'rgba(133,128,167,', 'rgba(211,72,79,'],
    secret: ['rgba(223,200,121,', 'rgba(211,72,79,', 'rgba(133,128,167,']
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const count = reducedMotion.matches ? 32 : (mobileQuery.matches ? 58 : 108);
    particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * (mobileQuery.matches ? 1.5 : 2.25) + .25,
      speed: Math.random() * .22 + .05,
      drift: (Math.random() - .5) * .14,
      phase: Math.random() * Math.PI * 2,
      alpha: Math.random() * .34 + .08,
      type: index % 9 === 0 ? 'ring' : 'dust',
      color: index % 3
    }));
  }

  function draw(time) {
    if (hidden) return;
    const dt = Math.min(32, time - last || 16) / 16;
    last = time;
    const scene = document.body.dataset.scene || 'room';
    const colors = palette[scene] || palette.room;
    ctx.clearRect(0, 0, width, height);
    const physicsSlow = document.body.classList.contains('physics-mode') ? .24 : 1;
    const wind = (pointer.x - .5) * .22 * physicsSlow;
    const lift = (scene === 'ocean' ? -.45 : (scene === 'hallway' ? -.12 : -.23)) * physicsSlow;

    particles.forEach((p) => {
      p.y += (p.speed + lift * .1) * dt * physicsSlow;
      p.x += (p.drift + wind) * dt * physicsSlow + Math.sin(time * .0005 + p.phase) * .12 * physicsSlow;
      if (scene === 'ocean') p.y -= .12 * dt;
      if (p.y < -12) p.y = height + 12;
      if (p.y > height + 12) p.y = -12;
      if (p.x < -12) p.x = width + 12;
      if (p.x > width + 12) p.x = -12;

      const alpha = Math.max(.03, p.alpha + Math.sin(time * .001 + p.phase) * .06);
      ctx.beginPath();
      if (p.type === 'ring') {
        ctx.strokeStyle = `${colors[p.color]}${alpha})`;
        ctx.lineWidth = .7;
        ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = `${colors[p.color]}${alpha})`;
        ctx.arc(p.x + (pointer.x - .5) * p.r * 2, p.y + (pointer.y - .5) * p.r * 2, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    raf = requestAnimationFrame(draw);
  }

  function setPointer(x, y) { pointer.x = x; pointer.y = y; }
  function start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
  function onVisibility() { hidden = document.hidden; if (!hidden) { last = 0; start(); } else cancelAnimationFrame(raf); }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pointermove', (event) => setPointer(event.clientX / width, event.clientY / height), { passive: true });
  resize();
  start();
  window.DreamParticles = { setPointer, redraw: seed };
})();

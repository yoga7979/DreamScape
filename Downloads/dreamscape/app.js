(() => {
  const scenes = ['room', 'ocean', 'hallway', 'void'];
  const sceneNames = { room: 'THE ROOM', ocean: 'THE OCEAN', hallway: 'THE HALLWAY', void: 'THE VOID' };
  const sceneNumbers = { room: 'DREAM 01 / 04', ocean: 'DREAM 02 / 04', hallway: 'DREAM 03 / 04', void: 'DREAM 04 / 04' };
  const sceneGlyphs = { room: '◌', ocean: '≈', hallway: '▥', void: '·' };
  const channels = ['STATIC', 'OCEAN', 'HALLWAY', 'MOON', 'FOREST', 'STRANGE ROOM'];
  const symbolLabels = { moon: 'the moon remembers you', eye: 'the eye has seen this before', key: 'the key was waiting in the debris' };
  const storageKey = 'dreamscape-track-alpha-v3';
  const stored = readStorage();
  const state = {
    scene: scenes.includes(stored.scene) ? stored.scene : 'room',
    phase: stored.phase || 'ROOM',
    entered: Boolean(stored.entered),
    soundOn: Boolean(stored.soundOn),
    volume: Number.isFinite(stored.volume) ? stored.volume : .36,
    discoveries: new Set(Array.isArray(stored.discoveries) ? stored.discoveries : []),
    ending: Boolean(stored.ending),
    voidReady: Boolean(stored.voidReady),
    chaosUnlocked: Boolean(stored.chaosUnlocked),
    chaosSelection: Array.isArray(stored.chaosSelection) ? stored.chaosSelection.slice(0, 3).map((value) => Number(value) || 0) : [0, 0, 0],
    chaosTarget: Array.isArray(stored.chaosTarget) ? stored.chaosTarget.slice(0, 3).map((value) => Number(value) || 0) : (stored.chaosUnlocked && Array.isArray(stored.chaosSelection) ? stored.chaosSelection.slice(0, 3).map((value) => Number(value) || 0) : null),
    tvIndex: 0,
    timeSkew: 1,
    journalOpen: false,
    collapsing: false,
    instability: 0,
    velocity: 0
  };

  const chaosPalettes = [
    ['#d3484f', '#dfc879', '#7997ac'],
    ['#8580a7', '#b88791', '#8bd3a8'],
    ['#f6efd9', '#53657b', '#d3484f']
  ];
  const body = document.body;
  const root = document.documentElement;
  const scenesEls = [...document.querySelectorAll('.scene')];
  const sceneCounter = document.getElementById('sceneCounter');
  const statusText = document.getElementById('statusText');
  const landingCopy = document.getElementById('landingCopy');
  const landingSubtitle = document.getElementById('landingSubtitle');
  const loopKey = document.getElementById('loopKey');
  const whisper = document.getElementById('whisper');
  const whisperText = document.getElementById('whisperText');
  const transitionGlyph = document.getElementById('transitionGlyph');
  const soundToggle = document.getElementById('soundToggle');
  const soundLabel = document.getElementById('soundLabel');
  const volumeControl = document.getElementById('volumeControl');
  const journal = document.getElementById('dreamJournal');
  const journalScene = document.getElementById('journalScene');
  const journalSecret = document.getElementById('journalSecret');
  const velocityWarning = document.getElementById('velocityWarning');
  const velocityMessage = document.getElementById('velocityMessage');
  const instabilityValue = document.getElementById('instabilityValue');
  const endingOverlay = document.getElementById('endingOverlay');
  const chaosCardLayer = document.getElementById('chaosCardLayer');
  const chaosCardStatus = document.getElementById('chaosCardStatus');
  const chaosCardCode = document.getElementById('chaosCardCode');
  const reactiveCanvas = document.getElementById('reactiveCanvas');
  const reactiveCtx = reactiveCanvas?.getContext('2d');
  const cursorHalo = document.querySelector('.cursor-halo');
  const cursorCore = document.querySelector('.cursor-core');
  const cursorLabel = document.querySelector('.cursor-label');
  let whisperTimer = 0;
  let transitionTimer = 0;
  let endingTimer = 0;
  let pointerX = -100;
  let pointerY = -100;
  let lastPointer = null;
  let instabilityFrame = 0;
  const chaosTarget = state.chaosTarget || deriveChaosTarget();
  state.chaosTarget = chaosTarget;

  function deriveChaosTarget() {
    const seed = `DREAMSCAPE|${state.phase}|${[...state.discoveries].sort().join('|')}`;
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i += 1) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
    return [Math.abs(hash) % 3, Math.abs(hash >>> 5) % 3, Math.abs(hash >>> 11) % 3];
  }

  function readStorage() {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  }
  function persist() {
    localStorage.setItem(storageKey, JSON.stringify({
      scene: state.scene,
      phase: state.phase,
      entered: state.entered,
      soundOn: state.soundOn,
      volume: state.volume,
      discoveries: [...state.discoveries],
      ending: state.ending,
      voidReady: state.voidReady,
      chaosUnlocked: state.chaosUnlocked,
      chaosSelection: state.chaosSelection,
      chaosTarget: state.chaosTarget
    }));
  }
  function showWhisper(message, duration = 2800) {
    clearTimeout(whisperTimer);
    whisperText.textContent = message;
    whisper.classList.add('is-visible');
    whisperTimer = window.setTimeout(() => whisper.classList.remove('is-visible'), duration);
  }
  function setCursorLabel(label) { cursorLabel.textContent = label || 'LOOK'; }
  function updateChaosUI() {
    const matches = state.chaosSelection.reduce((total, value, index) => total + (value === chaosTarget[index] ? 1 : 0), 0);
    document.querySelectorAll('.chaos-target').forEach((target, index) => target.setAttribute('fill', chaosPalettes[index][chaosTarget[index]]));
    document.querySelectorAll('.chaos-lock').forEach((lock, index) => {
      lock.setAttribute('fill', chaosPalettes[index][state.chaosSelection[index]]);
      lock.classList.toggle('is-match', state.chaosSelection[index] === chaosTarget[index]);
    });
    if (chaosCardStatus) chaosCardStatus.textContent = state.chaosUnlocked ? 'MATCH 3 / 3 — UNLOCKED' : `MATCH ${matches} / 3`;
    if (chaosCardCode) chaosCardCode.textContent = state.chaosUnlocked ? 'HASH // ACCEPTED // EXIT PATH OPEN' : `HASH // ${Math.abs(chaosTarget[0] * 31 + chaosTarget[1] * 17 + chaosTarget[2] * 7).toString(16).toUpperCase()} // ENCRYPTED`;
    body.classList.toggle('chaos-unlocked', state.chaosUnlocked);
  }
  function openChaosCard() { chaosCardLayer?.classList.add('is-open'); chaosCardLayer?.setAttribute('aria-hidden', 'false'); updateChaosUI(); chaosCardLayer?.querySelector('.chaos-close-button')?.focus(); }
  function closeChaosCard() { chaosCardLayer?.classList.remove('is-open'); chaosCardLayer?.setAttribute('aria-hidden', 'true'); }
  function cycleChaosColor(index) {
    if (state.chaosUnlocked) return showWhisper('The card is already aligned. The exit is awake.');
    state.chaosSelection[index] = (state.chaosSelection[index] + 1) % chaosPalettes[index].length; persist(); updateChaosUI(); audio.tone(180 + index * 90 + state.chaosSelection[index] * 40, .12, .07, 'triangle');
    const matches = state.chaosSelection.reduce((total, value, slot) => total + (value === chaosTarget[slot] ? 1 : 0), 0);
    if (matches === 3) { state.chaosUnlocked = true; state.phase = 'CHAOS_UNLOCKED'; persist(); updateChaosUI(); audio.tone(720, .4, .13, 'triangle'); showWhisper('The colors agree. One door is an exit.', 3200); }
  }

  class AmbientAudio {
    constructor() { this.ctx = null; this.master = null; this.drone = null; this.filter = null; this.analyser = null; this.frequencyData = null; this.reactiveFrame = 0; this.bubbleTimer = null; this.tickTimer = null; }
    async ensure() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain(); this.master.gain.value = 0; this.master.connect(this.ctx.destination);
        this.filter = this.ctx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 780;
        this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 128; this.analyser.smoothingTimeConstant = .82; this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        this.filter.connect(this.analyser).connect(this.master);
        this.drone = this.ctx.createOscillator(); this.drone.type = 'sine'; this.drone.frequency.value = 82;
        this.droneGain = this.ctx.createGain(); this.droneGain.gain.value = .035; this.drone.connect(this.droneGain).connect(this.filter); this.drone.start();
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.startReactive();
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(state.soundOn ? state.volume : 0, this.ctx.currentTime + .45);
    }
    startReactive() {
      if (this.reactiveFrame || !this.analyser || !reactiveCtx) return;
      const render = () => {
        this.reactiveFrame = requestAnimationFrame(render);
        if (document.hidden) return;
        const width = window.innerWidth; const height = window.innerHeight; const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (reactiveCanvas.width !== Math.floor(width * dpr) || reactiveCanvas.height !== Math.floor(height * dpr)) { reactiveCanvas.width = Math.floor(width * dpr); reactiveCanvas.height = Math.floor(height * dpr); reactiveCtx.setTransform(dpr, 0, 0, dpr, 0, 0); }
        this.analyser.getByteFrequencyData(this.frequencyData);
        const bins = this.frequencyData; let energy = 0; let bass = 0; let treble = 0;
        bins.forEach((value, index) => { energy += value; if (index < bins.length * .22) bass += value; if (index > bins.length * .62) treble += value; });
        energy /= bins.length * 255; bass /= Math.max(1, Math.floor(bins.length * .22)) * 255; treble /= Math.max(1, Math.ceil(bins.length * .38)) * 255;
        root.style.setProperty('--audio-energy', energy.toFixed(3)); root.style.setProperty('--audio-bass', bass.toFixed(3)); root.style.setProperty('--audio-treble', treble.toFixed(3));
        reactiveCtx.clearRect(0, 0, width, height); reactiveCtx.save(); reactiveCtx.globalCompositeOperation = 'screen';
        const sceneHue = { room: '#dfc879', ocean: '#7997ac', hallway: '#b88791', void: '#8580a7' }[state.scene] || '#f6efd9';
        const drift = Number(getComputedStyle(root).getPropertyValue('--px')) || 0; const centerX = width * (.5 + drift * .04); const centerY = height * .52; const radius = Math.min(width, height) * (.22 + bass * .12);
        reactiveCtx.strokeStyle = sceneHue; reactiveCtx.globalAlpha = .06 + energy * .25; reactiveCtx.lineWidth = 1 + energy * 3; reactiveCtx.beginPath();
        for (let i = 0; i <= 96; i += 1) { const angle = (i / 96) * Math.PI * 2; const bin = bins[i % bins.length] / 255; const pulse = radius + bin * (26 + bass * 45) + Math.sin(performance.now() * .0015 + i * .3) * (2 + treble * 7); const x = centerX + Math.cos(angle) * pulse; const y = centerY + Math.sin(angle) * pulse * .56; if (i === 0) reactiveCtx.moveTo(x, y); else reactiveCtx.lineTo(x, y); }
        reactiveCtx.closePath(); reactiveCtx.stroke(); reactiveCtx.fillStyle = sceneHue; reactiveCtx.globalAlpha = .025 + bass * .08; reactiveCtx.beginPath(); reactiveCtx.arc(centerX, centerY, radius * (.42 + bass * .2), 0, Math.PI * 2); reactiveCtx.fill(); reactiveCtx.restore();
      };
      render();
    }
    setScene(scene) {
      if (!this.ctx) return;
      const frequencies = { room: 92, ocean: 57, hallway: 44, void: 68 };
      const filters = { room: 680, ocean: 420, hallway: 260, void: 150 };
      const now = this.ctx.currentTime;
      this.drone.frequency.cancelScheduledValues(now); this.drone.frequency.linearRampToValueAtTime(frequencies[scene] || 80, now + .7);
      this.filter.frequency.linearRampToValueAtTime(filters[scene] || 500, now + .7);
      window.clearTimeout(this.bubbleTimer); window.clearTimeout(this.tickTimer);
      if (scene === 'ocean') this.scheduleBubbles();
      if (scene === 'room') this.scheduleTicks();
    }
    scheduleBubbles() {
      this.bubbleTimer = window.setTimeout(() => { if (state.soundOn) this.tone(390, .07, .11); this.scheduleBubbles(); }, 3600);
    }
    scheduleTicks() {
      this.tickTimer = window.setTimeout(() => { if (state.soundOn) this.tone(state.timeSkew === -1 ? 260 : 330, .055, .055, 'square'); if (state.scene === 'room') this.scheduleTicks(); }, state.timeSkew === 0 ? 5200 : 3100);
    }
    tone(frequency, duration = .12, gainValue = .12, type = 'sine') {
      if (!this.ctx || !state.soundOn) return;
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.type = type; osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(gainValue, this.ctx.currentTime + .015); gain.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + duration);
      osc.connect(gain).connect(this.filter); osc.start(); osc.stop(this.ctx.currentTime + duration + .03);
    }
    fadeTo(value, duration = .8) { if (this.master && this.ctx) this.master.gain.linearRampToValueAtTime(value, this.ctx.currentTime + duration); }
    setVolume(value) { state.volume = Number(value); persist(); if (this.master && this.ctx) this.master.gain.linearRampToValueAtTime(state.soundOn ? state.volume : 0, this.ctx.currentTime + .2); }
    async toggle() { state.soundOn = !state.soundOn; persist(); await this.ensure(); this.master.gain.linearRampToValueAtTime(state.soundOn ? state.volume : 0, this.ctx.currentTime + .25); updateSoundUI(); showWhisper(state.soundOn ? 'The room has begun to listen.' : 'The dream is holding its breath.'); }
  }
  const audio = new AmbientAudio();

  function updateSoundUI() {
    body.classList.toggle('audio-off', !state.soundOn); soundToggle.setAttribute('aria-pressed', String(state.soundOn)); soundLabel.textContent = state.soundOn ? 'SOUND ON' : 'SOUND OFF'; volumeControl.value = String(state.volume);
  }
  function updateDiscoveryUI() {
    journalSecret.textContent = state.discoveries.has('key') ? 'the key opened inward' : `${state.discoveries.size} / 2 signals recorded`;
    document.querySelectorAll('[data-symbol]').forEach((el) => el.classList.toggle('is-found', state.discoveries.has(el.dataset.symbol)));
  }
  function renderScene(scene, { immediate = false } = {}) {
    if (!scenes.includes(scene)) return;
    state.scene = scene; body.dataset.scene = scene; sceneCounter.textContent = sceneNumbers[scene]; journalScene.textContent = sceneNames[scene];
    if (scene !== 'hallway') clearVelocityWarning();
    scenesEls.forEach((el) => el.classList.toggle('is-active', el.dataset.scene === scene));
    document.querySelectorAll('.journey-dot').forEach((dot) => dot.classList.toggle('is-active', dot.dataset.sceneTarget === scene));
    transitionGlyph.textContent = sceneGlyphs[scene] || '◌'; statusText.textContent = scene === 'void' ? 'SIGNAL THIN' : 'SIGNAL FOUND'; root.style.setProperty('--time-skew', state.timeSkew); updateDiscoveryUI(); updateChaosUI(); persist();
    if (state.soundOn) audio.setScene(scene);
    if (!immediate) showWhisper(`${sceneNumbers[scene]} — ${sceneNames[scene]}`, 1800);
  }
  function travelTo(scene, transition = 'portal') {
    if (!scenes.includes(scene) || state.collapsing) return;
    clearTimeout(transitionTimer); body.classList.add('transitioning'); body.dataset.transition = transition; body.classList.toggle('door-opening', transition === 'door'); transitionGlyph.textContent = sceneGlyphs[scene];
    transitionTimer = window.setTimeout(() => { renderScene(scene); body.classList.remove('transitioning', 'door-opening'); delete body.dataset.transition; }, transition === 'door' ? 700 : 450);
  }
  function clearVelocityWarning() { state.instability = 0; state.velocity = 0; lastPointer = null; velocityWarning.classList.remove('is-visible'); velocityWarning.setAttribute('aria-hidden', 'true'); body.classList.remove('velocity-shake'); root.style.setProperty('--velocity', '0'); }
  function triggerGlitch() { body.classList.remove('glitching'); void body.offsetWidth; body.classList.add('glitching'); window.setTimeout(() => body.classList.remove('glitching'), 700); }

  function unlockSymbol(symbol) {
    if (state.discoveries.has(symbol)) return showWhisper(symbolLabels[symbol] || 'you have seen this before');
    state.discoveries.add(symbol);
    if (symbol === 'moon') state.phase = 'MOON_FOUND';
    if (symbol === 'eye') state.phase = 'EYE_FOUND';
    if (symbol === 'key') state.phase = 'KEY_FOUND';
    persist(); updateDiscoveryUI(); audio.tone(220 + state.discoveries.size * 90, .28, .16, 'triangle'); showWhisper(`${symbolLabels[symbol]} · ${symbol === 'key' ? 'the next doorway is breathing' : 'signal recorded'}`, 3200);
  }
  function nextScene() {
    if (state.scene === 'room') {
      if (!state.discoveries.has('moon')) return showWhisper('The lock is moon-shaped. Look closer.');
      state.phase = 'OCEAN'; persist(); return travelTo('ocean', 'door');
    }
    if (state.scene === 'ocean') {
      if (!state.discoveries.has('eye')) return showWhisper('Something is watching from the other side.');
      state.phase = 'HALLWAY'; persist(); return travelTo('hallway', 'water');
    }
    if (state.scene === 'hallway') return showWhisper('There is no door out. Move faster.', 2400);
    if (state.scene === 'void') return finalDoor();
  }
  function telephone() { audio.tone(245, .14, .18, 'square'); window.setTimeout(() => audio.tone(195, .18, .14, 'square'), 180); showWhisper('You are still dreaming.', 3400); triggerGlitch(); }
  function clock() { state.timeSkew = state.timeSkew === 1 ? -1 : state.timeSkew === -1 ? 0 : 1; root.style.setProperty('--time-skew', state.timeSkew); audio.tone(state.timeSkew === 0 ? 130 : 180, .2, .12); showWhisper(state.timeSkew === -1 ? 'Time is walking backwards.' : state.timeSkew === 0 ? 'The clock has forgotten what comes next.' : 'Time is pretending to behave.'); triggerGlitch(); }
  function mirror() { body.classList.add('inverted'); showWhisper('The mirror is showing the door that has not opened yet.', 2800); audio.tone(520, .35, .07); window.setTimeout(() => body.classList.remove('inverted'), 2500); }
  function television() { state.tvIndex = (state.tvIndex + 1) % channels.length; document.getElementById('tvChannel').textContent = channels[state.tvIndex]; const copy = { STATIC: 'The television is waiting for a question.', OCEAN: 'Something is swimming behind the glass.', HALLWAY: 'There is a hallway inside the static.', MOON: 'The moon is closer on this channel.', FOREST: 'Do not follow the sound of leaves.', 'STRANGE ROOM': 'This room is not the one you entered.' }; showWhisper(copy[channels[state.tvIndex]], 2800); audio.tone(110 + state.tvIndex * 33, .15, .08, 'square'); }
  function photograph() {
    if (state.scene === 'room') return showWhisper('The photograph contains a door that is not here.');
    if (state.scene === 'ocean') return showWhisper('The photograph is dry. It should not be.');
    if (state.scene === 'void') {
      if (state.voidReady) return showWhisper('You built this place.');
      state.voidReady = true; persist(); showWhisper('This is where you woke up.', 1700);
      window.setTimeout(() => showWhisper("You weren't trapped here.", 1900), 2100);
      window.setTimeout(() => showWhisper('You built this place.', 3000), 4500);
    }
  }
  function hallwayDoor(target) { const lines = ['Not this way.', 'The exit is not here.', "You've been here before."]; showWhisper(lines[Math.min(2, [...document.querySelectorAll('.hall-door')].indexOf(target))] || 'Closer.'); if (target.classList.contains('hall-door-c')) { state.phase = 'COLLAPSE'; persist(); showWhisper('Move quickly if you want to leave.', 2600); } }
  function escapeDoor() { if (!state.chaosUnlocked) { showWhisper('The exit is color-locked. Make the card agree.', 2800); openChaosCard(); return; } state.phase = 'ESCAPE'; persist(); closeChaosCard(); travelTo('void', 'door'); showWhisper('You found the exit.', 2400); }
  function chair() { showWhisper(state.scene === 'void' ? 'The chair is warm.' : 'Something was sitting here a moment ago.'); }
  function balloon() { showWhisper("Don't touch that."); triggerGlitch(); }
  function fish() { showWhisper('The fish has forgotten the shape of water.'); }

  function updateVelocity(event) {
    if (!lastPointer) { lastPointer = { x: event.clientX, y: event.clientY, time: performance.now() }; return; }
    const now = performance.now(); const dt = Math.max(8, now - lastPointer.time); const dx = event.clientX - lastPointer.x; const dy = event.clientY - lastPointer.y; const speed = Math.hypot(dx, dy) / dt * 1000;
    lastPointer = { x: event.clientX, y: event.clientY, time: now }; state.velocity = state.velocity * .72 + speed * .28;
    const active = state.scene === 'hallway' && state.entered && !state.collapsing;
    if (!active) return;
    const gain = Math.max(0, (speed - 620) / 205); state.instability = Math.min(100, state.instability + Math.min(7, gain));
    root.style.setProperty('--velocity', Math.min(1, state.velocity / 1800).toFixed(3)); body.classList.toggle('velocity-shake', state.velocity > 650);
    if (state.velocity > 700 || state.instability > 6) {
      velocityWarning.classList.add('is-visible'); velocityWarning.setAttribute('aria-hidden', 'false'); velocityMessage.textContent = state.velocity > 1500 ? 'STOP.' : 'SOMETHING IS WRONG.'; instabilityValue.textContent = `${Math.round(state.instability)}%`;
    }
    if (state.velocity > 1900 || state.instability >= 100) collapseDream();
  }
  function instabilityLoop() {
    if (!state.collapsing) {
      state.instability = Math.max(0, state.instability - (state.velocity > 400 ? .025 : .14)); state.velocity *= .96;
      if (state.instability < 4) { velocityWarning.classList.remove('is-visible'); velocityWarning.setAttribute('aria-hidden', 'true'); body.classList.remove('velocity-shake'); }
      instabilityValue.textContent = `${Math.round(state.instability)}%`;
    }
    instabilityFrame = requestAnimationFrame(instabilityLoop);
  }
  function collapseDream() {
    if (state.collapsing) return;
    state.collapsing = true; state.phase = 'COLLAPSE'; state.instability = 100; persist(); velocityMessage.textContent = 'STOP.'; instabilityValue.textContent = '100%'; velocityWarning.classList.add('is-visible'); body.classList.add('collapsing'); audio.tone(52, .55, .2, 'sawtooth'); audio.fadeTo(0, 1.1); showWhisper('DREAM INSTABILITY: 100%', 3000);
    window.setTimeout(() => { body.classList.remove('collapsing'); body.classList.add('physics-mode'); window.DreamPhysics?.start({ onKeyFound: findPhysicsKey }); }, 1150);
  }
  function findPhysicsKey() {
    if (state.discoveries.has('key')) return;
    unlockSymbol('key'); state.phase = 'KEY_FOUND'; state.collapsing = true; persist(); window.DreamPhysics?.slow(); audio.tone(780, .4, .12, 'triangle'); audio.fadeTo(0, .7); showWhisper('You finally found it.', 2600);
    window.setTimeout(() => { window.DreamPhysics?.stop(); body.classList.remove('physics-mode'); state.collapsing = false; state.phase = 'VOID'; persist(); renderScene('void', { immediate: true }); showWhisper('The next room has no walls.', 2600); }, 2200);
  }
  function finalDoor() {
    if (!state.voidReady) return showWhisper('The photograph is still speaking.');
    body.classList.add('final-opening'); audio.fadeTo(0, 1); showWhisper('The door opens onto the first moment.', 2400); window.setTimeout(finishEnding, 1500);
  }
  function finishEnding() {
    state.ending = true; state.entered = false; state.phase = 'ENDING'; persist(); body.classList.remove('entered', 'final-opening'); body.classList.add('ending'); endingOverlay.classList.add('is-active'); endingOverlay.setAttribute('aria-hidden', 'false'); window.setTimeout(() => { endingOverlay.classList.remove('is-active'); endingOverlay.setAttribute('aria-hidden', 'true'); body.classList.remove('ending'); body.classList.add('not-entered', 'loop-start'); landingSubtitle.textContent = 'You already have.'; if (loopKey) loopKey.hidden = false; state.scene = 'room'; state.phase = 'ROOM'; state.voidReady = false; persist(); renderScene('room', { immediate: true }); }, 3400);
  }
  function enter() { if (state.entered) return; state.entered = true; state.ending = false; state.phase = state.phase === 'ENDING' ? 'ROOM' : state.phase; if (loopKey) loopKey.hidden = true; persist(); body.classList.remove('not-entered', 'loop-start'); body.classList.add('entered'); audio.ensure(); if (state.soundOn) audio.setScene(state.scene); showWhisper('Good. Keep your eyes open.', 2600); }
  function toggleJournal(open) { state.journalOpen = open ?? !state.journalOpen; journal.classList.toggle('is-open', state.journalOpen); journal.setAttribute('aria-hidden', String(!state.journalOpen)); }
  function restart() { body.classList.remove('inverted', 'glitching'); state.timeSkew = 1; root.style.setProperty('--time-skew', 1); renderScene(state.scene, { immediate: true }); if (!state.entered) enter(); else showWhisper('The dream folds itself back into place.'); }
  function restartEnding() { localStorage.removeItem(storageKey); window.location.reload(); }

  function handleAction(target) {
    if (target.matches('.chaos-lock')) return cycleChaosColor(Number(target.dataset.chaosIndex));
    const action = target.dataset.action; if (!action) return;
    if (action === 'restart-ending') return restartEnding();
    if (action === 'enter') return enter();
    if (action !== 'sound-toggle' && state.soundOn) audio.ensure().then(() => audio.setScene(state.scene));
    if (action === 'sound-toggle') return audio.toggle();
    if (action === 'scene') return travelTo(target.dataset.sceneTarget || 'room', 'portal');
    if (action === 'door') return nextScene();
    if (action === 'escape-door') return escapeDoor();
    if (action === 'hallway-door') return hallwayDoor(target);
    if (action === 'chaos-card') return openChaosCard();
    if (action === 'chaos-close') return closeChaosCard();
    if (action === 'final-door') return finalDoor();
    if (action === 'telephone') return telephone();
    if (action === 'clock') return clock();
    if (action === 'mirror') return mirror();
    if (action === 'tv') return television();
    if (action === 'photograph') return photograph();
    if (action === 'chair') return chair();
    if (action === 'balloon') return balloon();
    if (action === 'fish') return fish();
    if (action === 'symbol') return unlockSymbol(target.dataset.symbol);
    if (action === 'journal') return toggleJournal(true);
    if (action === 'journal-close') return toggleJournal(false);
    if (action === 'restart') return restart();
    if (action === 'scroll-cue') return window.scrollTo({ top: Math.min(window.innerHeight * .8, document.body.scrollHeight), behavior: 'smooth' });
  }

  document.addEventListener('click', (event) => { const target = event.target.closest('[data-action], .chaos-lock'); if (target) handleAction(target); });
  chaosCardLayer?.addEventListener('click', (event) => { if (event.target === chaosCardLayer) closeChaosCard(); });
  volumeControl.addEventListener('input', (event) => { audio.setVolume(event.target.value); if (!state.soundOn) audio.toggle(); });
  let touchStartX = 0;
  window.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  window.addEventListener('touchend', (event) => { const delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) < 60 || state.collapsing) return; const current = scenes.indexOf(state.scene); travelTo(scenes[(current + (delta < 0 ? 1 : -1) + scenes.length) % scenes.length], 'drift'); }, { passive: true });
  window.addEventListener('scroll', () => root.style.setProperty('--scroll', Math.min(1, window.scrollY / Math.max(1, window.innerHeight * .55))), { passive: true });
  window.addEventListener('pointermove', (event) => { pointerX = event.clientX; pointerY = event.clientY; cursorHalo.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`; cursorCore.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`; cursorLabel.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`; root.style.setProperty('--px', ((event.clientX / window.innerWidth) - .5).toFixed(3)); root.style.setProperty('--py', ((event.clientY / window.innerHeight) - .5).toFixed(3)); if (window.DreamParticles) window.DreamParticles.setPointer(event.clientX / window.innerWidth, event.clientY / window.innerHeight); updateVelocity(event); const interactive = event.target.closest('[data-cursor]'); if (interactive) { body.classList.add('cursor-ready', 'cursor-hover'); setCursorLabel(interactive.dataset.cursor); } else { body.classList.remove('cursor-hover'); setCursorLabel('LOOK'); } }, { passive: true });
  document.addEventListener('pointerover', (event) => { const item = event.target.closest('[data-cursor]'); if (item) { body.classList.add('cursor-ready', 'cursor-hover'); setCursorLabel(item.dataset.cursor); } });
  document.addEventListener('pointerout', (event) => { if (!event.relatedTarget || !event.relatedTarget.closest?.('[data-cursor]')) body.classList.remove('cursor-hover'); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && chaosCardLayer?.classList.contains('is-open')) closeChaosCard(); else if (event.key === 'Escape' && state.journalOpen) toggleJournal(false); if (event.key.toLowerCase() === 'm') audio.toggle(); if (event.key.toLowerCase() === 'r') restart(); if (event.key >= '1' && event.key <= '4') travelTo(scenes[Number(event.key) - 1]); if (event.key === 'Enter' && !state.entered) enter(); });

  if (state.ending) { state.entered = false; body.classList.remove('entered'); body.classList.add('not-entered', 'loop-start'); if (landingSubtitle) landingSubtitle.textContent = 'You already have.'; if (loopKey) loopKey.hidden = false; }
  else if (state.entered) { body.classList.remove('not-entered'); body.classList.add('entered'); }
  updateSoundUI(); updateDiscoveryUI(); updateChaosUI(); renderScene(state.scene, { immediate: true });
  instabilityFrame = requestAnimationFrame(instabilityLoop);
})();

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  // ---------- audio ----------
  let audioCtx = null;
  function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  function beep(freq, dur, type = 'sine', vol = 0.12) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  }
  function sweep(a, b, dur) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(a, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(b, audioCtx.currentTime + dur);
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  }

  // ---------- stars ----------
  const stars = [];
  for (let i = 0; i < 180; i++) stars.push({
    x: Math.random(), y: Math.random(), z: Math.random() * 0.8 + 0.2,
    tw: Math.random() * Math.PI * 2
  });

  // ---------- input ----------
  const keys = {};
  addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key === ' ') e.preventDefault(); });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  // ---------- particles ----------
  const particles = [];
  function emit(x, y, color, n = 12, speed = 3, life = 0.6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * speed + 0.5;
      particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life, maxLife: life, color, size: Math.random()*2+1 });
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt * 60; p.y += p.vy * dt * 60;
      p.vx *= 0.96; p.vy *= 0.96;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // ---------- levels ----------
  // Each level: platforms [{x,y,w,h}], portals [{x,y,r,scale,pair}], shards [{x,y}], start {x,y}, exit {x,y,r}
  // coordinates in world units; camera follows player
  const levels = [
    // Level 1
    {
      platforms: [
        {x:-400,y:120,w:900,h:24}, {x:-400,y:-200,w:24,h:320},
        {x:476,y:-200,w:24,h:320}, {x:-120,y:0,w:120,h:16},
        {x:180,y:-80,w:120,h:16}, {x:0,y:-160,w:80,h:16}
      ],
      portals: [
        {x:-250,y:96,r:22,scale:0.5,pair:1},
        {x:200,y:-104,r:22,scale:2.0,pair:0}
      ],
      shards: [{x:-60,y:-20},{x:240,y:-120},{x:0,y:-190}],
      start: {x:-320,y:80}, exit: {x:360,y:80,r:28}
    },
    // Level 2
    {
      platforms: [
        {x:-500,y:160,w:1100,h:24}, {x:-500,y:-260,w:24,h:420},
        {x:576,y:-260,w:24,h:420}, {x:-300,y:60,w:100,h:16},
        {x:-120,y:-40,w:100,h:16}, {x:80,y:-140,w:100,h:16},
        {x:260,y:-40,w:100,h:16}, {x:-200,y:-180,w:60,h:16},
        {x:120,y:-230,w:60,h:16}
      ],
      portals: [
        {x:-400,y:136,r:20,scale:0.4,pair:1},
        {x:0,y:-64,r:20,scale:1.6,pair:0},
        {x:320,y:136,r:20,scale:0.6,pair:3},
        {x:-80,y:-164,r:20,scale:1.8,pair:2}
      ],
      shards: [{x:-260,y:30},{x:-80,y:-70},{x:120,y:-170},{x:300,y:-70},{x:-160,y:-210}],
      start: {x:-440,y:120}, exit: {x:480,y:120,r:28}
    },
    // Level 3
    {
      platforms: [
        {x:-600,y:200,w:1300,h:24}, {x:-600,y:-320,w:24,h:520},
        {x:676,y:-320,w:24,h:520}, {x:-420,y:100,w:90,h:16},
        {x:-260,y:20,w:90,h:16}, {x:-100,y:-60,w:90,h:16},
        {x:60,y:-140,w:90,h:16}, {x:220,y:-60,w:90,h:16},
        {x:380,y:20,w:90,h:16}, {x:-340,y:-120,w:70,h:16},
        {x:-180,y:-200,w:70,h:16}, {x:-20,y:-260,w:70,h:16},
        {x:140,y:-200,w:70,h:16}, {x:300,y:-120,w:70,h:16}
      ],
      portals: [
        {x:-500,y:176,r:18,scale:0.35,pair:1},
        {x:-180,y:-84,r:18,scale:2.2,pair:0},
        {x:140,y:-164,r:18,scale:0.5,pair:3},
        {x:440,y:176,r:18,scale:1.5,pair:2},
        {x:-20,y:-284,r:18,scale:0.7,pair:5},
        {x:260,y:-84,r:18,scale:1.3,pair:4}
      ],
      shards: [{x:-380,y:70},{x:-220,y:-10},{x:-60,y:-90},{x:100,y:-170},{x:260,y:-90},{x:420,y:-10},{x:-300,y:-150},{x:-140,y:-230},{x:20,y:-290},{x:180,y:-230}],
      start: {x:-540,y:160}, exit: {x:560,y:160,r:28}
    }
  ];

  // ---------- state ----------
  let levelIndex = 0;
  let level = null;
  let player = null;
  let cam = {x:0,y:0};
  let scale = 1;
  let shardsCollected = 0;
  let totalShards = 0;
  let state = 'menu'; // menu | play | win | complete
  let cooldown = 0; // portal cooldown to avoid bounce
  let trail = [];

  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlaySub = document.getElementById('overlaySub');
  const overlayBtn = document.getElementById('overlayBtn');
  const hudLevel = document.getElementById('level');
  const hudShards = document.getElementById('shards');
  const hudScale = document.getElementById('scale');

  function loadLevel(i) {
    level = levels[i];
    levelIndex = i;
    player = { x: level.start.x, y: level.start.y, vx: 0, vy: 0, r: 10 };
    scale = 1;
    shardsCollected = 0;
    totalShards = level.shards.length;
    level.shards.forEach(s => s.taken = false);
    cooldown = 0;
    trail = [];
    cam.x = player.x; cam.y = player.y;
    hudLevel.textContent = 'LEVEL ' + (i + 1);
    updateShardsHud();
    updateScaleHud();
  }

  function updateShardsHud() { hudShards.textContent = 'SHARDS ' + shardsCollected + '/' + totalShards; }
  function updateScaleHud() { hudScale.textContent = 'SCALE ' + scale.toFixed(2) + 'x'; }

  function showOverlay(title, sub, btn) {
    overlayTitle.textContent = title;
    overlaySub.textContent = sub;
    overlayBtn.textContent = btn;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() { overlay.classList.add('hidden'); }

  overlayBtn.addEventListener('click', () => {
    ensureAudio();
    if (state === 'menu') { state = 'play'; hideOverlay(); loadLevel(0); }
    else if (state === 'win') { state = 'play'; hideOverlay(); if (levelIndex + 1 < levels.length) loadLevel(levelIndex + 1); else { state = 'complete'; showOverlay('COMPLETE', 'All portals traversed. You have mastered scale.', 'REPLAY'); } }
    else if (state === 'complete') { state = 'play'; hideOverlay(); loadLevel(0); }
  });

  // start menu
  state = 'menu';
  showOverlay('SCALE PORTAL', 'Traverse a world that changes size beneath your feet. Collect shards. Reach the golden exit.', 'BEGIN');

  // ---------- collision ----------
  function collidesCircleRect(cx, cy, r, rect) {
    const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - nx, dy = cy - ny;
    return dx*dx + dy*dy < r*r;
  }
  function resolvePlayer() {
    const r = player.r * scale;
    // vertical
    player.y += player.vy;
    for (const p of level.platforms) {
      if (collidesCircleRect(player.x, player.y, r, p)) {
        if (player.vy > 0) { player.y = p.y - r; player.vy = 0; }
        else if (player.vy < 0) { player.y = p.y + p.h + r; player.vy = 0; }
      }
    }
    player.x += player.vx;
    for (const p of level.platforms) {
      if (collidesCircleRect(player.x, player.y, r, p)) {
        if (player.vx > 0) { player.x = p.x - r; player.vx = 0; }
        else if (player.vx < 0) { player.x = p.x + p.w + r; player.vx = 0; }
      }
    }
  }

  // ---------- update ----------
  let last = performance.now();
  function update(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (state === 'play') {
      // input
      const accel = 0.6;
      let ax = 0, ay = 0;
      if (keys['a'] || keys['arrowleft']) ax -= 1;
      if (keys['d'] || keys['arrowright']) ax += 1;
      if (keys['w'] || keys['arrowup']) ay -= 1;
      if (keys['s'] || keys['arrowdown']) ay += 1;
      const len = Math.hypot(ax, ay) || 1;
      ax /= len; ay /= len;
      const speed = 260 / scale; // smaller = faster? scale down -> move faster relative
      player.vx += ax * accel * 60 * dt * (speed/260);
      player.vy += ay * accel * 60 * dt * (speed/260);
      // friction
      player.vx *= 0.88; player.vy *= 0.88;
      // clamp
      const maxV = speed;
      const v = Math.hypot(player.vx, player.vy);
      if (v > maxV) { player.vx = player.vx/v*maxV; player.vy = player.vy/v*maxV; }

      resolvePlayer();

      // trail
      trail.push({x: player.x, y: player.y, life: 0.4});
      if (trail.length > 40) trail.shift();
      trail.forEach(t => t.life -= dt);

      // shards
      for (const s of level.shards) {
        if (s.taken) continue;
        const d = Math.hypot(player.x - s.x, player.y - s.y);
        if (d < player.r * scale + 10) {
          s.taken = true; shardsCollected++;
          emit(s.x, s.y, '#ffe066', 16, 4, 0.7);
          beep(660, 0.12, 'sine'); setTimeout(() => beep(880, 0.1, 'sine'), 80);
          updateShardsHud();
        }
      }

      // portals
      cooldown -= dt;
      if (cooldown <= 0) {
        for (let i = 0; i < level.portals.length; i++) {
          const p = level.portals[i];
          const d = Math.hypot(player.x - p.x, player.y - p.y);
          if (d < p.r + player.r * scale * 0.5) {
            const target = level.portals[p.pair];
            player.x = target.x; player.y = target.y;
            scale = p.scale;
            cooldown = 0.6;
            emit(p.x, p.y, '#7df9ff', 30, 5, 0.9);
            emit(target.x, target.y, '#b07cff', 30, 5, 0.9);
            sweep(220, 880, 0.25);
            updateScaleHud();
            break;
          }
        }
      }

      // exit
      const ex = level.exit;
      const de = Math.hypot(player.x - ex.x, player.y - ex.y);
      if (de < ex.r + player.r * scale * 0.5 && shardsCollected >= totalShards) {
        emit(ex.x, ex.y, '#7dff9a', 40, 6, 1.0);
        sweep(440, 1320, 0.4);
        state = 'win';
        if (levelIndex + 1 >= levels.length) {
          showOverlay('COMPLETE', 'All portals traversed. You have mastered scale.', 'REPLAY');
        } else {
          showOverlay('LEVEL ' + (levelIndex + 1) + ' CLEAR', 'Shards collected: ' + shardsCollected + '/' + totalShards, 'NEXT LEVEL');
        }
      }

      // camera follow
      cam.x += (player.x - cam.x) * 0.12;
      cam.y += (player.y - cam.y) * 0.12;
    }

    updateParticles(dt);
    draw();
    requestAnimationFrame(update);
  }

  // ---------- draw ----------
  function draw() {
    const W = innerWidth, H = innerHeight;
    ctx.clearRect(0, 0, W, H);

    // background gradient
    const g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
    g.addColorStop(0, '#0a0f24'); g.addColorStop(1, '#05060f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // stars (parallax)
    for (const s of stars) {
      const sx = (s.x * W + cam.x * 0.05 * s.z) % W;
      const sy = (s.y * H + cam.y * 0.05 * s.z) % H;
      const x = sx < 0 ? sx + W : sx;
      const y = sy < 0 ? sy + H : sy;
      const tw = 0.5 + 0.5 * Math.sin(performance.now()/1000 * (1+s.z) + s.tw);
      ctx.globalAlpha = 0.3 + 0.5 * tw * s.z;
      ctx.fillStyle = '#bfe3ff';
      ctx.beginPath(); ctx.arc(x, y, s.z*1.2, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (state !== 'play' && state !== 'win') {
      // menu: still draw nothing extra
    }

    if (level) {
      ctx.save();
      ctx.translate(W/2 - cam.x, H/2 - cam.y);

      // platforms
      for (const p of level.platforms) {
        ctx.fillStyle = 'rgba(40,60,120,0.55)';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = 'rgba(120,160,255,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        // top glow
        ctx.fillStyle = 'rgba(125,249,255,0.08)';
        ctx.fillRect(p.x, p.y, p.w, 3);
      }

      // portals
      for (const p of level.portals) {
        const t = performance.now()/1000;
        const pulse = 1 + 0.12 * Math.sin(t*3 + p.x);
        ctx.save();
        ctx.translate(p.x, p.y);
        // outer glow
        const rg = ctx.createRadialGradient(0,0,0,0,0,p.r*2.2);
        rg.addColorStop(0, 'rgba(176,124,255,0.35)');
        rg.addColorStop(1, 'rgba(176,124,255,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(0,0,p.r*2.2*pulse,0,Math.PI*2); ctx.fill();
        // ring
        ctx.strokeStyle = 'rgba(125,249,255,0.9)';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0,0,p.r*pulse,0,Math.PI*2); ctx.stroke();
        ctx.strokeStyle = 'rgba(176,124,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0,0,p.r*0.7*pulse,0,Math.PI*2); ctx.stroke();
        // label
        ctx.fillStyle = 'rgba(232,240,255,0.7)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.scale.toFixed(2) + 'x', 0, p.r + 14);
        ctx.restore();
      }

      // shards
      for (const s of level.shards) {
        if (s.taken) continue;
        const t = performance.now()/1000;
        const bob = Math.sin(t*2 + s.x)*3;
        ctx.save();
        ctx.translate(s.x, s.y + bob);
        const rg = ctx.createRadialGradient(0,0,0,0,0,14);
        rg.addColorStop(0, 'rgba(255,224,102,0.9)');
        rg.addColorStop(1, 'rgba(255,224,102,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffe066';
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = k * Math.PI/3 + t;
          const rr = k % 2 === 0 ? 6 : 3;
          const px = Math.cos(a)*rr, py = Math.sin(a)*rr;
          if (k === 0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }

      // exit
      const ex = level.exit;
      const t = performance.now()/1000;
      ctx.save();
      ctx.translate(ex.x, ex.y);
      const pulse = 1 + 0.15 * Math.sin(t*4);
      const rg = ctx.createRadialGradient(0,0,0,0,0,ex.r*2.5);
      rg.addColorStop(0, 'rgba(125,255,154,0.4)');
      rg.addColorStop(1, 'rgba(125,255,154,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(0,0,ex.r*2.5*pulse,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#7dff9a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0,0,ex.r*pulse,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle = 'rgba(125,255,154,0.15)';
      ctx.beginPath(); ctx.arc(0,0,ex.r*pulse*0.7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(232,240,255,0.8)';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', 0, 4);
      ctx.restore();

      // trail
      for (const tr of trail) {
        if (tr.life <= 0) continue;
        ctx.globalAlpha = tr.life * 0.6;
        ctx.fillStyle = '#7df9ff';
        ctx.beginPath(); ctx.arc(tr.x, tr.y, 3, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // player
      if (player) {
        const r = player.r * scale;
        ctx.save();
        ctx.translate(player.x, player.y);
        const rg = ctx.createRadialGradient(0,0,0,0,0,r*3);
        rg.addColorStop(0, 'rgba(255,255,255,0.9)');
        rg.addColorStop(0.3, 'rgba(125,249,255,0.6)');
        rg.addColorStop(1, 'rgba(125,249,255,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(0,0,r*3,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      // particles (screen space? world space with cam)
      ctx.save();
      ctx.translate(W/2 - cam.x, H/2 - cam.y);
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  requestAnimationFrame(update);
})();

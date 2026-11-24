  const lines = [
    { text: "> initializing profile...", cls: "" },
    { text: "> loading modules: dev, community-ops, web3", cls: "" },
    { text: "> web3_community_experience: 4+ years [OK]", cls: "ok" },
    { text: "> multi_chain_dev: ACTIVE [OK]", cls: "ok" },
    { text: "> availability: OPEN_TO_WORK", cls: "warn" },
    { text: "> ready.", cls: "ok" },
  ];
  const output = document.getElementById('term-output');
  let lineIndex = 0;
  function typeLine(){
    if(lineIndex >= lines.length){ return; }
    const line = lines[lineIndex];
    const div = document.createElement('div');
    div.className = 'term-line';
    output.appendChild(div);
    let charIndex = 0;
    function typeChar(){
      if(charIndex <= line.text.length){
        div.innerHTML = `<span class="${line.cls}">${line.text.slice(0, charIndex)}</span><span class="cursor"></span>`;
        charIndex++;
        setTimeout(typeChar, 18);
      } else {
        div.innerHTML = `<span class="${line.cls}">${line.text}</span>`;
        lineIndex++;
        setTimeout(typeLine, 120);
      }
    }
    typeChar();
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduced){
    output.innerHTML = lines.map(l => `<div class="term-line"><span class="${l.cls}">${l.text}</span></div>`).join('');
  } else {
    typeLine();
  }

  // ---- Parallax scroll var ----
  function updateScrollVar(){
    document.documentElement.style.setProperty('--scrollY', window.scrollY + 'px');
  }
  window.addEventListener('scroll', updateScrollVar, { passive:true });
  updateScrollVar();

  // ---- 3D tilt on project cards ----
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      if(prefersReduced) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(700px) rotateY(0) rotateX(0) translateY(0)';
    });
  });

  // ---- Free-roaming bot engine ----
  (function(){
    if(prefersReduced) return;
    const bot = document.getElementById('bot');
    const menu = document.getElementById('bot-menu');
    const svg = bot.querySelector('svg');
    const BOT_W = 42, BOT_H = 58;

    let pos = { x: window.innerWidth - 50, y: window.innerHeight - 90 };
    let idleTimer = null;
    let menuOpen = false;
    let busy = false;
    let lastActivity = Date.now();
    let wandering = false;
    let wanderTimer = null;
    let tapCount = 0;
    let tapWindowTimer = null;
    let isHolding = false;
    let holdTimer = null;
    let petInterval = null;
    let isFainted = false;
    const hudStatus = document.getElementById('hud-status');
    const toolEl = document.getElementById('bot-tool');

    function place(x, y){
      bot.style.left = (x - BOT_W/2) + 'px';
      bot.style.top = (y - BOT_H) + 'px';
    }
    place(pos.x, pos.y);

    function spawnRipple(x, y){
      const r = document.createElement('div');
      r.className = 'ripple';
      r.style.left = x + 'px'; r.style.top = y + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 520);
    }

    function spawnSparks(x, y){
      for(let i = 0; i < 6; i++){
        const s = document.createElement('div');
        s.className = 'spark';
        const angle = Math.random() * Math.PI * 2;
        const dist = 18 + Math.random() * 22;
        s.style.left = x + 'px'; s.style.top = y + 'px';
        s.style.background = i % 2 === 0 ? 'var(--cyan)' : 'var(--magenta)';
        s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 440);
      }
    }

    function spawnFlashTrail(x0, y0, x1, y1, duration){
      const steps = 3;
      for(let i = 1; i <= steps; i++){
        const t = i / (steps + 1);
        const gx = x0 + (x1 - x0) * t, gy = y0 + (y1 - y0) * t;
        setTimeout(() => {
          const g = document.createElement('div');
          g.className = 'flash-step';
          g.style.left = gx + 'px'; g.style.top = gy + 'px';
          document.body.appendChild(g);
          setTimeout(() => g.remove(), 300);
        }, duration * t * 0.55);
      }
    }

    function spawnConnect(x, y){
      const r1 = document.createElement('div');
      r1.className = 'connect-ring';
      r1.style.left = x + 'px'; r1.style.top = y + 'px';
      document.body.appendChild(r1);
      const r2 = document.createElement('div');
      r2.className = 'connect-ring';
      r2.style.left = x + 'px'; r2.style.top = y + 'px';
      r2.style.borderColor = 'var(--cyan)';
      r2.style.animationDelay = '.1s';
      document.body.appendChild(r2);
      spawnSparks(x, y);
      bot.classList.add('bot-jolt');
      setTimeout(() => bot.classList.remove('bot-jolt'), 260);
      setTimeout(() => { r1.remove(); r2.remove(); }, 650);
    }

    function moveBotTo(x, y, cb){
      const dx = x - pos.x, dy = y - pos.y;
      const dist = Math.hypot(dx, dy);
      const duration = Math.min(600, Math.max(120, dist * 0.7));
      if(dist > 16){ spawnFlashTrail(pos.x, pos.y, x, y, duration); }
      bot.style.transitionDuration = duration + 'ms';
      bot.classList.remove('bot-idle');
      bot.classList.add('bot-running');
      if(dx < -4){ svg.classList.add('flip'); }
      else if(dx > 4){ svg.classList.remove('flip'); }
      place(x, y);
      pos = { x, y };
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        bot.classList.remove('bot-running');
        bot.classList.add('bot-idle');
        if(cb) cb();
      }, duration + 20);
      return duration;
    }

    function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

    function performAction(el){
      if(el.tagName === 'A'){
        const href = el.getAttribute('href');
        if(href && href.startsWith('#')){
          const target = document.querySelector(href);
          if(target) target.scrollIntoView({ behavior:'smooth', block:'start' });
        } else if(href){
          window.open(href, el.getAttribute('target') || '_self');
        }
      } else if(el.classList.contains('card')){
        el.classList.add('card-flash');
        setTimeout(() => el.classList.remove('card-flash'), 500);
      }
    }

    function toggleMenu(){
      menuOpen = !menuOpen;
      menu.classList.toggle('open', menuOpen);
    }
    bot.addEventListener('pointerdown', (e) => {
      if(isFainted) return;
      markActivity();
      isHolding = false;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        isHolding = true;
        menuOpen = false; menu.classList.remove('open');
        bot.classList.add('bot-loved');
        spawnHeart();
        petInterval = setInterval(spawnHeart, 300);
      }, 420);
    });

    function endHold(){
      clearTimeout(holdTimer);
      if(isHolding){
        isHolding = false;
        bot.classList.remove('bot-loved');
        clearInterval(petInterval);
        return true;
      }
      return false;
    }

    bot.addEventListener('pointerup', (e) => {
      e.stopPropagation();
      const wasHolding = endHold();
      if(isFainted || wasHolding) return;
      registerTap();
    });
    bot.addEventListener('pointerleave', () => { endHold(); });
    bot.addEventListener('pointercancel', () => { endHold(); });

    bot.addEventListener('keydown', (e) => {
      if((e.key === 'Enter' || e.key === ' ') && !isFainted){
        e.preventDefault(); e.stopPropagation();
        markActivity();
        registerTap();
      }
    });

    function registerTap(){
      tapCount++;
      clearTimeout(tapWindowTimer);
      tapWindowTimer = setTimeout(() => { tapCount = 0; }, 1400);

      if(tapCount >= 5){
        tapCount = 0;
        clearTimeout(tapWindowTimer);
        triggerFaint();
        return;
      }
      if(tapCount >= 2){
        triggerAnnoyed();
        menuOpen = false; menu.classList.remove('open');
      } else if(!busy){
        toggleMenu();
      }
    }

    function triggerAnnoyed(){
      bot.classList.remove('bot-annoyed');
      void bot.offsetWidth;
      bot.classList.add('bot-annoyed');
      setTimeout(() => bot.classList.remove('bot-annoyed'), 380);
    }

    function spawnHeart(){
      const rect = bot.getBoundingClientRect();
      const h = document.createElement('div');
      h.className = 'heart-particle';
      h.textContent = '♥';
      h.style.left = (rect.left + rect.width/2 + (Math.random()*16 - 8)) + 'px';
      h.style.top = rect.top + 'px';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 780);
    }

    function spawnErrorBubble(){
      const rect = bot.getBoundingClientRect();
      const b = document.createElement('div');
      b.className = 'error-bubble';
      b.textContent = 'SYSTEM ERROR';
      b.style.left = (rect.left + rect.width/2) + 'px';
      b.style.top = (rect.top - 6) + 'px';
      document.body.appendChild(b);
      setTimeout(() => b.remove(), 1250);
    }

    function triggerFaint(){
      if(isFainted) return;
      isFainted = true;
      wandering = false;
      clearTimeout(wanderTimer);
      clearTimeout(holdTimer);
      clearInterval(petInterval);
      toolEl.classList.remove('show');
      bot.classList.remove('bot-typing', 'bot-loved', 'bot-annoyed', 'bot-idle', 'bot-running');
      menuOpen = false; menu.classList.remove('open');
      if(hudStatus) hudStatus.textContent = 'ERROR';

      const rect = bot.getBoundingClientRect();
      toolEl.className = 'bot-tool show tool-weld';
      toolEl.innerHTML = TOOL_SVGS.dizzy;
      bot.classList.add('bot-dizzy');
      spawnErrorBubble();

      setTimeout(() => {
        toolEl.classList.remove('show');
        bot.classList.remove('bot-dizzy');
        bot.classList.add('bot-fainted');
        setTimeout(() => spawnCraneRepair(), 450);
      }, 900);
    }

    function spawnCraneRepair(){
      const rect = bot.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const crane = document.createElement('div');
      crane.id = 'repair-crane';
      crane.innerHTML = CRANE_SVG;
      crane.style.top = (rect.top - 26) + 'px';
      crane.style.left = (window.innerWidth + 80) + 'px';
      crane.style.transition = 'left .9s ease-in-out';
      document.body.appendChild(crane);

      requestAnimationFrame(() => {
        crane.style.left = (rect.left + 60) + 'px';
      });

      setTimeout(() => {
        const hook = crane.querySelector('.crane-hook');
        if(hook){ hook.setAttribute('y2', '30'); }
        spawnSparks(centerX, centerY);
        const sparkLoop = setInterval(() => spawnSparks(centerX, centerY), 280);

        setTimeout(() => {
          clearInterval(sparkLoop);
          bot.classList.remove('bot-fainted');
          bot.classList.add('bot-idle');
          isFainted = false;
          lastActivity = Date.now();
          if(hudStatus) hudStatus.textContent = 'ONLINE';

          crane.style.left = (window.innerWidth + 100) + 'px';
          setTimeout(() => crane.remove(), 950);
        }, 1100);
      }, 950);
    }

    menu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        markActivity();
        menuOpen = false; menu.classList.remove('open');

        if(btn.dataset.action === 'signal'){
          openVisitorModal();
          return;
        }

        const target = document.getElementById(btn.dataset.target);
        if(target){
          const rect = target.getBoundingClientRect();
          const tx = clamp(rect.left + 60, 40, window.innerWidth - 40);
          const ty = clamp(rect.top + 40, 90, window.innerHeight - 40);
          moveBotTo(tx, ty, () => spawnConnect(tx, ty));
          target.scrollIntoView({ behavior:'smooth', block:'start' });
        }
      });
    });

    // Click anywhere on the page: run there, and if it's a link/button/card, connect + act
    document.addEventListener('click', (e) => {
      markActivity();
      if(bot.contains(e.target)) return;
      if(menu.contains(e.target)) return;
      if(isFainted) return;

      const interactive = e.target.closest('a, .btn, .card');
      const x = clamp(e.clientX, 30, window.innerWidth - 30);
      const y = clamp(e.clientY, 90, window.innerHeight - 30);

      if(interactive){
        e.preventDefault();
        if(busy) return;
        busy = true;
        const rect = interactive.getBoundingClientRect();
        const tx = clamp(rect.left + rect.width/2, 30, window.innerWidth - 30);
        const ty = clamp(rect.top + rect.height/2, 90, window.innerHeight - 30);
        moveBotTo(tx, ty, () => {
          spawnConnect(tx, ty);
          interactive.classList.add('target-glow');
          setTimeout(() => {
            interactive.classList.remove('target-glow');
            performAction(interactive);
            busy = false;
          }, 200);
        });
      } else {
        moveBotTo(x, y);
        spawnRipple(x, y);
      }
    });

    window.spawnSparks = spawnSparks;

    window.addEventListener('resize', () => {
      pos.x = clamp(pos.x, 30, window.innerWidth - 30);
      pos.y = clamp(pos.y, 240, window.innerHeight - 30);
      place(pos.x, pos.y);
    });

    // Scroll-chase: bot runs to follow how far down the page you are
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      markActivity();
      if(scrollTicking || busy || isFainted) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min(1, window.scrollY / docHeight) : 0;
        const rangeTop = 240, rangeBottom = window.innerHeight - 40;
        const targetY = rangeTop + pct * (rangeBottom - rangeTop);
        moveBotTo(pos.x, targetY);
        scrollTicking = false;
      });
    }, { passive:true });

    // ---- Idle maintenance mode ----
    const TOOL_SVGS = {
      wrench: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M21 7a5 5 0 0 1-6.9 4.6L7 18.7 5.3 17l7.1-7.1A5 5 0 1 1 21 7Z" fill="none" stroke="var(--cyan)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>',
      weld: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="3" y="8" width="18" height="10" rx="2" fill="#111118" stroke="var(--magenta)" stroke-width="1.5"/><rect x="6" y="11" width="12" height="4" rx="1" fill="var(--red)" opacity="0.75"/></svg>',
      server: '<svg viewBox="0 0 32 26" width="100%" height="100%"><rect x="4" y="1" width="24" height="15" rx="2" fill="#0d0f1c" stroke="var(--cyan)" stroke-width="1.4"/><line x1="7" y1="5" x2="18" y2="5" stroke="var(--cyan)" stroke-width="1"/><line x1="7" y1="8" x2="22" y2="8" stroke="var(--magenta)" stroke-width="1"/><line x1="7" y1="11" x2="15" y2="11" stroke="var(--cyan)" stroke-width="1"/><rect x="13" y="16" width="6" height="3" fill="#0d0f1c"/><rect x="2" y="19" width="28" height="6" rx="1.5" fill="#12142a" stroke="var(--slate)" stroke-width="1"/><g class="key-blink"><rect x="5" y="21" width="3" height="2" rx="0.5" fill="var(--cyan)"/><rect x="10" y="21" width="3" height="2" rx="0.5" fill="var(--magenta)"/><rect x="15" y="21" width="3" height="2" rx="0.5" fill="var(--cyan)"/><rect x="20" y="21" width="3" height="2" rx="0.5" fill="var(--magenta)"/><rect x="25" y="21" width="3" height="2" rx="0.5" fill="var(--cyan)"/></g></svg>',
      dizzy: '<svg viewBox="0 0 24 24" width="100%" height="100%" style="animation:wrench-turn .5s linear infinite"><text x="12" y="17" font-size="16" text-anchor="middle" fill="var(--cyan)">✦</text></svg>'
    };

    const CRANE_SVG = '<svg viewBox="0 0 60 44" width="70" height="52"><rect x="4" y="28" width="16" height="12" rx="1" fill="#12142a" stroke="var(--slate)" stroke-width="1.5"/><circle cx="8" cy="41" r="3" fill="#0a0a0a"/><circle cx="17" cy="41" r="3" fill="#0a0a0a"/><line x1="15" y1="28" x2="15" y2="4" stroke="var(--cyan)" stroke-width="2.5"/><line x1="15" y1="6" x2="48" y2="6" stroke="var(--cyan)" stroke-width="2.5"/><line class="crane-hook" x1="42" y1="6" x2="42" y2="18" stroke="var(--magenta)" stroke-width="1.5"/><rect x="37" y="18" width="10" height="6" rx="1" fill="none" stroke="var(--magenta)" stroke-width="1.5"/></svg>';

    function markActivity(){
      lastActivity = Date.now();
      if(wandering){
        wandering = false;
        clearTimeout(wanderTimer);
        toolEl.classList.remove('show');
        bot.classList.remove('bot-typing');
        if(hudStatus) hudStatus.textContent = 'ONLINE';
      }
    }

    function performIdleTask(cb){
      const tasks = ['wrench', 'weld', 'server'];
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      const facingLeft = svg.classList.contains('flip');
      toolEl.className = 'bot-tool show tool-' + task + (facingLeft ? ' tool-left' : '');
      toolEl.innerHTML = TOOL_SVGS[task];

      let sparkInterval = null;
      if(task === 'weld'){
        sparkInterval = setInterval(() => {
          const rect = bot.getBoundingClientRect();
          spawnSparks(rect.left + rect.width/2, rect.top + 6);
        }, 260);
      }
      if(task === 'server'){
        bot.classList.add('bot-typing');
      }

      const duration = 1800 + Math.random() * 900;
      setTimeout(() => {
        toolEl.classList.remove('show');
        bot.classList.remove('bot-typing');
        if(sparkInterval) clearInterval(sparkInterval);
        setTimeout(() => {
          if(!toolEl.classList.contains('show')) toolEl.innerHTML = '';
          cb();
        }, 200);
      }, duration);
    }

    function wanderStep(){
      if(!wandering) return;
      const x = clamp(60 + Math.random() * (window.innerWidth - 120), 40, window.innerWidth - 40);
      const y = clamp(140 + Math.random() * (window.innerHeight - 220), 100, window.innerHeight - 40);
      moveBotTo(x, y, () => {
        if(!wandering) return;
        if(Math.random() < 0.6){
          performIdleTask(() => {
            if(!wandering) return;
            wanderTimer = setTimeout(wanderStep, 500 + Math.random() * 800);
          });
        } else {
          wanderTimer = setTimeout(wanderStep, 800 + Math.random() * 1200);
        }
      });
    }

    setInterval(() => {
      if(!wandering && !busy && !isFainted && Date.now() - lastActivity > 7000){
        wandering = true;
        if(hudStatus) hudStatus.textContent = 'AUTO-MAINTENANCE';
        wanderStep();
      }
    }, 1000);
  })();

  // ---- Visitor capture: drop a coin ----
  const visitorOverlay = document.getElementById('visitor-overlay');
  const visitorNameInput = document.getElementById('visitor-name');
  const visitorEmailInput = document.getElementById('visitor-email');
  const formPanel = document.getElementById('visitor-form-panel');
  const coinPanel = document.getElementById('coin-panel');
  const coinDropEl = document.getElementById('coin-drop');
  const VISITOR_KEY = 'em_signal_status';

  function openVisitorModal(){
    formPanel.style.display = '';
    coinPanel.style.display = 'none';
    visitorOverlay.classList.add('open');
    setTimeout(() => visitorNameInput.focus(), 150);
  }
  function closeVisitorModal(){
    visitorOverlay.classList.remove('open');
  }
  window.openVisitorModal = openVisitorModal;

  document.getElementById('visitor-close').addEventListener('click', () => {
    if(localStorage.getItem(VISITOR_KEY) !== 'dropped') localStorage.setItem(VISITOR_KEY, 'skipped');
    closeVisitorModal();
  });
  document.getElementById('visitor-skip').addEventListener('click', () => {
    localStorage.setItem(VISITOR_KEY, 'skipped');
    closeVisitorModal();
  });
  visitorOverlay.addEventListener('click', (e) => {
    if(e.target === visitorOverlay){
      if(localStorage.getItem(VISITOR_KEY) !== 'dropped') localStorage.setItem(VISITOR_KEY, 'skipped');
      closeVisitorModal();
    }
  });

  document.getElementById('visitor-submit').addEventListener('click', () => {
    const name = visitorNameInput.value.trim();
    const email = visitorEmailInput.value.trim();
    if(!name || !email || !email.includes('@')){
      const missing = !name ? visitorNameInput : visitorEmailInput;
      missing.style.borderColor = 'var(--red)';
      missing.focus();
      return;
    }
    // Silent submission — stays on site, no email app redirect
    fetch('https://formsubmit.co/ajax/emperorsmash08@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        _subject: 'New coin dropped by ' + name + ' (portfolio site)'
      })
    }).catch(() => {});

    localStorage.setItem(VISITOR_KEY, 'dropped');
    formPanel.style.display = 'none';
    coinPanel.style.display = '';
    coinDropEl.style.animation = 'none';
    void coinDropEl.offsetWidth;
    coinDropEl.style.animation = '';
  });

  [visitorNameInput, visitorEmailInput].forEach(el => {
    el.addEventListener('input', () => { el.style.borderColor = ''; });
    el.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') document.getElementById('visitor-submit').click();
    });
  });

  document.getElementById('coin-close').addEventListener('click', closeVisitorModal);

  // Copy Discord username to clipboard
  const discordBtn = document.getElementById('discord-copy');
  if(discordBtn){
    discordBtn.addEventListener('click', () => {
      const original = discordBtn.textContent;
      navigator.clipboard.writeText('emperorsmash').then(() => {
        discordBtn.textContent = 'Copied "emperorsmash"!';
        setTimeout(() => { discordBtn.textContent = original; }, 1800);
      }).catch(() => {
        discordBtn.textContent = 'Discord: emperorsmash';
        setTimeout(() => { discordBtn.textContent = original; }, 1800);
      });
    });
  }

  // Auto-show for first-time visitors only
  if(!localStorage.getItem(VISITOR_KEY)){
    setTimeout(() => {
      if(!document.getElementById('bot').classList.contains('bot-running')){
        openVisitorModal();
      }
    }, 4000);
  }

  if('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

/* ===== Boot intro (plays once per session, tap to skip) ===== */
(function(){
  const boot = document.getElementById('boot');
  if(!boot) return;
  let seen = false;
  try{ seen = sessionStorage.getItem('booted') === '1'; }catch(e){}
  if(seen){ boot.remove(); return; }
  const done = () => {
    boot.classList.add('out');
    setTimeout(() => boot.remove(), 1100);
    try{ sessionStorage.setItem('booted','1'); }catch(e){}
  };
  const timer = setTimeout(done, 6700);
  boot.addEventListener('click', () => { clearTimeout(timer); done(); });
})();


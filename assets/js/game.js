/* ============================================================
   Saurabh Ghumnar — portfolio v3 "Save file" game engine
   ============================================================ */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get: k => { try { return JSON.parse(localStorage.getItem('sg3:' + k)); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem('sg3:' + k, JSON.stringify(v)); } catch { } } };

  /* ---------- pixel sprites ---------- */
  const PAL = { '.': null, '1': '#2a1d3a', '2': '#f1c9a5', '3': '#2EE6FF', '4': '#3DFF75', '5': '#FF3DA6', '6': '#070A14', 'g': '#FFE45C', 'd': '#9a8a2b', 'r': '#FF4D4D', 'w': '#E8F1FF', 'm': '#FF3DA6', 'c': '#2EE6FF', 'p': '#8B6BFF', 'k': '#24304F' };
  const ANALYST = ['....1111....', '...111111...', '..11111111..', '..12222221..', '..13323321..', '..12222221..', '...222222...', '....2222....', '..44444444..', '.4444554444.', '.4444554444.', '.4444444444.', '..44....44..', '..66....66..'];
  const ICONS = {
    trophy: ['.gggggg.', 'gggggggg', 'gggggggg', '.gggggg.', '..dddd..', '...gg...', '..gggg..', '.gggggg.'],
    skull: ['..wwww..', '.wwwwww.', 'wwwwwwww', 'w.ww.w.w', 'wwwwwwww', '.ww.ww..', '..wwww..', '.w.w.w..'],
    star: ['...gg...', '...gg...', '.gggggg.', 'gggggggg', '.gggggg.', '..gggg..', '.gg..gg.', 'g......g'],
    chest: ['.dddddd.', 'dggggggd', 'dggggggd', 'dddddddd', 'dggdgggd', 'dggggggd', 'dggggggd', '.dddddd.'],
    tree: ['...44...', '..4444..', '.444444.', '..4444..', '.444444.', '444444444'.slice(0, 8), '...dd...', '...dd...'],
    map: ['cccccccc', 'c..cc..c', 'c.cccc.c', 'cccccccc', 'c.cccc.c', 'c..cc..c', 'c.cc.c.c', 'cccccccc'],
    pad: ['..kkkk..', '.kkkkkk.', 'kkwwkkgk', 'kwwwwkkk', 'kkwwkgkk', '.kkkkkk.', 'kk....kk', '........'],
    heart: ['.mm..mm.', 'mmmmmmmm', 'mmmmmmmm', 'mmmmmmmm', '.mmmmmm.', '..mmmm..', '...mm...', '........'],
    key: ['..gggg..', '.gg..gg.', '.gg..gg.', '..gggg..', '...gg...', '...gg.g.', '...gggg.', '...gg...'],
    disk: ['pppppppp', 'p.wwww.p', 'p.wwww.p', 'pppppppp', 'pppppppp', 'pp....pp', 'pp....pp', 'pppppppp'],
    doc: ['.wwwww..', '.w...ww.', '.w...www', '.w.....w', '.wkkkkkw', '.w.....w', '.wkkkkkw', '.wwwwwww'],
    bolt: ['....gg..', '...gg...', '..gg....', '.gggggg.', '....gg..', '...gg...', '..gg....', '.gg.....'],
  };
  const sprite = (rows, pal = PAL) => rows.map((r, y) => [...r].map((ch, x) => pal[ch] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[ch]}"/>` : '').join('')).join('');
  $('#titleSprite').innerHTML = sprite(ANALYST); $('#hudSprite').innerHTML = sprite(ANALYST);
  const iconSVG = (name, size = 36) => `<svg viewBox="0 0 8 8" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">${sprite(ICONS[name])}</svg>`;

  /* ---------- sound (WebAudio, off by default) ---------- */
  let AC = null, soundOn = false;
  const beep = (f = 440, d = .08, type = 'square', vol = .05, slide = 0) => { if (!soundOn) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; if (slide) o.frequency.exponentialRampToValueAtTime(slide, AC.currentTime + d); g.gain.value = vol; g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d); o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + d); } catch { } };
  const sfx = { click: () => beep(660, .06), hover: () => beep(880, .03, 'square', .02), coin: () => { beep(988, .08); setTimeout(() => beep(1319, .14), 70); }, hit: () => beep(120, .18, 'sawtooth', .06, 60), win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .16), i * 110)), lose: () => [392, 330, 262].forEach((f, i) => setTimeout(() => beep(f, .2, 'triangle'), i * 140)) };
  $('#sndBtn').addEventListener('click', e => { soundOn = !soundOn; e.currentTarget.setAttribute('aria-pressed', soundOn); if (soundOn) sfx.coin(); });
  $('#crtBtn').addEventListener('click', e => { const on = document.body.classList.toggle('no-crt'); e.currentTarget.setAttribute('aria-pressed', !on); sfx.click(); });
  document.addEventListener('click', e => { if (e.target.closest('.pbtn,.chip,.lvl,.item,.pin,.node')) sfx.click(); });

  /* ---------- toasts ---------- */
  const toasts = $('#toasts');
  const toast = (title, text, icon = 'trophy', cls = '') => { const t = document.createElement('div'); t.className = 'toast ' + cls; t.innerHTML = `<span class="ic">${iconSVG(icon)}</span><div><b>${title}</b><span>${text}</span></div>`; toasts.appendChild(t); while (toasts.children.length > 3) toasts.firstChild.remove(); setTimeout(() => t.remove(), 4800); };

  /* ---------- achievements + completion ---------- */
  const TROPHIES = [
    { id: 'new_game', name: 'New Game', desc: 'Pressed start.', icon: 'pad' },
    { id: 'quest_accepted', name: 'Quest Accepted', desc: 'Opened the quest log.', icon: 'doc' },
    { id: 'level_select', name: 'Level Select', desc: 'Opened a level card.', icon: 'star' },
    { id: 'boss_slain', name: 'Boss Slain', desc: 'Watched the month-end go down.', icon: 'skull' },
    { id: 'respec', name: 'Respec', desc: 'Inspected a skill node.', icon: 'tree' },
    { id: 'cartographer', name: 'Cartographer', desc: 'Loaded all three save points.', icon: 'map' },
    { id: 'loot_goblin', name: 'Loot Goblin', desc: 'Used three inventory items.', icon: 'chest' },
    { id: 'reconciled', name: 'Reconciled', desc: 'Scored 500+ in Reconcile Rush.', icon: 'bolt' },
    { id: 'high_score', name: 'Untied? Never.', desc: 'Scored 1000+ in Reconcile Rush.', icon: 'star', secret: true },
    { id: 'recruiter', name: 'Recruiter', desc: 'Downloaded the resume or sent an invite.', icon: 'disk' },
    { id: 'god_mode', name: 'God Mode', desc: 'You know the code.', icon: 'key', secret: true },
    { id: 'completionist', name: 'Completionist', desc: 'Reached 100% completion.', icon: 'trophy' },
  ];
  const state = { got: new Set(store.get('trophies') || []), seen: new Set(store.get('seen') || []), extra: new Set(store.get('extra') || []), loot: store.get('loot') || 0, saves: new Set(store.get('saves') || []) };
  const persist = () => { store.set('trophies', [...state.got]); store.set('seen', [...state.seen]); store.set('extra', [...state.extra]); store.set('loot', state.loot); store.set('saves', [...state.saves]); };
  const EXTRA = { level: 8, arcade: 10, loot: 5, skill: 5 }; // + 9 sections x 8 = 72
  const pct = () => Math.min(100, state.seen.size * 8 + [...state.extra].reduce((a, k) => a + (EXTRA[k] || 0), 0));
  const renderTrophies = () => { $('#trophyGrid').innerHTML = TROPHIES.map(t => { const on = state.got.has(t.id); const hidden = t.secret && !on; return `<div class="panel tro ${on ? 'on' : ''}"><span class="ic">${iconSVG(hidden ? 'key' : t.icon, 44)}</span><div><b>${hidden ? '? ? ?' : t.name}</b><span>${hidden ? 'Secret achievement.' : t.desc}</span>${t.secret ? '<span class="sec">Secret</span>' : ''}</div></div>`; }).join(''); $('#trCount').textContent = state.got.size; };
  const hud = () => { const p = pct(); $('#xpBar').style.width = p + '%'; $('#xpPct').textContent = p + '%'; if (p >= 100) unlock('completionist'); };
  const unlock = (id) => { if (state.got.has(id)) return; const t = TROPHIES.find(x => x.id === id); state.got.add(id); persist(); renderTrophies(); sfx.coin(); toast('Achievement unlocked', t.name, t.icon); };
  const gain = (key, label) => { if (state.extra.has(key)) return; state.extra.add(key); persist(); hud(); toast('+' + EXTRA[key] + '% completion', label, 'bolt', 'xp'); };
  renderTrophies(); hud();

  /* ---------- title screen ---------- */
  const title = $('#title'); const onStart = [];
  const start = () => { if (title.classList.contains('off')) return; title.classList.add('off'); document.body.classList.remove('lock'); sfx.coin(); unlock('new_game'); onStart.forEach(f => f()); };
  document.body.classList.add('lock');
  $('#startBtn').addEventListener('click', start); title.addEventListener('click', start);
  addEventListener('keydown', e => { if (!title.classList.contains('off') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); start(); } });
  if (RM) start();

  /* ---------- HUD nav + menu ---------- */
  const menu = $('#gmenu'), menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', () => { const o = menu.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
  menu.addEventListener('click', e => { if (e.target.tagName === 'A') { menu.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
  const navA = $$('.hud nav a');
  const navIO = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) navA.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
  $$('section[id]').forEach(s => navIO.observe(s));
  $$('[data-resume]').forEach(a => a.addEventListener('click', () => unlock('recruiter')));

  /* ---------- section completion ---------- */
  const NAMES = { char: 'Character sheet', quests: 'Quest log', boss: 'Boss arena', skills: 'Skill tree', map: 'Career map', inventory: 'Inventory', arcade: 'Arcade', trophies: 'Trophy room', party: 'Party screen' };
  const discover = k => { if (state.seen.has(k)) return; state.seen.add(k); persist(); hud(); toast('+8% completion', 'Discovered: ' + NAMES[k], 'bolt', 'xp'); if (k === 'quests') unlock('quest_accepted'); };
  const secIO = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting && title.classList.contains('off')) discover(en.target.dataset.xp); }), { threshold: .3 });
  $$('[data-xp]').forEach(s => secIO.observe(s));
  onStart.push(() => discover('char'));

  /* ---------- stat bars ---------- */
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { $$('#sheet .bar i').forEach((b, i) => setTimeout(() => b.style.width = b.dataset.w + '%', i * 120)); o.disconnect(); } }, { threshold: .4 }).observe($('#sheet'));

  /* ---------- levels (reports) ---------- */
  const LEVELS = [
    { id: 'mbr', f: ['exec', 'product'], t: 'Monthly Business Review', s: 'Performance vs. budget, forecast and prior year by account type, technology, vertical, brand and country. The basis for every regional MBR.', q: 'Where are we against plan this month, and which view explains the gap?', who: 'Executive leadership, President, Regional VPs, Product VPs, account-type managers, Commercial Excellence', how: 'Power BI on SAP-fed semantic models; DAX time intelligence and variance measures', stars: 3, bars: [5, 7, 4, 8, 6, 9, 7] },
    { id: 'orders', f: ['exec', 'sales'], t: 'Orders Data Report', s: 'Monthly orders from 15 brands across 11 regions, reconciled and mapped to one structure.', q: 'What did we book, by brand, region and account, on one consistent basis?', who: 'Executive leadership through sales owners', how: 'Automated reconciliation and field mapping; exact and fuzzy entity matching', stars: 3, bars: [9, 8, 7, 6, 5, 4, 3] },
    { id: 'ddb', f: ['ecom'], t: 'Digital Business KPIs', s: 'Retention, churn, new vs. existing accounts, repeat-SKU behavior, digital-to-distributor shift.', q: 'Is the digital business growing on its own, and are we keeping the customers we win?', who: 'Digitally Driven Business manager, e-commerce and marketing', how: 'Cohort and retention measures in DAX; customer-level segmentation', stars: 2, bars: [3, 4, 5, 5, 6, 7, 8] },
    { id: 'sku', f: ['ecom', 'sales'], t: 'SKU Analysis', s: 'When distributors list our SKUs, how they stock them, which SKUs are rising or falling.', q: 'Which SKUs are moving, where, and which distributors are behind?', who: 'Broadline manager and VP', how: 'Distributor listing and stocking data joined to sales; trend and rank measures', stars: 2, bars: [6, 3, 7, 4, 8, 5, 6] },
    { id: 'terr', f: ['sales', 'ecom'], t: 'Territory Heatmaps', s: 'Each sales owner\'s territory on a map, from country to state to city, with customer performance.', q: 'Where in my territory is the growth, and which customers drive it?', who: 'Key account managers, sales owners, DDB managers', how: 'Map visuals with a geographic hierarchy; owner-level filtering', stars: 3, bars: [4, 6, 8, 5, 3, 7, 9] },
    { id: 'pvm', f: ['product', 'exec'], t: 'Price-Volume-Mix', s: 'A bridge showing how price, volume, mix and other factors explain YoY and QoQ change.', q: 'Did we grow because we sold more, charged more, or sold different things?', who: 'Chief Product Officer and Product VPs', how: 'Bridge visuals; decomposition measures in DAX', stars: 3, bars: [6, 7, 5, 8, 6, 9, 8] },
    { id: 'backlog', f: ['exec'], t: 'Future Backlog Waterfall', s: 'How expected shipments for coming months are shaping up against budget as orders arrive.', q: "Are next month's invoices on track before the month starts?", who: 'President', how: 'Waterfall of scheduled shipments vs. budget by month', stars: 2, bars: [2, 3, 4, 5, 6, 7, 9] },
    { id: 'sip', f: ['sales'], t: 'Sales Incentive Performance', s: 'Each plan participant against QTD and YTD budget, with growing and declining customers.', q: 'Am I on plan, and which of my customers need attention?', who: 'Sales people and their managers', how: 'Participant-level attainment measures; growth and decline lists', stars: 2, bars: [8, 6, 9, 5, 7, 4, 6] },
  ];
  const stars = n => [0,1,2].map(i => `<svg viewBox="0 0 8 8" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:4px;opacity:${i < n ? 1 : .25}">${sprite(ICONS.star)}</svg>`).join('');
  $('#levels').innerHTML = LEVELS.map((l, i) => `<button class="panel g lvl" data-i="${i}" data-f="${l.f.join(' ')}"><div class="top"><b>Level 1-${i + 1}</b><span>Cleared</span></div><div class="icon">${l.bars.map(h => `<i style="height:${h * 10}%"></i>`).join('')}</div><h3>${l.t}</h3><p>${l.s}</p><div class="stars">${stars(l.stars)}</div></button>`).join('');
  $$('.filters [data-f]').forEach(ch => ch.addEventListener('click', () => { $$('.filters [data-f]').forEach(c => c.setAttribute('aria-pressed', 'false')); ch.setAttribute('aria-pressed', 'true'); const f = ch.dataset.f; $$('.lvl').forEach(l => l.classList.toggle('hide', f !== 'all' && !l.dataset.f.split(' ').includes(f))); }));
  const modal = $('#modal'); let cur = 0, lastFocus = null;
  const openCard = i => { cur = (i + LEVELS.length) % LEVELS.length; const l = LEVELS[cur]; $('#cLvl').textContent = 'Level 1-' + (cur + 1) + ' · cleared'; $('#cStars').innerHTML = stars(l.stars); $('#cTitle').textContent = l.t; $('#cDesc').textContent = l.s; $('#cQ').textContent = l.q; $('#cWho').textContent = l.who; $('#cHow').textContent = l.how; modal.classList.add('open'); document.body.classList.add('lock'); $('#cClose').focus(); unlock('level_select'); gain('level', 'Opened a level card'); };
  const closeCard = () => { modal.classList.remove('open'); document.body.classList.remove('lock'); if (lastFocus) lastFocus.focus(); };
  $('#levels').addEventListener('click', e => { const b = e.target.closest('.lvl'); if (!b) return; lastFocus = b; openCard(+b.dataset.i); });
  $('#cClose').addEventListener('click', closeCard); $('#cPrev').addEventListener('click', () => openCard(cur - 1)); $('#cNext').addEventListener('click', () => openCard(cur + 1));
  modal.addEventListener('click', e => { if (e.target === modal) closeCard(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (modal.classList.contains('open')) closeCard(); menu.classList.remove('open'); } });

  /* ---------- boss fight ---------- */
  const moves = $$('#moves .move'), log = $('#log'), hp = $('#hp'), hpTxt = $('#hpTxt'), bossState = $('#bossState');
  const DMG = [14, 16, 8, 12, 12, 6]; let fighting = false, fought = false;
  const line = (txt, cls = '') => { const d = document.createElement('div'); d.className = cls; d.textContent = txt; log.appendChild(d); log.scrollTop = log.scrollHeight; };
  const wait = ms => new Promise(r => setTimeout(r, RM ? 0 : ms));
  async function fight() { if (fighting) return; fighting = true; log.innerHTML = ''; moves.forEach(m => m.classList.remove('on')); hp.classList.remove('dead'); let h = 72; hp.querySelector('i').style.width = '100%'; hpTxt.textContent = '72h / 72h'; bossState.textContent = 'Encounter';
    line('> A wild MONTH-END appears. HP 72h.', 'm'); await wait(700); line('> Three regions. Eleven sub-regions. Sixty-five people waiting.'); await wait(900);
    for (let i = 0; i < moves.length; i++) { moves[i].classList.add('on'); const name = moves[i].querySelector('b').textContent; h -= DMG[i]; hp.querySelector('i').style.width = (h / 72 * 100) + '%'; hpTxt.textContent = h + 'h / 72h'; line(`> ${name}! ${DMG[i]}h of manual work removed.`, 'y'); sfx.hit(); if (!RM) { document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 300); } await wait(850); }
    hp.classList.add('dead'); bossState.textContent = 'Defeated'; line('> MONTH-END defeated. 4h remaining, and it is all analysis.', 'w'); await wait(500); line('> Reward: 3 decks, 6 analysis packs, 3 workbooks on SharePoint by lunch.', 'm'); sfx.win(); fighting = false; if (!fought) { fought = true; unlock('boss_slain'); } }
  $('#fightBtn').addEventListener('click', fight);
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting && title.classList.contains('off')) { fight(); o.disconnect(); } }, { threshold: .12 }).observe($('#arena'));

  /* ---------- skill tree ---------- */
  const BR = [
    { x: 150, c: 'g', nodes: [['Power BI', 'Persistent 2023, then DwyerOmega'], ['DAX', 'DwyerOmega 2025: variance, time intelligence'], ['Semantic models', 'SAP-fed enterprise models'], ['Bridges & waterfalls', 'PVM and backlog reports'], ['PL-300', 'Next unlock: Power BI Data Analyst Associate', 'next']] },
    { x: 450, c: 'c', nodes: [['SQL', 'Persistent 2021'], ['Python', 'Persistent 2021, automation at DwyerOmega 2025'], ['ETL & reconciliation', '~1M rows a month, every total tied'], ['Snowflake / AWS', 'UIUC 2024–25 projects'], ['SAP data', 'DwyerOmega 2025']] },
    { x: 750, c: 'm', nodes: [['Claude Code', 'DwyerOmega 2025'], ['Custom skills & plugins', '~200h/month for five analysts'], ['MCP', 'Power BI connectivity for Claude'], ['Agentic workflows', 'Quote follow-up, credit hold'], ['Lovable apps', '5+ applications in progress']] },
  ];
  const tree = $('#tree'); const NW = 236, NH = 44, Y0 = 30, DY = 74;
  let svg = `<svg viewBox="0 0 900 470" role="img" aria-label="Skill tree"><g class="root node"><rect x="${450 - NW / 2}" y="${Y0}" width="${NW}" height="${NH}" rx="2"/><text x="450" y="${Y0 + 27}">ANALYTICS</text></g>`;
  BR.forEach(b => { svg += `<line class="lnk on" x1="450" y1="${Y0 + NH}" x2="${b.x}" y2="${Y0 + DY}"/>`; b.nodes.forEach((n, i) => { const y = Y0 + DY * (i + 1); const next = n[2] === 'next'; if (i > 0) svg += `<line class="lnk ${next ? '' : 'on'}" x1="${b.x}" y1="${y - DY + NH}" x2="${b.x}" y2="${y}"/>`; svg += `<g class="node ${next ? 'next' : 'on'}" data-t="${n[0]}" data-d="${n[1]}" tabindex="0"><rect x="${b.x - NW / 2}" y="${y}" width="${NW}" height="${NH}" rx="2"/><text x="${b.x}" y="${y + 19}">${n[0].toUpperCase()}</text><text class="lv" x="${b.x}" y="${y + 35}">${next ? 'LOCKED' : 'LV. MAX'}</text></g>`; }); });
  svg += '</svg><div class="tip" id="tip"></div>'; tree.innerHTML = svg;
  const tip = $('#tip');
  const showTip = (n, e) => { tip.innerHTML = `<b>${n.dataset.t}</b>${n.dataset.d}`; const r = tree.getBoundingClientRect(), nr = n.getBoundingClientRect(); tip.style.left = (nr.left - r.left + nr.width / 2 + tree.scrollLeft) + 'px'; tip.style.top = (nr.top - r.top + tree.scrollTop) + 'px'; tip.classList.add('show'); unlock('respec'); gain('skill', 'Inspected a skill node'); };
  $$('.node', tree).forEach(n => { n.addEventListener('mouseenter', e => showTip(n, e)); n.addEventListener('focus', e => showTip(n, e)); n.addEventListener('click', e => showTip(n, e)); n.addEventListener('mouseleave', () => tip.classList.remove('show')); n.addEventListener('blur', () => tip.classList.remove('show')); });

  /* ---------- career map ---------- */
  const SAVES = {
    pune: { slot: '01', city: 'Pune, India', yrs: '2017 – 2024', roles: [
      { logo: 'images/persi.png', fb: 'PS', t: 'Senior Analyst', o: 'Persistent Systems · 2021 – 2024 · promoted from Software Engineer and Data Analyst', b: ['Customer retention 82% to 94% through SQL/Python churn analysis and Tableau at-risk dashboards.', 'Support-case backlog down 93% with predictive maintenance models and real-time dashboards.', 'Customer satisfaction up 25% through feedback analytics and sentiment dashboards for leadership.'] },
      { logo: 'images/sppu.png', fb: 'SP', t: 'B.E. Computer Engineering', o: 'Savitribai Phule Pune University · 2017 – 2021 · GPA 3.74', b: ['President of the college entrepreneurship cell, 2018 – 2020.'] }] },
    champaign: { slot: '02', city: 'Champaign, IL', yrs: '2024 – 2025', roles: [
      { logo: 'images/uiuc.png', fb: 'UI', t: 'M.S. Technology Management', o: 'University of Illinois Urbana-Champaign · Business Data Analytics · GPA 4.00 · STEM', b: ['Data science and analytics, big data infrastructure, business intelligence, data storytelling, project management.'] },
      { logo: 'images/qstn.png', fb: 'Q', t: 'Data Analyst', o: 'QSTN LLC · May – Aug 2025', b: ['User sign-ups up 37% and engagement up 40% through Python behavioral analysis and A/B tests.', 'Retention up 52% with predictive segmentation and Power BI dashboards that accelerated launch by three weeks.'] },
      { logo: 'images/giesuiuc.png', fb: 'GI', t: 'Course Assistant', o: 'Gies College of Business · Sep 2025 – now', b: ['MBA analytics, project management, operations and finance coursework.'] }] },
    austin: { slot: '03', city: 'Austin, TX', yrs: '2025 – now', roles: [
      { logo: 'images/dwyeromega.png', fb: 'DO', t: 'Data Science Engineer, Commercial Excellence', o: 'DwyerOmega · Sep 2025 – now', b: ['Lead commercial analytics and Power BI reporting for 15 brands and 11 regions; 60+ leaders use the suite.', 'Own DAX measure definitions across the suite on SAP-fed semantic models.', 'Month-end automation: 3 days to 4 hours for ~65 recipients; ~1M orders rows reconciled monthly.', 'Claude skills and plugins behind ~200 saved hours a month; building 5+ AI applications.'] }] },
  };
  const ORDER = ['pune', 'champaign', 'austin'];
  const world = $('#world');
  world.innerHTML = `
    <path class="land" d="M40 80 L120 60 L200 70 L260 100 L250 160 L200 200 L190 250 L150 270 L100 250 L60 200 L30 150 Z"/>
    <path class="land" d="M470 120 L520 100 L580 120 L600 170 L570 220 L530 260 L500 240 L480 190 L460 160 Z"/>
    <path class="land" d="M290 60 L400 40 L470 70 L450 110 L380 120 L320 110 Z"/>
    <polyline class="route" points="530,180 220,80 150,200"/>
    <g class="pin" data-k="pune"><circle cx="530" cy="180" r="12"/><text x="530" y="214">PUNE</text><text class="yr" x="530" y="230">2017–24</text></g>
    <g class="pin" data-k="champaign"><circle cx="220" cy="80" r="12"/><text x="220" y="56">CHAMPAIGN</text><text class="yr" x="220" y="114">2024–25</text></g>
    <g class="pin" data-k="austin"><circle cx="150" cy="200" r="12"/><text x="150" y="234">AUSTIN</text><text class="yr" x="150" y="250">2025–NOW</text></g>`;
  const save = $('#save');
  const loadSave = k => { const s = SAVES[k]; $$('.pin', world).forEach(p => p.classList.toggle('on', p.dataset.k === k)); const i = ORDER.indexOf(k);
    save.innerHTML = `<div class="slot"><span>Save ${s.slot} · ${s.city}</span><b>${s.yrs}</b></div>` + s.roles.map(r => `<div class="role"><div class="logo"><img src="${r.logo}" alt="" data-fb="${r.fb}"></div><div><h3>${r.t}</h3><span>${r.o}</span></div></div><ul>${r.b.map(x => `<li>${x}</li>`).join('')}</ul>`).join('') + `<div class="nav"><button class="pbtn ghost sm" data-go="${ORDER[(i + 2) % 3]}">&lt; Prev save</button><button class="pbtn y sm" data-go="${ORDER[(i + 1) % 3]}">Next save &gt;</button></div>`;
    fallbacks(save); state.saves.add(k); persist(); if (state.saves.size === 3) unlock('cartographer'); };
  world.addEventListener('click', e => { const p = e.target.closest('.pin'); if (p) loadSave(p.dataset.k); });
  save.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) loadSave(b.dataset.go); });
  loadSave('austin');

  /* ---------- image fallbacks + loot ---------- */
  function fallbacks(root = document) { $$('img[data-fb]', root).forEach(img => { const fb = () => { const box = img.parentElement; if (!box) return; box.classList.add('fb'); const rar = box.querySelector('.rar'); box.innerHTML = img.dataset.fb + (rar ? rar.outerHTML : ''); }; if (img.complete && img.naturalWidth === 0) fb(); else img.addEventListener('error', fb); }); }
  fallbacks();
  $$('[data-loot]').forEach(a => a.addEventListener('click', () => { state.loot++; persist(); gain('loot', 'Used an inventory item'); if (state.loot >= 3) unlock('loot_goblin'); }));

  /* ---------- Reconcile Rush ---------- */
  const cv = $('#gc'), cx = cv.getContext('2d'), ov = $('#gOv'), gScore = $('#gScore'), gTime = $('#gTime'), gBest = $('#gBest');
  let best = store.get('best') || 0; gBest.textContent = best;
  const G = { on: false, score: 0, t: 30, items: [], pops: [], px: 480, keys: {}, last: 0, spawn: 0, dif: 1 };
  const W = cv.width, H = cv.height, PW = 130, PH = 18;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const spawn = () => { const r = Math.random(); const kind = r < .62 ? 'tied' : r < .9 ? 'untied' : 'budget'; G.items.push({ kind, x: rnd(40, W - 40), y: -20, v: rnd(2.2, 3.4) * G.dif, w: kind === 'budget' ? 84 : kind === 'tied' ? 60 : 30, h: kind === 'budget' ? 14 : kind === 'tied' ? 26 : 30, n: kind === 'tied' ? (1000 + Math.floor(Math.random() * 8999)).toLocaleString() : kind === 'untied' ? '?' : 'BUDGET' }); };
  const pop = (x, y, txt, col) => G.pops.push({ x, y, txt, col, life: 1 });
  const pointer = e => { const r = cv.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; G.px = Math.max(PW / 2, Math.min(W - PW / 2, x / r.width * W)); };
  cv.addEventListener('mousemove', pointer); cv.addEventListener('touchmove', e => { pointer(e); e.preventDefault(); }, { passive: false }); cv.addEventListener('touchstart', pointer, { passive: true });
  addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { G.keys[e.key] = true; if (G.on) e.preventDefault(); } }); addEventListener('keyup', e => { G.keys[e.key] = false; });
  const draw = () => { cx.clearRect(0, 0, W, H);
    // grid backdrop
    cx.strokeStyle = 'rgba(46,230,255,.08)'; cx.lineWidth = 1; for (let x = 0; x < W; x += 40) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); } for (let y = 0; y < H; y += 40) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }
    // items
    G.items.forEach(it => { cx.fillStyle = it.kind === 'tied' ? '#3DFF75' : it.kind === 'untied' ? '#FF4D4D' : '#FFE45C'; cx.fillRect(it.x - it.w / 2, it.y - it.h / 2, it.w, it.h); cx.fillStyle = '#070A14'; cx.font = (it.kind === 'untied' ? '14px' : '9px') + ' "Press Start 2P"'; cx.textAlign = 'center'; cx.fillText(it.n, it.x, it.y + (it.kind === 'untied' ? 5 : 3)); });
    // paddle
    cx.fillStyle = '#E8F1FF'; cx.fillRect(G.px - PW / 2, H - 40, PW, PH); cx.fillStyle = '#070A14'; cx.font = '9px "Press Start 2P"'; cx.textAlign = 'center'; cx.fillText('POWER BI', G.px, H - 27);
    cx.fillStyle = '#2EE6FF'; cx.fillRect(G.px - PW / 2, H - 40 + PH, PW, 4);
    // pops
    G.pops.forEach(p => { cx.globalAlpha = p.life; cx.fillStyle = p.col; cx.font = '11px "Press Start 2P"'; cx.textAlign = 'center'; cx.fillText(p.txt, p.x, p.y); cx.globalAlpha = 1; }); };
  const step = (ts) => { if (!G.on) return; const dt = Math.min(40, ts - G.last) / 16.67; G.last = ts;
    if (G.keys.ArrowLeft) G.px = Math.max(PW / 2, G.px - 9 * dt); if (G.keys.ArrowRight) G.px = Math.min(W - PW / 2, G.px + 9 * dt);
    G.spawn -= dt; if (G.spawn <= 0) { spawn(); G.spawn = Math.max(14, 34 - (30 - G.t) * .7); }
    G.items.forEach(it => it.y += it.v * dt);
    G.items = G.items.filter(it => { if (it.y > H + 30) return false; const hit = it.y + it.h / 2 >= H - 40 && it.y - it.h / 2 <= H - 40 + PH && Math.abs(it.x - G.px) < PW / 2 + it.w / 2 - 8; if (!hit) return true;
      if (it.kind === 'tied') { G.score += 10; pop(it.x, H - 56, '+10', '#3DFF75'); sfx.click(); } else if (it.kind === 'budget') { G.score += 30; pop(it.x, H - 56, '+30', '#FFE45C'); sfx.coin(); } else { G.score = Math.max(0, G.score - 15); pop(it.x, H - 56, '-15 UNTIED', '#FF4D4D'); sfx.hit(); if (!RM) { document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 300); } }
      gScore.textContent = G.score; return false; });
    G.pops.forEach(p => { p.y -= 1.2 * dt; p.life -= .02 * dt; }); G.pops = G.pops.filter(p => p.life > 0);
    draw(); requestAnimationFrame(step); };
  const endGame = () => { G.on = false; clearInterval(G.timer); ov.classList.remove('off'); const s = G.score; if (s > best) { best = s; store.set('best', best); gBest.textContent = best; }
    $('#gTitle').textContent = s >= 1000 ? 'Perfect reconciliation' : s >= 500 ? 'Reconciled!' : 'Run complete'; $('#gMsg').textContent = `Score ${s}. ${s >= 500 ? 'Achievement unlocked.' : 'Score 500 to unlock an achievement.'} Best ${best}.`; $('#gStart').textContent = 'Play again';
    gain('arcade', 'Finished a round of Reconcile Rush'); if (s >= 500) unlock('reconciled'); if (s >= 1000) unlock('high_score'); s >= 500 ? sfx.win() : sfx.lose(); };
  $('#gStart').addEventListener('click', () => { G.on = true; G.score = 0; G.t = 30; G.items = []; G.pops = []; G.spawn = 0; G.dif = 1; gScore.textContent = 0; gTime.textContent = 30; ov.classList.add('off'); G.last = performance.now(); requestAnimationFrame(step); clearInterval(G.timer); G.timer = setInterval(() => { G.t--; gTime.textContent = G.t; G.dif = 1 + (30 - G.t) / 24; if (G.t <= 0) endGame(); }, 1000); });
  draw();

  /* ---------- konami ---------- */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let kp = 0;
  addEventListener('keydown', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (k === KONAMI[kp]) { kp++; if (kp === KONAMI.length) { kp = 0; document.body.classList.add('god'); unlock('god_mode'); toast('God mode', '30 lives. Also, hire this person.', 'key'); } } else kp = (k === KONAMI[0]) ? 1 : 0; });

  /* ---------- form ---------- */
  const form = $('#contactForm'), status = $('#formStatus');
  form.addEventListener('submit', async e => { e.preventDefault(); status.className = 'status'; status.textContent = 'Sending invite…';
    try { const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } }); if (!res.ok) throw 0; form.reset(); status.className = 'status ok'; status.textContent = 'Invite sent. Reply within a day.'; unlock('recruiter'); sfx.win(); }
    catch { status.className = 'status err'; status.textContent = 'Connection lost. Email saurabhghumnar@gmail.com directly.'; } });
  $('#yr').textContent = new Date().getFullYear();
})();

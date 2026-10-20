/* Election Judge Field Guide app shell. Generic: all jurisdiction content comes from
   data/content.json and data/county-config.json. No network calls beyond same-origin precached files. */
'use strict';
(function () {
  const $ = (s) => document.querySelector(s);
  const view = $('#view');
  let C = null, CFG = null;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('ejfg:' + k)) ?? d; } catch (e) { return d; } },
                  set(k, v) { try { localStorage.setItem('ejfg:' + k, JSON.stringify(v)); } catch (e) {} } };

  /* ---------- theming (design-spec §7) ---------- */
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lum = (h) => { const c = hex(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v * t + hex(b)[i] * (1 - t)).toString(16).padStart(2, '0')).join('');
  function isDark() { const t = document.documentElement.dataset.theme; return t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches); }
  function applyTheme() {
    if (!CFG) return;
    const dark = isDark(), acc = dark ? (CFG.accentDark || CFG.accent) : CFG.accent;
    const on = ratio(acc, '#FFFFFF') >= ratio(acc, '#0F1318') ? '#FFFFFF' : '#0F1318';
    const r = document.documentElement.style;
    r.setProperty('--accent', acc); r.setProperty('--on-accent', on); r.setProperty('--focus', acc);
    r.setProperty('--accent-soft', dark ? mix(acc, '#0F1318', 0.2) : mix(acc, '#F7F8FA', 0.1));
    document.querySelector('meta[name=theme-color]').content = dark ? '#0F1318' : '#F7F8FA';
  }
  function initTheme() {
    const t = store.get('theme', 'auto'); if (t !== 'auto') document.documentElement.dataset.theme = t;
    $('#themeBtn').onclick = () => {
      const order = ['auto', 'light', 'dark']; const n = order[(order.indexOf(store.get('theme', 'auto')) + 1) % 3];
      store.set('theme', n); if (n === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = n;
      $('#themeBtn').setAttribute('aria-label', 'Theme: ' + n); applyTheme();
    };
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  }

  /* ---------- helpers ---------- */
  /* Citation = a page in the printed Election Judge Manual (printed footer numbers).
     Full form: book icon + "Source: Election Judge Manual, p. 10". Compact form (buttons/link cards):
     book icon + "Manual p. 10" / "Manual pp. 151–164". Screen readers always hear "Election Judge Manual, page 10". */
  const BOOK = '<svg class="cite-ic" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="16" height="16"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7h8M8 10.5h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  /* Visible text uses the short form ("p. 9", "pp. 151–164"); screen readers hear "page 9", "pages 151–164". */
  const longForm = (t) => t.replace(/\bpp\. /g, 'pages ').replace(/\bp\. /g, 'page ');
  const nw = (h) => h.replace(/\b(pp?\.|pages?) /g, '$1\u00A0').replace(/(\d+–\d+)/g, '<span class="nw">$1</span>');
  const cite = (c) => c ? `<span class="cite">${BOOK}<span aria-hidden="true"><span class="cite-lbl">Source:</span> ${nw(esc(c))}</span><span class="sr">Source: ${esc(longForm(c))}</span></span>` : '';
  /* Buttons/cards: visible "Manual p. 12" / "Manual pp. 151–164"; screen readers hear "Election Judge Manual, page 12". */
  const citeShort = (c) => c ? `<span class="cite short">${BOOK}<span aria-hidden="true">${nw(esc(c.replace(/^Election Judge Manual, /, 'Manual ')))}</span><span class="sr">${esc(longForm(c))}</span></span>` : '';
  /* Body text: "(Manual p. 80)" shown as-is; screen readers hear "Election Judge Manual, page 80". */
  const tx = (s) => esc(s).replace(/\(Manual ((?:pp?\.|pages?) [^)]+)\)/g, (_, r) => `(<span aria-hidden="true">Manual ${nw(r)}</span><span class="sr">Election Judge Manual, ${longForm(r)}</span>)`);
  function href(to) { if (to.startsWith('roles/')) return '#/' + to; return href0(to); }
  function href0(to) { if (to.startsWith('check:')) return '#/check/' + to.slice(6); if (to.startsWith('flow:')) return '#/flow/' + to.slice(5); return '#/s/' + to; }
  function titleOf(to) {
    if (to.startsWith('roles/')) return C.roles.sections.find((s) => 'roles/' + s.id === to).title;
    if (to.startsWith('check:')) return C.checklists[to.slice(6)].title;
    if (to.startsWith('flow:')) return C.flows[to.slice(5)].title;
    return C.screens[to].title;
  }
  function citeOf(to) {
    if (to.startsWith('roles/')) return C.roles.sections.find((s) => 'roles/' + s.id === to).cite;
    if (to.startsWith('check:')) return C.checklists[to.slice(6)].cite;
    if (to.startsWith('flow:')) return C.flows[to.slice(5)].cite;
    return C.screens[to].cite;
  }
  const linkCard = (to, label) => `<a class="card" href="${href(to)}">${esc(label || titleOf(to))}${citeShort(citeOf(to))}</a>`;
  function addrHtml() { const j = C.jurisdiction; return `<div class="card">Official county contact (from the manual):<br>${j.address.map(esc).join('<br>')}<br><a href="tel:${esc(j.phone)}">${esc(j.phoneDisplay)}</a>${cite('Election Judge Manual, phone ' + j.phoneCite.replace(/^Election Judge Manual, /, '') + '; address ' + j.addressCite.replace(/^Election Judge Manual, /, ''))}</div>`; }
  function listHtml(items) { return `<ul>${items.map((i) => typeof i === 'string' ? `<li>${tx(i)}</li>` : `<li>${tx(i.text)}${listHtml(i.sub)}</li>`).join('')}</ul>`; }
  function block(b) {
    switch (b.t) {
      case 'p': return `<p>${tx(b.text)}</p>`;
      case 'h': return `<h3>${tx(b.text)}</h3>`;
      case 'list': return listHtml(b.items);
      case 'h4': return `<h4>${tx(b.text)}</h4>`;
      case 'cite': return cite(b.text);
      case 'steps': return `<ol class="steps">${b.items.map((i) => `<li>${tx(i)}</li>`).join('')}</ol>`;
      case 'alert': return `<div class="alert ${b.kind}" ${b.kind === 'critical' ? 'role="alert"' : ''}><b>${{ info: 'ⓘ ', warning: '⚠ ', critical: '⛔ ' }[b.kind]}${esc(b.title)}</b>${tx(b.text)}</div>`;
      case 'table': return `<table><thead><tr>${b.rows[0].map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${tx(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      case 'link': return linkCard(b.to, b.label);
      case 'addr': return addrHtml();
      case 'about': return aboutHtml();
    }
    return '';
  }
  function setTop(title, back) { $('#topTitle').textContent = title; $('#backBtn').hidden = !back; document.title = title === CFG.appName ? title : title + ' · ' + CFG.appName; }

  /* ---------- views ---------- */
  function quoteHtml() { const s = C.splash; return `<blockquote>\u201C${esc(s.quote)}\u201D</blockquote>${cite(s.cite)}`; }
  function home() {
    setTop(CFG.appName, false);
    view.innerHTML = `
      <a class="rolestile" href="#/roles" aria-label="${esc(C.splash.rolesLabel)}"><span>${esc(C.splash.rolesLabel)}</span><span class="chev" aria-hidden="true">›</span></a>
      <div class="tiles">${C.tabs.map((x) => `<a class="tile" href="#/phase/${x.id}">${esc(x.label)}</a>`).join('')}</div>
      ${linkCard('emergency', 'Emergency, weather, injury')}
      ${addrHtml()}
      <h3>Quick tools</h3>
      <div class="grid">${C.quickTools.map((q) => `<a class="card" href="${href(q.to)}">${esc(q.label)}${citeShort(q.cite)}</a>`).join('')}</div>
      <div class="footer"><a class="btn secondary" href="#/s/who-allowed">Who's allowed</a><a class="btn secondary" href="#/search">Search</a><a class="btn secondary" href="#/about">About</a></div>`;
  }
  function phase(id) {
    const t = C.tabs.find((x) => x.id === id); if (!t) return notFound();
    store.set('tab', id); setTop(t.label, true);
    view.innerHTML = `<h2>${esc(t.label)}</h2>${t.items.map((i) => linkCard(i)).join('')}`;
  }
  /* ---------- phases sheet ---------- */
  let sheetOpener = null;
  function openSheet() {
    sheetOpener = document.activeElement;
    $('#sheetBody').innerHTML = C.tabs.map((x) => `<a class="btn secondary" href="#/phase/${x.id}">${esc(x.label)}</a>`).join('') +
      `<p class="crumbs">Official number, DuPage County Clerk Election Division: <a href="tel:${esc(CFG.phone)}">${esc(CFG.phoneDisplay)}</a></p>`;
    $('#sheet').hidden = false; $('#backdrop').hidden = false; $('#navPhases').setAttribute('aria-expanded', 'true');
    $('#sheetClose').focus();
  }
  function closeSheet() {
    if ($('#sheet').hidden) return;
    $('#sheet').hidden = true; $('#backdrop').hidden = true; $('#navPhases').setAttribute('aria-expanded', 'false');
    if (sheetOpener && sheetOpener.focus) sheetOpener.focus();
  }
  function initNav() {
    $('#navPhases').onclick = openSheet; $('#sheetClose').onclick = closeSheet; $('#backdrop').onclick = closeSheet;
    $('#sheetBody').addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) closeSheet(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
    $('#navCall').href = 'tel:' + CFG.phone; $('#navCall').setAttribute('aria-label', 'Call the official DuPage County Clerk Election Division, ' + CFG.phoneDisplay);
  }
  function setActive() {
    const h = location.hash.replace(/^#\/?/, '');
    const home = !h; const ph = h.startsWith('phase/');
    $('#navHome').toggleAttribute('aria-current', false); $('#navPhases').toggleAttribute('aria-current', false); $('#navRoles').toggleAttribute('aria-current', false);
    if (home) $('#navHome').setAttribute('aria-current', 'page'); else if (ph) $('#navPhases').setAttribute('aria-current', 'page'); else if (h === 'roles' || h.startsWith('roles/')) $('#navRoles').setAttribute('aria-current', 'page');
  }
  /* ---------- splash: every cold launch, never auto-advances ---------- */
  function showSplash() {
    const s = C.splash;
    $('#splashTitle').textContent = s.heading;
    $('#splashQuote').innerHTML = `<h2>${esc(s.title)}</h2>${listHtml(s.conduct)}${cite(s.cite)}`;
    $('#splashGo').textContent = s.button;
    $('#splash').hidden = false; $('#splashGo').focus();
    $('#splashGo').onclick = () => { $('#splash').hidden = true; if (location.hash && location.hash !== '#/') location.hash = '#/'; else route(); view.focus({ preventScroll: true }); };
  }
  function screen(id) {
    const s = C.screens[id]; if (!s) return notFound();
    setTop(s.title, true);
    view.innerHTML = `<h2>${esc(s.title)}</h2>${s.blocks.map(block).join('')}${cite(s.cite)}`;
  }
  function checklist(id) {
    const c = C.checklists[id]; if (!c) return notFound();
    setTop(c.title, true);
    const done = store.get('check:' + id, []);
    const cur = c.items.findIndex((_, i) => !done.includes(i));
    view.innerHTML = `<h2>${esc(c.title)}</h2><p class="crumbs">${done.length} of ${c.items.length} done · check-offs stay on this device only</p>
      ${c.items.map((it, i) => `<div class="check ${done.includes(i) ? 'done' : ''} ${i === cur ? 'current' : ''}" role="checkbox" tabindex="0" aria-checked="${done.includes(i)}" ${i === cur ? 'aria-current="step"' : ''} data-i="${i}"><span class="n">${i + 1}</span><span class="tx">${tx(it)}</span><span class="c"><span>${done.includes(i) ? '✓' : ''}</span></span></div>`).join('')}
      ${cite(c.cite)}<button class="btn danger" id="reset">Reset checklist</button>`;
    view.querySelectorAll('.check').forEach((el) => { const tog = () => { const i = +el.dataset.i; const d = store.get('check:' + id, []); store.set('check:' + id, d.includes(i) ? d.filter((x) => x !== i) : d.concat(i)); checklist(id); }; el.onclick = tog; el.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tog(); } }; });
    $('#reset').onclick = () => { if (confirm('Reset all check-offs for this checklist?')) { store.set('check:' + id, []); checklist(id); } };
    const curEl = view.querySelector('.current'); if (curEl && done.length) curEl.scrollIntoView({ block: 'center' });
  }
  function flow(id, path) {
    const f = C.flows[id]; if (!f) return notFound();
    setTop(f.title, true);
    const steps = path ? path.split('.') : [];
    const node = steps.length ? steps[steps.length - 1] : f.start;
    const trail = [f.start].concat(steps.filter((s) => !s.startsWith('out:')).slice(0, -0 || undefined));
    const crumbs = [f.title].concat(steps.map((s) => s.startsWith('out:') ? 'Result' : (f.nodes[s] ? f.nodes[s].q.split(' ').slice(0, 3).join(' ') + '…' : s)));
    const base = '#/flow/' + id + '/';
    let html = `<p class="crumbs">${crumbs.map(esc).join(' › ')}</p>`;
    if (node.startsWith('out:')) {
      const o = f.outcomes[node.slice(4)];
      html += `<div class="card outcome"><h3>Do this</h3><p>${tx(o.text)}</p>${cite(o.cite)}</div>`;
      if (o.to) html += `<a class="btn primary" href="${href(o.to)}">Open: ${esc(titleOf(o.to))}</a>`;
      if (o.call) html += `<a class="btn secondary" href="tel:${esc(CFG.phone)}">Call ${esc(CFG.phoneDisplay)}</a>`;
    } else {
      const n = f.nodes[node];
      html += `<div class="card"><h3>${esc(n.q)}</h3>${n.help ? `<p>${tx(n.help)}</p>` : ''}${cite(n.cite)}</div>
        <div class="qa">${n.a.map(([label, to]) => `<a class="btn secondary" href="${base}${steps.concat(to).join('.')}">${esc(label)}</a>`).join('')}</div>`;
    }
    html += `<a class="btn text" href="#/flow/${id}">Start over</a>`;
    view.innerHTML = html; void trail;
  }
  function textOf(obj) { return JSON.stringify(obj).replace(/"[a-z]+":/g, ' ').toLowerCase(); }
  function search() {
    setTop('Search', true);
    view.innerHTML = `<h2>Search</h2><input class="search" id="q" type="search" placeholder="e.g. provisional, seal, ID" aria-label="Search"><div id="res"></div>`;
    const items = Object.keys(C.screens).map((k) => [k, C.screens[k]]).concat(Object.keys(C.checklists).map((k) => ['check:' + k, C.checklists[k]])).concat(Object.keys(C.flows).map((k) => ['flow:' + k, C.flows[k]]));
    items.push(...C.roles.sections.map((s) => ['roles/' + s.id, s]));
    const q = $('#q'); q.oninput = () => { const v = q.value.trim().toLowerCase(); $('#res').innerHTML = v.length < 2 ? '' : items.filter(([, o]) => textOf(o).includes(v)).map(([k]) => linkCard(k)).join('') || '<p>No matches.</p>'; };
    q.focus();
  }
  function aboutHtml() {
    const j = C.jurisdiction;
    return `<div class="alert warning"><b>⚠ Unofficial guide</b>${esc(C.notice)}</div>
      <p><b>Source:</b> ${esc(j.manual)}. Every screen cites the manual page it comes from, using the page numbers printed at the bottom of each manual page.</p>
      <p><b>Election type:</b> ${esc(j.electionType)} — no party selection (primary-only steps are hidden).</p>
      <p><b>Privacy:</b> works fully offline; no accounts, analytics, location or network calls. Checklist check-offs are saved only on this device and can be reset. The app never holds codes, seal numbers, key locations, or voter/judge names.</p>
      <h3>Not covered</h3><ul>${C.flags.excluded.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>Refresh each election</h3><ul>${C.flags.timeSensitive.map((x) => `<li>${tx(x)}</li>`).join('')}</ul>
      <h3>Varies by precinct</h3><ul>${C.flags.precinctLocal.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p>Template: jurisdiction content lives in content.json and county-config.json.</p>
      <button class="btn secondary" id="resetAll">Reset all checklists</button>`;
  }
  function rolesMenu() {
    const R = C.roles; setTop(R.title, false);
    view.innerHTML = `<h2>${esc(R.title)}</h2>${R.intro.map(block).join('')}${cite(R.introCite)}
      <nav aria-label="Roles sections">${R.sections.map((s) => `<a class="card rolelink" href="#/roles/${s.id}"><span>${esc(s.title)}</span>${citeShort(s.cite)}</a>`).join('')}</nav>${cite(R.cite)}`;
  }
  function roleDetail(id) {
    const s = C.roles.sections.find((x) => x.id === id); if (!s) return notFound();
    setTop(s.title, true);
    view.innerHTML = `<a class="btn text backroles" href="#/roles">\u2039 Roles menu</a><h2>${esc(s.title)}</h2>${s.blocks.map(block).join('')}${cite(s.cite)}<a class="btn secondary" href="#/roles">Back to Roles</a>`;
  }
  function notFound() { setTop('Not found', true); view.innerHTML = '<p>Page not found.</p><a class="btn primary" href="#/">Home</a>'; }

  function route() {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    closeSheet();
    if (!h[0]) home(); else if (h[0] === 'phase') phase(h[1]); else if (h[0] === 'roles') (h[1] ? roleDetail(h[1]) : rolesMenu()); else if (h[0] === 's') screen(h[1]); else if (h[0] === 'check') checklist(h[1]);
    else if (h[0] === 'flow') flow(h[1], h[2]); else if (h[0] === 'search') search(); else if (h[0] === 'about') screen('about'); else notFound();
    const ra = $('#resetAll'); if (ra) ra.onclick = () => { if (confirm('Reset all checklists?')) Object.keys(C.checklists).forEach((k) => store.set('check:' + k, [])); };
    setActive(); window.scrollTo(0, 0); if ($('#splash').hidden) view.focus({ preventScroll: true });
  }

  async function boot() {
    initTheme();
    [C, CFG] = await Promise.all([fetch('data/content.json').then((r) => r.json()), fetch('data/county-config.json').then((r) => r.json())]);
    initNav();
    applyTheme();
    $('#backBtn').onclick = () => history.length > 1 ? history.back() : (location.hash = '#/');
    addEventListener('hashchange', route); route(); showSplash();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  boot().catch((e) => { view.innerHTML = '<p>Could not load content. ' + esc(e.message) + '</p>'; });
})();

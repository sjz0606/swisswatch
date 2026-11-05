import { CATALOG, FILTERS } from './catalog.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const isMobile = () => innerWidth <= 760;
const TG = 'https://t.me/SwissWatch_admin';
const lang = () => (html.classList.contains('ru') ? 'ru' : 'uz');
const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- til ---------- */
function setLang(l) {
  html.classList.remove('uz', 'ru'); html.classList.add(l); html.lang = l;
  try { localStorage.setItem('sw-lang', l); } catch {}
  renderFilters(); renderGrid(); renderReels(); refreshCfg();
  $('.lang').setAttribute('aria-label', l === 'ru' ? 'Язык' : 'Til');
  $('#gl').setAttribute('aria-label', l === 'ru' ? '3D-модель часов West End Watch Automatic' : 'West End Watch Automatic soatining 3D modeli');
  $('#mdx').setAttribute('aria-label', l === 'ru' ? 'Закрыть' : 'Yopish');
  $('.ft nav').setAttribute('aria-label', l === 'ru' ? 'Контакты' : 'Aloqa');
  document.title = l === 'ru' ? 'SwissWatch — часовой бутик с 2002 года. Ташкент, Наманган' : 'SwissWatch — soatlar butigi, 2002 yildan. Toshkent, Namangan';
  if (window.ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh());
}
$$('.lang button').forEach(b => b.onclick = () => setLang(b.dataset.l));

/* ---------- jonli soat matni ---------- */
const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const clockEl = $('#clock');
setInterval(() => { clockEl.textContent = clockFmt.format(new Date()); }, 1000);
clockEl.textContent = clockFmt.format(new Date());

/* ---------- brendlar lentasi ---------- */
const BR = ['West End Watch Co.', 'Tsar Bomba', 'Frederique Constant', 'Jacques Philippe', 'Tissot', 'Roamer', 'Rado', 'Certina', 'Maurice Lacroix', 'Raymond Weil', 'Saint Honoré', 'Cerruti 1881', 'Swiss Military', 'Breitling', 'Hublot', 'Rolex', 'Cartier', 'Seiko', 'Orient', 'Citizen'];
$('#mq').innerHTML = [...BR, ...BR].map(b => `<span>${b}</span><em>+</em>`).join('');

/* ---------- vitrina ---------- */
let filter = 'all';
const tagText = { best: { uz: 'Bestseller', ru: 'Бестселлер' }, new: { uz: 'Yangi', ru: 'Новинка' }, ltd: { uz: 'Limited', ru: 'Limited' } };
const priceText = (c, l) => {
  if (c.price) return c.cur ? `${c.price} ${l === 'ru' ? 'сум' : 'so‘m'}` : c.price;
  if (c.from) return l === 'ru' ? `от ${c.from}` : `${c.from} dan`;
  return null;
};
const askUrl = (c, l) => TG + '?text=' + encodeURIComponent(l === 'ru'
  ? `Здравствуйте! Интересуют часы ${c.brand} ${c[l]}. Есть в наличии?`
  : `Assalomu alaykum! ${c.brand} ${c[l]} soati qiziqtiryapti. Sotuvda bormi?`);

function renderFilters() {
  const l = lang();
  $('#fl').innerHTML = FILTERS.map(f => `<button data-k="${f.k}" aria-pressed="${f.k === filter}">${f[l]}</button>`).join('');
  $$('#fl button').forEach(b => b.onclick = () => { filter = b.dataset.k; renderFilters(); renderGrid(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
}
function renderGrid() {
  const l = lang();
  const list = CATALOG.filter(c => filter === 'all' || c.g.split(' ').includes(filter));
  $('#grid').innerHTML = list.map(c => {
    const p = priceText(c, l), t = c.tag && tagText[c.tag][l];
    return `<button class="card" data-id="${c.id}">
      <div class="ph">${t ? `<span class="badge">${t}</span>` : ''}
        <img src="assets/p/${c.id}.jpg" alt="${c.brand} ${c[l]}" loading="lazy" decoding="async" width="600" height="750">
        ${c.v ? `<span class="playi"><svg><use href="#i-play"/></svg></span>` : ''}</div>
      <div class="br">${c.brand}</div><h3>${c[l]}</h3>
      <div class="sp">${l === 'ru' ? c.sr : c.su}</div>
      <div class="pc ${p ? '' : 'ask'}">${p || (l === 'ru' ? 'Цена по запросу' : 'Narxini so‘rang')}</div>
    </button>`;
  }).join('');
  $$('.card').forEach(el => {
    const c = CATALOG.find(x => x.id == el.dataset.id);
    el.onclick = () => openModal(c);
    if (c.v && matchMedia('(hover:hover)').matches) {
      let v;
      el.onmouseenter = () => {
        if (!v) { v = Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, src: `assets/v/${c.id}.mp4`, preload: 'auto' }); $('.ph', el).insertBefore(v, $('.playi', el)); }
        v.currentTime = 0; v.play().then(() => el.classList.add('play')).catch(() => {});
      };
      el.onmouseleave = () => { el.classList.remove('play'); v && v.pause(); };
    }
  });
}

/* ---------- modal ---------- */
const md = $('#md');
let lastFocus = null;
function openModal(c) {
  const l = lang(); lastFocus = document.activeElement;
  const p = priceText(c, l);
  $('#mdv').innerHTML = c.v ? `<video src="assets/v/${c.id}.mp4" poster="assets/p/${c.id}.jpg" autoplay muted loop playsinline></video>` : `<img src="assets/p/${c.id}.jpg" alt="">`;
  $('#mdc').innerHTML = `<div class="br" style="font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--mute)">${c.brand}</div>
    <h3>${c[l]}</h3><p class="sp">${l === 'ru' ? c.sr : c.su}</p>
    <div class="pc">${p || (l === 'ru' ? 'Цена по запросу' : 'Narxini so‘rang')}</div>
    <div class="act">
      <a class="btn red" href="${askUrl(c, l)}" target="_blank" rel="noopener"><svg class="i"><use href="#i-tg"/></svg>${l === 'ru' ? 'Спросить в Telegram' : 'Telegramda so‘rash'}</a>
      <a class="btn line" href="tel:+998885007000"><svg class="i"><use href="#i-tel"/></svg>+998 88 500 70 00</a>
    </div>`;
  md.classList.add('on'); lenis && lenis.stop(); $('#mdx').focus();
}
function closeModal() { md.classList.remove('on'); $('#mdv').innerHTML = ''; lenis && lenis.start(); lastFocus && lastFocus.focus(); }
$('#mdx').onclick = closeModal;
md.addEventListener('click', e => { if (e.target === md) closeModal(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && md.classList.contains('on')) closeModal(); });

/* ---------- videolar ---------- */
const REELS = [
  { id: 1130, k: { uz: 'West End', ru: 'West End' }, uz: 'Yangi partiya butikka keldi', ru: 'Новая партия в бутике' },
  { id: 1179, k: { uz: 'Rolex', ru: 'Rolex' }, uz: 'Datejust, 2026 yangi', ru: 'Datejust, новые 2026' },
  { id: 1151, k: { uz: 'Tsar Bomba', ru: 'Tsar Bomba' }, uz: 'Karbon tolali 4 model', ru: '4 модели из карбона' },
  { id: 1101, k: { uz: 'Raymond Weil', ru: 'Raymond Weil' }, uz: 'Swiss kolleksiya', ru: 'Швейцарская коллекция' },
  { id: 1185, k: { uz: 'Tsar Bomba', ru: 'Tsar Bomba' }, uz: 'Exclusive, avtomatik', ru: 'Exclusive, автоподзавод' },
  { id: 1167, k: { uz: 'Omega × Swatch', ru: 'Omega × Swatch' }, uz: 'Swiss mexanizm, 2 yil kafolat', ru: 'Швейцарский механизм, гарантия 2 года' },
];
let reelIO;
function renderReels() {
  const l = lang();
  $('#rail').innerHTML = REELS.map(r => `<div class="reel"><video data-src="assets/v/${r.id}.mp4" muted loop playsinline preload="none" poster="assets/p/${r.id}.jpg"></video><p><small>${r.k[l]}</small>${r[l]}</p></div>`).join('');
  reelIO && reelIO.disconnect();
  reelIO = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
  }), { threshold: .35 });
  $$('#rail video').forEach(v => reelIO.observe(v));
}

/* ---------- konfigurator ---------- */
const DN = {
  yashil: { uz: 'Yashil', ru: 'Зелёный', c: '#39493b', v: 1271 },
  shampan: { uz: 'Shampan', ru: 'Шампань', c: '#b89a6a', v: 1274 },
  tiffany: { uz: 'Tiffany', ru: 'Tiffany', c: '#6fc7c9', v: 1268 },
  kok: { uz: 'Ko‘k', ru: 'Синий', c: '#1f3f7a', v: 'kok' },
  qora: { uz: 'Qora', ru: 'Чёрный', c: '#17181b', v: 'qora' },
};
const cfg = { dial: 'yashil', band: 'jubilee', size: 41 };
let W = null;
function refreshCfg() {
  const l = lang();
  $('#dName').textContent = DN[cfg.dial][l];
  const msg = l === 'ru'
    ? `Здравствуйте! Интересуют West End Watch Automatic: циферблат ${DN[cfg.dial].ru}, браслет ${cfg.band === 'jubilee' ? 'Jubilee' : 'President'}, ${cfg.size} мм. Есть в наличии?`
    : `Assalomu alaykum! West End Watch Automatic qiziqtiryapti: ${DN[cfg.dial].uz} terish, ${cfg.band === 'jubilee' ? 'Jubilee' : 'President'} braslet, ${cfg.size} mm. Sotuvda bormi?`;
  $('#cfgAsk').href = TG + '?text=' + encodeURIComponent(msg);
  $('#sw').querySelectorAll('button').forEach(b => {
    b.setAttribute('aria-label', DN[b.dataset.v][l]);
    b.title = DN[b.dataset.v][l];
  });
}
$('#sw').innerHTML = Object.keys(DN).map(k => `<button data-v="${k}" style="--c:${DN[k].c}" aria-pressed="${k === cfg.dial}"></button>`).join('');
function setReal(k) {
  const v = $('#realV'); v.src = `assets/v/${DN[k].v}.mp4`; v.poster = `assets/p/${DN[k].v}.jpg`;
  if (cfgActive) v.play().catch(() => {});
}
let cfgActive = false;
$$('#sw button').forEach(b => b.onclick = () => {
  cfg.dial = b.dataset.v; W && W.setDial(cfg.dial); setReal(cfg.dial);
  $$('#sw button').forEach(x => x.setAttribute('aria-pressed', x === b)); refreshCfg();
});
$$('#segB button').forEach(b => b.onclick = () => {
  cfg.band = b.dataset.v; W && W.setBand(cfg.band);
  $$('#segB button').forEach(x => x.setAttribute('aria-pressed', x === b)); refreshCfg();
});
$$('#segS button').forEach(b => b.onclick = () => {
  cfg.size = +b.dataset.v; W && W.setSize(cfg.size);
  $$('#segS button').forEach(x => x.setAttribute('aria-pressed', x === b)); refreshCfg();
});

/* ---------- silliq scroll ---------- */
gsap.registerPlugin(ScrollTrigger);
let lenis = null;
if (!reduced && !matchMedia('(pointer:coarse)').matches && window.Lenis) {
  lenis = new Lenis({ lerp: .1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const h = a.getAttribute('href'); const el = h.length > 1 && $(h); if (!el) return;
  e.preventDefault();
  let y = el.getBoundingClientRect().top + scrollY;
  if (h === '#tanlash') y -= innerHeight;      // konfigurator 3D sahnaning oxirida
  if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
}));

/* ---------- 3D hikoya ---------- */
async function start3D() {
  let createWatch;
  try { ({ createWatch } = await import('./watch.js')); W = createWatch($('#gl'), { mobile: isMobile() }); window.__W = W; }
  catch (err) { console.warn('WebGL', err); $('.stage').style.background = 'center/cover url(assets/p/1271.jpg)'; $('#note3d').hidden = true; $('#hint').hidden = true; $('#story').style.height = '100vh'; $$('a[href="#tanlash"]').forEach(a => a.href = '#vitrina'); return; }

  const mob = isMobile();
  const V = mob ? [
    { rx: -.03, ry: -.28, rz: .04, x: 0, y: 1.25, cam: 12.5 },
    { rx: -.34, ry: -.56, rz: .14, x: .25, y: .86, cam: 7.4 },
    { rx: -.08, ry: Math.PI - .32, rz: -.05, x: 0, y: 1.1, cam: 9.6 },
    { rx: -.03, ry: Math.PI * 2 - .1, rz: 0, x: 0, y: 1.72, cam: 11.8 },
  ] : [
    { rx: -.06, ry: -.42, rz: .1, x: 2.15, y: 0, cam: 13.2 },
    { rx: -.38, ry: -.68, rz: .17, x: 1.62, y: -.1, cam: 6.9 },
    { rx: -.1, ry: Math.PI - .38, rz: -.06, x: 2.0, y: 0, cam: 9.8 },
    { rx: -.05, ry: Math.PI * 2 - .26, rz: .05, x: -2.2, y: 0, cam: 12.4 },
  ];
  Object.assign(W.state, V[0]);

  const tl = gsap.timeline({ defaults: { ease: 'power1.inOut' }, scrollTrigger: {
    trigger: '#story', start: 'top top', end: 'bottom bottom', scrub: reduced ? true : .6,
    onUpdate(self) {
      const p = self.progress;
      $('#c0').classList.toggle('on', p < .14);
      $('#tanlash-panel').classList.toggle('on', p > .8);
      const act = p > .76;
      if (act !== cfgActive) { cfgActive = act; const v = $('#realV'); if (act) { if (!v.src) setReal(cfg.dial); v.play().catch(() => {}); } else v.pause(); }
      $('#hint').style.opacity = p > .03 ? 0 : 1;
    },
  } });
  const S = W.state;
  gsap.set('#c0', { opacity: 1 });
  tl.to('#c0', { opacity: 0, y: mob ? 0 : -30, duration: .08 }, .07)
    .to(S, { ...V[1], duration: .23 }, .05)
    .fromTo('#c1', { opacity: 0, y: mob ? 10 : 30 }, { opacity: 1, y: 0, duration: .07 }, .17)
    .to('#c1', { opacity: 0, duration: .06 }, .32)
    .to(S, { ...V[2], rotorSpin: 2.6, duration: .24 }, .3)
    .fromTo('#c2', { opacity: 0, y: mob ? 10 : 30 }, { opacity: 1, y: 0, duration: .07 }, .46)
    .to('#c2', { opacity: 0, duration: .06 }, .6)
    .to(S, { ...V[3], rotorSpin: 5, duration: .2 }, .58)
    .fromTo('#tanlash-panel', { opacity: 0 }, { opacity: 1, duration: .08 }, .72)
    .to('#note3d', { opacity: .9, duration: .01 }, .99);

  ScrollTrigger.create({ trigger: '#story', start: 'top bottom', end: 'bottom top', onToggle: s => W.setVisible(s.isActive) });
}

/* ---------- header ---------- */
ScrollTrigger.create({ start: 40, end: 'max', onToggle: s => $('#hd').classList.toggle('solid', s.isActive) });
['#vitrina', '#butik'].forEach(sel => ScrollTrigger.create({ trigger: sel, start: 'top 60', end: 'bottom 60', toggleClass: { targets: '#hd', className: 'light' } }));

/* ---------- ishga tushirish ---------- */
let saved = 'uz'; try { saved = localStorage.getItem('sw-lang') || 'uz'; } catch {}
setLang(saved === 'ru' ? 'ru' : 'uz');
if (!reduced) gsap.utils.toArray('.sech').forEach(el => gsap.from(el, { opacity: 0, y: 26, duration: .8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
start3D();

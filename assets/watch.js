// SwissWatch — West End Watch Co. Automatic (Day-Date uslubi) ning kodda qurilgan 3D modeli.
// Birlik: 1 = 10 mm. Old tomon +Z, soat 12 +Y.
import * as THREE from 'three';
import { RoundedBoxGeometry } from './lib/RoundedBoxGeometry.js';

export const DIALS = {
  shampan: { base: '#b89a6a', edge: '#6d5532', ink: '#2a1f12', metal: .85, rough: .34 },
  yashil:  { base: '#39493b', edge: '#141d17', ink: '#e8e4d6', metal: .85, rough: .33 },
  tiffany: { base: '#6fc7c9', edge: '#3f9aa0', ink: '#16282b', metal: .55, rough: .36 },
  kok:     { base: '#1f3f7a', edge: '#0a1630', ink: '#eef0f4', metal: .85, rough: .32 },
  qora:    { base: '#17181b', edge: '#050506', ink: '#efece4', metal: .8,  rough: .3 },
};

const R = 2.05;                     // korpus radiusi (41 mm)
const TAU = Math.PI * 2;
const ZA = new THREE.Vector3(0, 0, 1);

function lathe(points, seg = 128) {
  // profil: [r, z] → Z o'qi atrofida
  const g = new THREE.LatheGeometry(points.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

function smoothProfile(pts, steps = 6) {
  // CatmullRom bilan silliqlash (burchaklar kerak bo'lmagan joylar uchun)
  const c = new THREE.CatmullRomCurve3(pts.map(([r, z]) => new THREE.Vector3(r, z, 0)), false, 'centripetal');
  return c.getPoints(pts.length * steps).map(v => [Math.max(v.x, 0), v.y]);
}

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

// Studiya yorug'ligi: butikdagi kabi iliq yog'och va yumshoq lampalar — metall aks ettiradigan muhit
function studioEnv(renderer) {
  const s = new THREE.Scene();
  s.background = new THREE.Color('#0b0806');
  const panel = (w, h, col, I, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(I), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(12, 4, '#fff6e8', 9, [0, 11, 7]);         // tepa softbox
  panel(2.4, 16, '#ffffff', 11, [-12, 1, 6]);    // chap chiziq
  panel(1, 16, '#ffe9cf', 16, [11, 3, 5]);       // o'ng ingichka chiziq
  panel(10, 3, '#ffd9b0', 4, [3, -9, 8]);        // pastdan iliq
  panel(30, 12, '#4a2715', 1.1, [0, -13, -2]);   // yong'oq yog'ochi aksi
  panel(4, 4, '#ffffff', 3, [2, 3, 16]);         // old yumshoq
  panel(14, 7, '#fff1de', 7, [0, 5, -14]);       // orqa tomon yorug'i (mexanizm uchun)
  panel(2, 14, '#ffffff', 9, [10, 0, -9]);       // orqa chiziq
  for (let i = 0; i < 7; i++) panel(.5, 8, '#fff', 8, [-9 + i * 3, 7, -9]); // vitrina lampalari
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, .035);
  pm.dispose();
  return rt.texture;
}

// Radial (sunray) terish: chiziqlar markazdan chetga, yorug'lik "kapalak" bo'lib aylanadi
function makeSunrayNormal(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); const d = x.createImageData(size, size);
  const N = 1440; const noise = new Float32Array(N);
  for (let i = 0; i < N; i++) noise[i] = (Math.random() - .5);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const u = i / size - .5, v = j / size - .5;
    const a = Math.atan2(v, u);
    const k = ((a + Math.PI) / TAU * N) | 0;
    const m = noise[k % N] * .5 + noise[(k * 7 + 3) % N] * .22;
    const tx = -Math.sin(a) * m, ty = Math.cos(a) * m;
    const o = (j * size + i) * 4;
    d.data[o] = (tx * .5 + .5) * 255;
    d.data[o + 1] = (-ty * .5 + .5) * 255;
    d.data[o + 2] = 255; d.data[o + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  return t;
}

function makeBrushed(w, h, vertical = true) {
  // cho'tkalangan metall uchun chiziqli normal xarita
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); const d = x.createImageData(w, h);
  const line = new Float32Array(vertical ? w : h).map(() => Math.random() - .5);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const n = line[vertical ? i : j] + (Math.random() - .5) * .15;
    const o = (j * w + i) * 4;
    d.data[o] = vertical ? 128 + n * 60 : 128;
    d.data[o + 1] = vertical ? 128 : 128 + n * 60;
    d.data[o + 2] = 255; d.data[o + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function createWatch(canvas, { mobile = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(26, 1, .1, 200);
  camera.position.set(0, 0, 16);

  const key = new THREE.DirectionalLight('#fff4e2', 2.2); key.position.set(-4, 8, 9); scene.add(key);
  const rim = new THREE.DirectionalLight('#ffd9b0', 1.2); rim.position.set(7, -3, -5); scene.add(rim);

  const brushN = makeBrushed(256, 256, false);
  const steel = new THREE.MeshStandardMaterial({ color: '#d9d9d6', metalness: 1, roughness: .12 });
  const satin = new THREE.MeshStandardMaterial({ color: '#c6c6c2', metalness: 1, roughness: .24, normalMap: brushN, normalScale: new THREE.Vector2(.06, .06) });
  const gold = new THREE.MeshStandardMaterial({ color: '#f0c489', metalness: 1, roughness: .3, envMapIntensity: 1.7 });
  const lume = new THREE.MeshStandardMaterial({ color: '#efe9d8', roughness: .55 });
  const blackPol = new THREE.MeshStandardMaterial({ color: '#0d0d0f', metalness: .9, roughness: .3 });

  const watch = new THREE.Group();      // butun soat (scroll bilan aylanadi)
  const head = new THREE.Group();       // kalla (o'lcham uchun masshtablanadi)
  watch.add(head);
  scene.add(watch);

  /* ---------- KORPUS ---------- */
  const caseProfile = [
    [0, -.46], [1.45, -.46], [1.72, -.44], [1.9, -.34], [2.02, -.18],
    [2.05, .02], [2.05, .2], [2.0, .3], [1.9, .34], [1.78, .36],
  ];
  head.add(new THREE.Mesh(lathe(smoothProfile(caseProfile, 5), 160), satin));

  // Qirrali (fluted) bezel — geometriyaning o'zida o'yilgan
  {
    const flutes = 84, seg = flutes * (mobile ? 10 : 16), rings = 12;
    const pos = [], idx = [];
    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    for (let r = 0; r <= rings; r++) {
      const t = r / rings;
      for (let s = 0; s <= seg; s++) {
        const a = s / seg * TAU;
        const w = Math.abs(((a * flutes / TAU) % 1) - .5) * 2;          // uchburchak to'lqin
        const f = Math.pow(w, 1.25);
        const amp = ss(0, .1, t) * (1 - ss(.88, 1, t));                 // qirralar chetga yetib, keskin tugaydi
        const rr = 2.045 - t * .325;
        const z = .3 + Math.sin(t * Math.PI * .9) * .15 + f * amp * .05;
        pos.push(Math.cos(a) * rr, Math.sin(a) * rr, z);
      }
    }
    const row = seg + 1;
    for (let r = 0; r < rings; r++) for (let s = 0; s < seg; s++) {
      const p = r * row + s; idx.push(p, p + row, p + 1, p + 1, p + row, p + row + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    head.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#dededb', metalness: 1, roughness: .13, side: THREE.DoubleSide })));
  }

  // Ichki halqa (rehaut) va minut chizig'i
  head.add(new THREE.Mesh(lathe([[1.71, .4], [1.68, .38], [1.62, .2], [1.6, .17]], 128), steel));

  // Quloqlar (lugs): korpusdan o'sib chiqadi, braslet uchini quchoqlaydi
  {
    const s = new THREE.Shape();
    s.moveTo(.76, .8); s.lineTo(.76, 2.44);
    s.quadraticCurveTo(.77, 2.53, .88, 2.53);
    s.lineTo(1.0, 2.52);
    s.bezierCurveTo(1.16, 2.5, 1.42, 2.02, 1.62, 1.28);
    s.lineTo(1.4, .8); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: .4, bevelEnabled: true, bevelSegments: 6, bevelSize: .05, bevelThickness: .07, curveSegments: 24 });
    const p = g.attributes.position;
    // uchi pastga egiladi
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > 2) p.setZ(i, p.getZ(i) - (y - 2) * (y - 2) * .32); }
    g.computeVertexNormals();
    // Ko'zgu nusxalari: manfiy masshtabni three.js o'zi to'g'rilaydi (yuzlar teskari aylanadi)
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sy]) => {
      const a = new THREE.Mesh(g, satin); a.scale.set(sx, sy, 1); a.position.z = -.32; head.add(a);
    });
  }

  // Toj (crown) — o'yilgan chiziqlar bilan
  {
    const n = 180, g = new THREE.CylinderGeometry(.21, .21, .24, n, 1, false);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const a = Math.atan2(z, x), r = Math.hypot(x, z);
      if (r > .15 && Math.abs(y) < .13) {
        const k = 1 + .045 * Math.sign(Math.sin(a * 22));
        p.setX(i, x * k); p.setZ(i, z * k);
      }
    }
    g.computeVertexNormals();
    const c = new THREE.Mesh(g, steel); c.rotation.z = Math.PI / 2; c.position.set(2.19, 0, -.05); head.add(c);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.19, .21, .03, 48), steel);
    t.rotation.z = -Math.PI / 2; t.position.set(2.325, 0, -.05); head.add(t);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .1, 24), satin);
    stem.rotation.z = Math.PI / 2; stem.position.set(2.05, 0, -.05); head.add(stem);
  }

  /* ---------- TERISH (DIAL) ---------- */
  const sunN = makeSunrayNormal(mobile ? 768 : 1280);
  const dialMat = new THREE.MeshPhysicalMaterial({ color: '#fff', metalness: .85, roughness: .34, normalMap: sunN, normalScale: new THREE.Vector2(.42, .42), clearcoat: .22, clearcoatRoughness: .2, envMapIntensity: .78 });
  const dial = new THREE.Mesh(new THREE.CircleGeometry(1.62, 128), dialMat);
  dial.position.z = .17; head.add(dial);

  // Yozuvlar alohida shaffof qatlam (rang almashganda qayta chiziladi)
  const printMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false });
  const print = new THREE.Mesh(new THREE.CircleGeometry(1.62, 64), printMat);
  print.position.z = .172; head.add(print);

  let dialKey = 'yashil';
  function paintDial(name) {
    const D = DIALS[name]; dialKey = name;
    const col = canvasTex(1024, 1024, (x, w) => {
      const g = x.createRadialGradient(w / 2, w / 2, w * .1, w / 2, w / 2, w * .5);
      g.addColorStop(0, D.base); g.addColorStop(.78, D.base); g.addColorStop(1, D.edge);
      x.fillStyle = g; x.fillRect(0, 0, w, w);
    });
    dialMat.map?.dispose(); dialMat.map = col;
    dialMat.metalness = D.metal; dialMat.roughness = D.rough; dialMat.needsUpdate = true;

    const pr = canvasTex(2048, 2048, (x, w) => {
      x.clearRect(0, 0, w, w);
      x.translate(w / 2, w / 2);
      x.fillStyle = D.ink; x.strokeStyle = D.ink; x.textAlign = 'center'; x.textBaseline = 'middle';
      // minut shkalasi
      for (let i = 0; i < 60; i++) {
        x.save(); x.rotate(i / 60 * TAU);
        if (i % 5) { x.lineWidth = 2.6; x.globalAlpha = .75; x.beginPath(); x.moveTo(0, -w * .487); x.lineTo(0, -w * .47); x.stroke(); }
        else { x.fillRect(-3.4, -w * .487, 6.8, w * .022); }
        x.restore();
      }
      x.globalAlpha = 1;
      x.font = '700 56px "Times New Roman",serif';
      spaced(x, 'WEST END WATCH Co.', 0, -w * .205, 3);
      x.font = 'italic 600 84px "Times New Roman",serif';
      x.fillText('Prima', 0, -w * .148);
      // pastki belgi
      x.lineWidth = 3.4;
      x.beginPath(); x.arc(0, w * .145, 24, 0, TAU); x.stroke();
      x.beginPath(); x.moveTo(-24, w * .145); x.lineTo(24, w * .145); x.moveTo(0, w * .145 - 24); x.lineTo(0, w * .145 + 24); x.stroke();
      x.font = '600 38px Arial,sans-serif';
      spaced(x, 'AUTOMATIC', 0, w * .2, 4);
      x.font = '600 28px Arial,sans-serif';
      spaced(x, 'SWISS MADE', 0, w * .463, 3);
    });
    printMat.map?.dispose(); printMat.map = pr; printMat.needsUpdate = true;
  }
  function spaced(x, s, cx, y, sp) {
    const w = [...s].reduce((a, ch) => a + x.measureText(ch).width + sp, -sp);
    let px = cx - w / 2; const al = x.textAlign; x.textAlign = 'left';
    for (const ch of s) { x.fillText(ch, px, y); px += x.measureText(ch).width + sp; }
    x.textAlign = al;
  }

  // Applied indekslar (tilla + lume)
  const markerG = new RoundedBoxGeometry(.075, .3, .05, 3, .016);
  const lumeG = new THREE.BoxGeometry(.03, .22, .012);
  for (let i = 0; i < 12; i++) {
    if (i === 0 || i === 3) continue;       // 12 da kun oynasi, 3 da sana
    const a = i / 12 * TAU, r = 1.3;
    const pv = new THREE.Group();
    pv.position.set(Math.sin(a) * r, Math.cos(a) * r, .2); pv.rotation.z = -a;
    const dbl = i % 3 === 0 && false;
    const m = new THREE.Mesh(markerG, gold); pv.add(m);
    const l = new THREE.Mesh(lumeG, lume); l.position.z = .028; pv.add(l);
    if (dbl) m.scale.x = 1.5;
    head.add(pv);
  }
  // Kun va sana oynalari
  const windowFrame = (w, h, x, y) => {
    const s = new THREE.Shape();
    const O = .03, hw = w / 2 + O, hh = h / 2 + O;
    s.moveTo(-hw, -hh); s.lineTo(hw, -hh); s.lineTo(hw, hh); s.lineTo(-hw, hh); s.closePath();
    const hl = new THREE.Path();
    hl.moveTo(-w / 2, -h / 2); hl.lineTo(-w / 2, h / 2); hl.lineTo(w / 2, h / 2); hl.lineTo(w / 2, -h / 2); hl.closePath();
    s.holes.push(hl);
    const f = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .03, bevelEnabled: true, bevelSize: .006, bevelThickness: .006, bevelSegments: 2 }), gold);
    f.position.set(x, y, .172); head.add(f);
  };
  const dayCanvas = document.createElement('canvas'); dayCanvas.width = 512; dayCanvas.height = 128;
  const dateCanvas = document.createElement('canvas'); dateCanvas.width = dateCanvas.height = 256;
  const dayTex = new THREE.CanvasTexture(dayCanvas); dayTex.colorSpace = THREE.SRGBColorSpace; dayTex.anisotropy = 8;
  const dateTex = new THREE.CanvasTexture(dateCanvas); dateTex.colorSpace = THREE.SRGBColorSpace; dateTex.anisotropy = 8;
  const dayMesh = new THREE.Mesh(new THREE.PlaneGeometry(.68, .17), new THREE.MeshStandardMaterial({ map: dayTex, roughness: .5 }));
  dayMesh.position.set(0, 1.28, .176); head.add(dayMesh);
  windowFrame(.68, .17, 0, 1.28);
  const dateMesh = new THREE.Mesh(new THREE.PlaneGeometry(.26, .26), new THREE.MeshStandardMaterial({ map: dateTex, roughness: .5 }));
  dateMesh.position.set(1.22, 0, .176); head.add(dateMesh);
  windowFrame(.26, .26, 1.22, 0);

  let lastDay = -1;
  function paintCalendar(dayName, date) {
    let x = dayCanvas.getContext('2d');
    x.fillStyle = '#f6f3ea'; x.fillRect(0, 0, 512, 128);
    x.fillStyle = '#141414'; x.font = '700 86px Arial,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(dayName, 256, 70); dayTex.needsUpdate = true;
    x = dateCanvas.getContext('2d');
    x.fillStyle = '#f6f3ea'; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#141414'; x.font = '700 176px Arial,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(String(date), 128, 138); dateTex.needsUpdate = true;
  }

  /* ---------- MILLAR ---------- */
  const hand = (len, w, tail = .22, tip = true) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -tail); s.lineTo(w / 2, -tail); s.lineTo(w / 2, len - (tip ? w : 0));
    if (tip) s.lineTo(0, len); s.lineTo(-w / 2, len - (tip ? w : 0)); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: .014, bevelEnabled: true, bevelSize: .007, bevelThickness: .007, bevelSegments: 2 });
    const m = new THREE.Mesh(g, gold);
    const lu = new THREE.Mesh(new THREE.BoxGeometry(w * .42, len * .62, .004), lume);
    lu.position.set(0, len * .56, .024); m.add(lu);
    return m;
  };
  const hH = hand(.92, .095); hH.position.z = .245; head.add(hH);
  const hM = hand(1.38, .075); hM.position.z = .275; head.add(hM);
  const sShape = new THREE.Shape();
  sShape.moveTo(-.008, -.36); sShape.lineTo(.008, -.36); sShape.lineTo(.0045, 1.5); sShape.lineTo(-.0045, 1.5); sShape.closePath();
  const hS = new THREE.Mesh(new THREE.ExtrudeGeometry(sShape, { depth: .01, bevelEnabled: false }), gold);
  hS.position.z = .305; head.add(hS);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.052, .06, .13, 32), gold);
  hub.rotation.x = Math.PI / 2; hub.position.z = .26; head.add(hub);
  const hub2 = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .04, 16), gold);
  hub2.rotation.x = Math.PI / 2; hub2.position.z = .325; head.add(hub2);

  /* ---------- SAFIR OYNA (qavariq + lupa) ---------- */
  // Faqat aks: additive qora metall — terishni xiralashtirmaydi
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#2a2c30', metalness: 1, roughness: .02, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: .42, side: THREE.FrontSide });
  const glassP = []; for (let i = 0; i <= 26; i++) { const t = i / 26; glassP.push([1.72 * Math.sin(t * Math.PI / 2 * .999), .47 - (1 - Math.cos(t * Math.PI / 2)) * .09]); }
  const glass = new THREE.Mesh(lathe(glassP.reverse().map(p => p).reverse(), 128), glassMat); glass.renderOrder = 5; head.add(glass);

  const cyc = new THREE.Mesh(new RoundedBoxGeometry(.46, .46, .09, 6, .04), new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: .02, transparent: true, opacity: .12, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2.2, depthWrite: false }));
  cyc.position.set(1.22, 0, .475); cyc.renderOrder = 6; head.add(cyc);
  // Lupa kattalashtirishi: sanani shunchaki kattaroq ko'rsatadi
  dateMesh.scale.setScalar(1.25); dateMesh.position.z = .205;

  /* ---------- ORQA: SAFIR OYNA VA MEXANIZM ---------- */
  const back = new THREE.Group(); head.add(back);
  back.add(new THREE.Mesh(lathe([[1.62, -.47], [1.46, -.5], [1.34, -.5], [1.3, -.46]], 96), steel));
  const engrave = canvasTex(1024, 1024, (x, w) => {
    x.clearRect(0, 0, w, w); x.translate(w / 2, w / 2); x.rotate(Math.PI);
    x.fillStyle = 'rgba(30,30,30,.82)'; x.font = '600 28px Arial,sans-serif'; x.textAlign = 'center';
    const s = '  WEST END WATCH CO.  ·  SWISS MADE  ·  AUTOMATIC  ·  WEST END WATCH CO.  ·  SWISS MADE  ·  AUTOMATIC  ·';
    for (let i = 0; i < s.length; i++) { x.save(); x.rotate(i / s.length * TAU); x.fillText(s[i], 0, -w * .44); x.restore(); }
  });
  {
    const r = new THREE.Mesh(new THREE.RingGeometry(1.34, 1.62, 96), new THREE.MeshBasicMaterial({ map: engrave, transparent: true, depthWrite: false }));
    // ringda uv kvadrat bo'yicha — mos
    r.rotation.y = Math.PI; r.position.z = -.5005; back.add(r);
  }
  const cotes = canvasTex(1024, 1024, (x, w) => {
    // Côtes de Genève
    x.fillStyle = '#b9b7b0'; x.fillRect(0, 0, w, w);
    for (let i = 0; i < 26; i++) {
      const g = x.createLinearGradient(0, i * 40, 0, (i + 1) * 40);
      g.addColorStop(0, '#8f8d86'); g.addColorStop(.45, '#efece4'); g.addColorStop(1, '#8a8880');
      x.fillStyle = g; x.fillRect(0, i * 40, w, 40);
    }
  });
  const plateMat = new THREE.MeshStandardMaterial({ map: cotes, metalness: 1, roughness: .34 });
  const perlage = canvasTex(1024, 1024, (x, w) => {
    x.fillStyle = '#a8a69f'; x.fillRect(0, 0, w, w);
    for (let j = 0; j < 40; j++) for (let i = 0; i < 40; i++) {
      const cx = i * 26 + (j % 2) * 13, cy = j * 23;
      const g = x.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, 17);
      g.addColorStop(0, '#f1eee6'); g.addColorStop(.7, '#a3a199'); g.addColorStop(1, '#6d6b65');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 17, 0, TAU); x.fill();
    }
  });
  const baseMat = new THREE.MeshStandardMaterial({ map: perlage, metalness: 1, roughness: .42 });
  const mv = new THREE.Group(); mv.position.z = -.42; back.add(mv);
  const baseP = new THREE.Mesh(new THREE.CircleGeometry(1.34, 96), baseMat);
  baseP.rotation.y = Math.PI; mv.add(baseP);

  const extrudeFlat = (shape, depth, mat, z) => {
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2, curveSegments: 40 }), mat);
    // UV ni normallashtirish
    const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .35 + .5, uv.getY(i) * .35 + .5);
    m.rotation.y = Math.PI; m.position.z = z; return m;
  };
  // Ko'priklar: markazdan uch sektor, oralari perlaj plastina ko'rinadi
  const sector = (a0, a1, r0 = .24, r1 = 1.31) => {
    const sh = new THREE.Shape();
    sh.absarc(0, 0, r1, a0, a1, false); sh.absarc(0, 0, r0, a1, a0, true); sh.closePath(); return sh;
  };
  mv.add(extrudeFlat(sector(.1, 1.05), .03, plateMat, -.03));
  mv.add(extrudeFlat(sector(1.16, 2.5), .03, plateMat, -.03));
  mv.add(extrudeFlat(sector(3.55, 5.2), .03, plateMat, -.03));

  // Yoqutlar va ko'k vintlar
  const ruby = new THREE.MeshPhysicalMaterial({ color: '#a30d2b', metalness: 0, roughness: .08, clearcoat: 1, clearcoatRoughness: .02, sheen: 0, envMapIntensity: 2.4 });
  const gChaton = new THREE.TorusGeometry(.042, .014, 10, 28);
  const screwMat = new THREE.MeshStandardMaterial({ color: '#3a63c9', metalness: .9, roughness: .24 });
  [[-.72, .55], [-.3, .95], [.32, .92], [-.92, -.05], [.62, -.74], [.1, -.93], [-.46, -.82], [.9, .22]].forEach(([x, y]) => {
    const j = new THREE.Mesh(new THREE.SphereGeometry(.036, 16, 12), ruby); j.scale.z = .5; j.position.set(x, y, -.068); mv.add(j);
    const c = new THREE.Mesh(gChaton, gold); c.position.set(x, y, -.066); mv.add(c);
  });
  [[-1.1, .35], [-.6, 1.02], [.55, 1.08], [1.14, -.14], [.3, -1.12], [-.9, -.72]].forEach(([x, y]) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .02, 20), screwMat);
    s.rotation.x = Math.PI / 2; s.position.set(x, y, -.07); mv.add(s);
    const n = new THREE.Mesh(new THREE.BoxGeometry(.08, .012, .012), blackPol); n.rotation.z = x * 3; n.position.set(x, y, -.083); mv.add(n);
  });

  // Tishli g'ildiraklar
  const gear = (r, teeth, h, mat) => {
    const s = new THREE.Shape();
    for (let i = 0; i < teeth * 2; i++) {
      const a = i / (teeth * 2) * TAU, rr = i % 2 ? r : r * .92;
      if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    s.closePath();
    const hl = new THREE.Path(); hl.absarc(0, 0, r * .75, 0, TAU, true); s.holes.push(hl);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 24 }), mat));
    for (let i = 0; i < 4; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(r * 1.55, r * .13, h), mat); sp.rotation.z = i * Math.PI / 4; sp.position.z = h / 2; if (i % 2 === 0) g.add(sp); }
    return g;
  };
  const gearA = gear(.33, 48, .012, gold); gearA.position.set(.42, -.34, -.045); gearA.visible = true; mv.add(gearA);

  // Balans g'ildiragi — tebranadi
  const balance = new THREE.Group(); balance.position.set(.72, .36, -.09); mv.add(balance);
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.3, .022, 12, 64), gold); balance.add(ring);
    for (let i = 0; i < 3; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(.6, .03, .014), gold); a.rotation.z = i * Math.PI / 3; balance.add(a); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; const s = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .02, 8), steel); s.rotation.z = a; s.position.set(Math.cos(a) * .325, Math.sin(a) * .325, 0); balance.add(s); }
    const hair = []; for (let t = 0; t < 1; t += .004) { const a = t * TAU * 8, r = .05 + t * .19; hair.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    balance.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(hair), new THREE.LineBasicMaterial({ color: '#e0e0e0' })));
    const c = new THREE.Mesh(new THREE.SphereGeometry(.032, 14, 10), ruby); c.position.z = -.02; balance.add(c);
  }
  const cock = new THREE.Shape(); cock.moveTo(-.62, .3); cock.lineTo(-1.22, .62); cock.lineTo(-1.26, .3); cock.lineTo(-.74, .24); cock.closePath();
  mv.add(extrudeFlat(cock, .022, plateMat, -.125));

  // Rotor — soat harakatida erkin aylanadi
  const rotor = new THREE.Group(); rotor.position.z = -.14; mv.add(rotor);
  {
    const s = new THREE.Shape(); s.absarc(0, 0, 1.27, -.1, Math.PI + .1, false); s.absarc(0, 0, .22, Math.PI + .1, -.1, true); s.closePath();
    const rm = new THREE.MeshStandardMaterial({ map: cotes, metalness: 1, roughness: .26 });
    rotor.add(extrudeFlat(s, .026, rm, -.02));
    const w = new THREE.Shape(); w.absarc(0, 0, 1.28, -.08, Math.PI + .08, false); w.absarc(0, 0, 1.08, Math.PI + .08, -.08, true); w.closePath();
    rotor.add(extrudeFlat(w, .04, gold, -.04));
    const label = canvasTex(1024, 512, (x, W, H) => {
      x.clearRect(0, 0, W, H); x.fillStyle = '#1b1a18'; x.textAlign = 'center';
      x.font = 'italic 600 74px "Times New Roman",serif'; x.fillText('West End Watch Co.', W / 2, 120);
      x.font = '600 30px Arial,sans-serif'; x.fillText('SWISS MADE  ·  AUTOMATIC', W / 2, 176);
    });
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .75), new THREE.MeshBasicMaterial({ map: label, transparent: true, depthWrite: false }));
    lb.rotation.y = Math.PI; lb.position.set(0, .42, -.05); rotor.add(lb);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .05, 40), steel); c.rotation.x = Math.PI / 2; c.position.z = -.045; rotor.add(c);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .02, 24), screwMat); st.rotation.x = Math.PI / 2; st.position.z = -.075; rotor.add(st);
  }

  // Orqa safir oyna
  const backGlass = new THREE.Mesh(new THREE.CircleGeometry(1.34, 64), glassMat);
  backGlass.rotation.y = Math.PI; backGlass.position.z = -.5; backGlass.renderOrder = 5; back.add(backGlass);

  /* ---------- BRASLET ---------- */
  const band = new THREE.Group(); watch.add(band);
  const COUNT = mobile ? 26 : 34;   // har tomonga bo'g'in soni — kadr tashqarisiga chiqib ketadi
  const pitch = .315;
  const midG = new RoundedBoxGeometry(.19, .285, .17, 3, .045);
  const presMidG = new RoundedBoxGeometry(.5, .3, .165, 3, .05);
  const presOuterG = new RoundedBoxGeometry(.44, .3, .19, 3, .06);
  const jubOuterG = new RoundedBoxGeometry(.43, .3, .19, 3, .05);
  const endG = new RoundedBoxGeometry(1.48, .62, .26, 4, .08);
  const underG = new THREE.BoxGeometry(1.36, pitch + .01, .08);

  // emissive: qorong'i muhitni aks ettirganda bo'g'inlar qora teshikdek ko'rinmasin
  const bandPolished = new THREE.MeshStandardMaterial({ color: '#d8d8d4', metalness: .92, roughness: .24, emissive: '#2b2b29' });
  const bandUnder = new THREE.MeshStandardMaterial({ color: '#55554f', metalness: .8, roughness: .55 });
  const bandSatin = new THREE.MeshStandardMaterial({ color: '#cfcfca', metalness: .96, roughness: .34, emissive: '#1e1e1c', normalMap: brushN, normalScale: new THREE.Vector2(.14, .14) });

  // Braslet egri chizig'i: kalladan chiqib, orqaga asta egiladi
  const pathAt = (d, sign) => {
    const y0 = 2.48, k = .055;
    const a = Math.min(d * k, 1.05);
    const y = y0 + (a > 1e-4 ? Math.sin(a) / k : d);
    const z = -.2 - (1 - Math.cos(a)) / k;
    return { y: y * sign, z, tilt: -a * sign };
  };
  const dummy = new THREE.Object3D();
  function buildBand(kind) {
    band.clear();
    const links = [];
    const add = (geo, mat, list) => {
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((o, i) => { dummy.position.set(o.x, o.y, o.z); dummy.rotation.set(o.r, 0, 0); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
      im.instanceMatrix.needsUpdate = true; band.add(im); links.push(im);
    };
    const outer = [], mid = [], under = [], ends = [];
    [1, -1].forEach(sign => {
      ends.push({ x: 0, y: 2.2 * sign, z: -.2, r: 0 });
      for (let i = 0; i < COUNT; i++) {
        const d = (i + .5) * pitch + .02, p = pathAt(d, sign);
        [-.525, .525].forEach(x => outer.push({ x, y: p.y, z: p.z, r: p.tilt }));
        under.push({ x: 0, y: p.y, z: p.z - .05, r: p.tilt });
        if (kind === 'jubilee') {
          const pY = pathAt(d - pitch / 2, sign);
          [-.2, .2].forEach(x => mid.push({ x, y: p.y, z: p.z + .012, r: p.tilt }));
          mid.push({ x: 0, y: pY.y, z: pY.z + .018, r: pY.tilt });
        } else {
          mid.push({ x: 0, y: p.y, z: p.z + .016, r: p.tilt });
        }
      }
    });
    add(underG, bandUnder, under);
    add(endG, bandSatin, ends);
    add(kind === 'jubilee' ? jubOuterG : presOuterG, bandSatin, outer);
    add(kind === 'jubilee' ? midG : presMidG, bandPolished, mid);
  }
  buildBand('jubilee');

  /* ---------- HOLAT ---------- */
  let visible = true, baseCam = 16;
  const state = { rx: 0, ry: 0, rz: 0, x: 0, y: 0, z: 0, cam: 16, sizeScale: 1, targetScale: 1, rotorV: 0, rotorSpin: 0 };
  const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
  const zoomFactor = () => {
    const a = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    return a < .9 ? Math.min(1.9, .95 / a) : 1;
  };

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

  const tz = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false, weekday: 'long', day: 'numeric' });
  function tick(t) {
    const parts = Object.fromEntries(tz.formatToParts(new Date()).map(p => [p.type, p.value]));
    const hh = +parts.hour % 12, mm = +parts.minute;
    const ms = Date.now() % 1000, ss = +parts.second + Math.floor(ms / 125) / 8;       // 28 800 tebranish: 8 qadam/sek
    hS.rotation.z = -ss / 60 * TAU;
    hM.rotation.z = -(mm + ss / 60) / 60 * TAU;
    hH.rotation.z = -(hh + mm / 60) / 12 * TAU;
    if (+parts.day !== lastDay) { lastDay = +parts.day; paintCalendar(parts.weekday.toUpperCase(), lastDay); }
    balance.rotation.z = Math.sin(t * .001 * TAU * 4) * 2.2;
    rotor.rotation.z = state.rotorSpin + Math.sin(t * .0006) * .35;
    gearA.rotation.z = t * .00012;
  }

  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible) return;
    pointer.cx += (pointer.x - pointer.cx) * .05; pointer.cy += (pointer.y - pointer.cy) * .05;
    tick(t);
    watch.rotation.set(state.rx + pointer.cy * .1, state.ry + pointer.cx * .16, state.rz);
    watch.position.set(state.x, state.y, state.z);
    state.sizeScale += (state.targetScale - state.sizeScale) * .08;
    watch.scale.setScalar(state.sizeScale);
    camera.position.z = state.cam * zoomFactor();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  paintDial('yashil');

  if (matchMedia('(hover:hover)').matches) addEventListener('pointermove', e => { pointer.x = e.clientX / innerWidth - .5; pointer.y = e.clientY / innerHeight - .5; }, { passive: true });

  return {
    state,
    setDial: paintDial,
    setBand: buildBand,
    setSize: mm => { state.targetScale = mm / 41; },
    setVisible: v => { visible = v; },
    renderer, camera, get dial() { return dialKey; },
    ready: true,
  };
}

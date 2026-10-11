'use client';
import { useRef } from 'react';

// ================= সাধারণ তালিকা =================
export const SLOTS = { top: 'টপ', bottom: 'বটম', dress: 'ড্রেস', jacket: 'জ্যাকেট', shoes: 'জুতা', hat: 'টুপি', face: 'চশমা' };
export const SHAPES = {
  top: [['bikini_top', 'বিকিনি টপ'], ['crop_top', 'ক্রপ টপ'], ['tube_top', 'টিউব টপ'], ['halter', 'হল্টার'], ['tank', 'ট্যাঙ্ক'], ['open_shirt', 'খোলা শার্ট']],
  bottom: [['bikini_bottom', 'বিকিনি বটম'], ['micro_shorts', 'মাইক্রো শর্টস'], ['hot_pants', 'হট প্যান্ট'], ['denim_shorts', 'ডেনিম শর্টস'], ['mini_skirt', 'মিনি স্কার্ট'], ['swim_trunks', 'সুইম ট্রাঙ্ক'], ['jean_shorts', 'জিন্স শর্টস'], ['shorts', 'শর্টস']],
  dress: [['mini_dress', 'মিনি ড্রেস'], ['bodycon', 'বডিকন ড্রেস'], ['western', 'ওয়েস্টার্ন ড্রেস']],
  jacket: [['leather_jacket', 'লেদার জ্যাকেট'], ['denim_vest', 'ডেনিম ভেস্ট']],
  shoes: [['heels', 'হাই হিল'], ['boots', 'বুটস'], ['cowboy_boots', 'কাউবয় বুটস'], ['sneakers', 'স্নিকারস']],
  hat: [['cowboy_hat', 'কাউবয় হ্যাট'], ['cap', 'ক্যাপ']],
  face: [['sunglasses', 'সানগ্লাস']],
};
export const HAIR_STYLES = [['long', 'লম্বা'], ['bob', 'বব'], ['ponytail', 'পনিটেইল'], ['curly', 'কোঁকড়া'], ['bun', 'খোঁপা'], ['short', 'ছোট'], ['buzz', 'ক্রু কাট']];
export const SKINS = ['#fbe0c9', '#f1c9a5', '#e0a97c', '#c68642', '#8d5524', '#5c3a21'];
export const HAIR_COLORS = ['#2b1b17', '#3b2314', '#6b4423', '#c68e3b', '#e8c872', '#b5251d', '#8e44ad', '#ff7eb6', '#e8e8e8'];
export const BODY_KEYS = [['bust', 'বক্ষ/বুক'], ['waist', 'কোমর'], ['belly', 'পেট'], ['hips', 'নিতম্ব'], ['thighs', 'উরু']];

// ================= হেল্পার =================
const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0));
const L = (a, b, t) => a + ((b - a) * clamp(t)) / 100;
const f = (n) => Number(n).toFixed(1);
const pt = (p) => `${f(p[0])},${f(p[1])}`;
const col = (c, d = '#888888') => (typeof c === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : d);
const safeUrl = (u) => (typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u) ? u : null);
// Catmull-Rom → Bezier (মসৃণ বক্ররেখা)
const cr = (pts) => {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
};
const poly = (pts) => 'M' + pts.map(pt).join(' L') + ' Z';
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// ================= মূল SVG জেনারেটর (শুধু ভেতরের মার্কআপ) =================
export function avatarSvg({ gender = 'female', body = {}, skin = '#f1c9a5', hairStyle = 'long', hairColor = '#3b2314', outfit = {}, id = 'av' }) {
  const male = gender === 'male';
  const sk = col(skin, '#f1c9a5');
  const hc = col(hairColor, '#3b2314');
  const B = (k, d) => (body && body[k] != null ? Number(body[k]) : d);
  const bust = B('bust', 60), waist = B('waist', 40), hips = B('hips', 60), belly = B('belly', 25), thighs = B('thighs', 60);

  const sh = male ? L(36, 48, bust) : 31;
  const chest = male ? L(34, 45, bust) : L(25, 36, bust);
  const under = male ? chest - 3 : L(22, 29, bust);
  const wa = male ? L(24, 36, waist) : L(14, 30, waist);
  const bel = wa + L(0, male ? 9 : 11, belly);
  const hp = male ? L(26, 35, hips) : L(27, 46, hips);
  const th = male ? L(12, 19, thighs) : L(12.5, 22, thighs);
  const cx = male ? 15 : 16;
  const dark = 'rgba(0,0,0,.14)';
  const sides = [-1, 1];

  // ধড়
  const tp = [[7, 78], [sh, 95], [chest, 128], [under, 148], [wa, 172], [bel, 193], [hp, 214], [hp - 3, 227], [cx + th * 0.95, 247]];
  const R = tp.map(([h, y]) => [100 + h, y]);
  const Lp = tp.map(([h, y]) => [100 - h, y]).reverse();
  const torsoD = `M${pt(Lp[Lp.length - 1])} L${pt(R[0])}${cr(R)} L${pt(Lp[0])}${cr(Lp)} Z`;

  // পা
  const lt = [[228, th], [262, th * 0.92], [312, 10.5 + (th - 12) * 0.3], [345, 9 + (th - 12) * 0.28], [392, 6.5]];
  const legW = (y) => {
    if (y <= lt[0][0]) return lt[0][1];
    for (let i = 0; i < lt.length - 1; i++) {
      const [y1, w1] = lt[i], [y2, w2] = lt[i + 1];
      if (y <= y2) return w1 + ((w2 - w1) * (y - y1)) / (y2 - y1);
    }
    return lt[lt.length - 1][1];
  };
  const legD = (s) => {
    const c = 100 + s * cx;
    const out = lt.map(([y, w]) => [c + w, y]);
    const inn = lt.map(([y, w]) => [c - w, y]).reverse();
    return `M${pt(out[0])}${cr(out)} L${pt(inn[0])}${cr(inn)} Z`;
  };

  // হাত
  const armPts = (s) => [[100 + s * (sh - 3), 100], [100 + s * (sh + 10), 158], [100 + s * Math.max(sh + 8, hp + 3), 214]];
  const line = (pts, color, w) => `<polyline points="${pts.map(pt).join(' ')}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const sleeve = (s, color, w, full) => {
    const [S, E, H] = armPts(s);
    return line(full ? [S, E, lerp2(E, H, 0.85)] : [S, lerp2(S, E, 0.85)], color, w);
  };

  // কাপড় বানানোর হেল্পার
  const clipT = (y1, y2, fill) => `<g clip-path="url(#${id}t)"><rect x="0" y="${y1}" width="200" height="${y2 - y1}" fill="${fill}"/></g>`;
  const straps = (c) => `<g clip-path="url(#${id}t)"><rect x="${100 - 18}" y="94" width="6" height="28" fill="${c}"/><rect x="${100 + 12}" y="94" width="6" height="28" fill="${c}"/></g>`;
  const plunge = `<path d="${poly([[88, 116], [112, 116], [100, 140]])}" fill="${sk}"/>`;
  const shortsD = (yEnd) => {
    const w = legW(yEnd);
    const outer = cx + w + 1.5;
    const inner = Math.max(2, cx - w - 1.5);
    const rh = [[hp + 1.5, 203], [hp + 1.5, 218], [outer, yEnd], [inner, yEnd], [1.5, 240]];
    return poly([...rh.map(([h, y]) => [100 + h, y]), ...rh.slice().reverse().map(([h, y]) => [100 - h, y])]);
  };
  const skirt = (yTop, yHem, flare) => poly([[100 - (hp - 1), yTop], [100 + (hp - 1), yTop], [100 + hp + flare, yHem], [100 - hp - flare, yHem]]);
  const band = (c) => `<path d="M${f(100 - hp - 1)},206 L${f(100 + hp + 1)},206" stroke="rgba(0,0,0,.28)" stroke-width="2"/>`;

  const piece = (slot, it) => {
    if (!it) return '';
    const iu = safeUrl(it.image_url);
    if (iu) return `<image href="${iu}" x="0" y="0" width="200" height="424" preserveAspectRatio="xMidYMid meet"/>`;
    const c = col(it.color, '#ff3d7f');
    switch (it.shape) {
      // ---- টপ ----
      case 'bikini_top':
        return sides.map((s) => `<ellipse cx="${f(100 + s * chest * 0.52)}" cy="133" rx="${f(chest * 0.46)}" ry="${male ? 9 : 11.5}" fill="${c}"/><line x1="${f(100 + s * chest * 0.62)}" y1="123" x2="${f(100 + s * 6)}" y2="80" stroke="${c}" stroke-width="1.6"/>`).join('')
          + `<path d="M${f(100 - chest * 0.2)},131 L${f(100 + chest * 0.2)},131" stroke="${c}" stroke-width="2"/>`
          + `<path d="M${f(100 - chest)},134 L${f(100 + chest)},134" stroke="${c}" stroke-width="1.4" opacity=".55"/>`;
      case 'crop_top':
        return clipT(116, 160, c) + straps(c) + plunge;
      case 'tube_top':
        return clipT(118, 152, c);
      case 'halter':
        return `<g clip-path="url(#${id}t)"><path d="${poly([[94, 86], [106, 86], [100 + chest * 0.95, 152], [100 - chest * 0.95, 152]])}" fill="${c}"/></g>`;
      case 'tank':
        return clipT(96, male ? 186 : 178, c) + straps(c)
          + `<ellipse cx="100" cy="96" rx="14" ry="${male ? 12 : 15}" fill="${sk}"/>`;
      case 'open_shirt':
        return clipT(96, 198, c) + `<path d="${poly([[93, 96], [107, 96], [111, 198], [89, 198]])}" fill="${sk}"/>`
          + sides.map((s) => sleeve(s, c, male ? 17 : 14, false)).join('');
      // ---- বটম ----
      case 'bikini_bottom': {
        const hx = hp * 0.8;
        return `<path d="${poly([[100 - hx, 207], [100 + hx, 207], [114, 237], [86, 237]])}" fill="${c}"/>`
          + sides.map((s) => `<path d="M${f(100 + s * hx)},207 L${f(100 + s * (hp + 1))},204" stroke="${c}" stroke-width="2"/>`).join('');
      }
      case 'micro_shorts': return `<path d="${shortsD(246)}" fill="${c}"/>` + band(c);
      case 'hot_pants': return `<path d="${shortsD(258)}" fill="${c}"/>` + band(c);
      case 'denim_shorts':
        return `<path d="${shortsD(268)}" fill="${c}"/>` + band(c)
          + `<path d="M${f(100 - hp)},212 Q${f(100 - hp * 0.5)},224 ${f(100 - hp * 0.15)},212" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.2"/>`
          + `<path d="M${f(100 + hp)},212 Q${f(100 + hp * 0.5)},224 ${f(100 + hp * 0.15)},212" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1.2"/>`;
      case 'mini_skirt': return `<path d="${skirt(200, 250, 11)}" fill="${c}"/>` + band(c);
      case 'swim_trunks': return `<path d="${shortsD(272)}" fill="${c}"/>` + band(c);
      case 'shorts': return `<path d="${shortsD(290)}" fill="${c}"/>` + band(c);
      case 'jean_shorts': return `<path d="${shortsD(302)}" fill="${c}"/>` + band(c);
      // ---- ড্রেস ----
      case 'mini_dress':
        return clipT(116, 204, c) + straps(c) + plunge + `<path d="${skirt(198, 254, 14)}" fill="${c}"/>`;
      case 'bodycon':
        return clipT(116, 236, c) + straps(c) + plunge + `<path d="${shortsD(252)}" fill="${c}"/>`;
      case 'western':
        return clipT(116, 200, c) + straps(c) + plunge + `<path d="${skirt(196, 252, 20)}" fill="${c}"/>`
          + `<path d="M${f(100 - hp - 20)},258 L${f(100 + hp + 20)},258" stroke="${c}" stroke-width="9" stroke-dasharray="2 3"/>`;
      // ---- জ্যাকেট ----
      case 'leather_jacket':
        return `<g clip-path="url(#${id}t)"><rect x="0" y="96" width="${100 - 15}" height="112" fill="${c}"/><rect x="${100 + 15}" y="96" width="${100 - 15}" height="112" fill="${c}"/></g>`
          + sides.map((s) => sleeve(s, c, male ? 17 : 14, true)).join('')
          + `<path d="${poly([[85, 96], [100, 96], [85, 122]])}" fill="rgba(255,255,255,.12)"/><path d="${poly([[115, 96], [100, 96], [115, 122]])}" fill="rgba(255,255,255,.12)"/>`;
      case 'denim_vest':
        return `<g clip-path="url(#${id}t)"><rect x="0" y="98" width="${100 - 13}" height="84" fill="${c}"/><rect x="${100 + 13}" y="98" width="${100 - 13}" height="84" fill="${c}"/></g>`;
      // ---- জুতা ----
      case 'heels':
        return sides.map((s) => { const fx = 100 + s * cx; return `<ellipse cx="${f(fx)}" cy="402" rx="9" ry="4.5" fill="${c}"/><rect x="${f(fx - 1.5)}" y="404" width="3" height="13" fill="${c}"/><path d="M${f(fx - 6.5)},391 L${f(fx + 6.5)},391" stroke="${c}" stroke-width="2.4"/>`; }).join('');
      case 'boots':
      case 'cowboy_boots': {
        const yb = it.shape === 'boots' ? 336 : 322;
        return sides.map((s) => {
          const fx = 100 + s * cx, wt = legW(yb) + 2.2, wb = 7.8;
          const extra = it.shape === 'cowboy_boots'
            ? `<path d="M${f(fx - wt + 2)},${yb + 9} L${f(fx + wt - 2)},${yb + 9}" stroke="#f3d9a0" stroke-width="1.4" stroke-dasharray="2 2"/><rect x="${f(fx - 3)}" y="404" width="6" height="9" fill="${c}"/>` : '';
          return `<path d="M${f(fx - wt)},${yb} L${f(fx + wt)},${yb} L${f(fx + wb)},400 L${f(fx - wb)},400 Z" fill="${c}"/><ellipse cx="${f(fx + s)}" cy="404" rx="11" ry="5" fill="${c}"/>${extra}`;
        }).join('');
      }
      case 'sneakers':
        return sides.map((s) => { const fx = 100 + s * cx; return `<ellipse cx="${f(fx + s)}" cy="402" rx="11" ry="6" fill="${c}"/><path d="M${f(fx - 10 + s)},405.5 L${f(fx + 12 + s)},405.5" stroke="#ffffff" stroke-width="2.6"/>`; }).join('');
      // ---- টুপি / চশমা ----
      case 'cowboy_hat':
        return `<ellipse cx="100" cy="29" rx="44" ry="8" fill="${c}"/><path d="M79,29 C79,3 121,3 121,29 Z" fill="${c}"/><path d="M79,25 L121,25" stroke="rgba(0,0,0,.35)" stroke-width="3"/>`;
      case 'cap':
        return `<path d="M77,34 C77,8 123,8 123,34 Z" fill="${c}"/><ellipse cx="82" cy="35" rx="22" ry="4" fill="${c}"/>`;
      case 'sunglasses':
        return `<rect x="80" y="42" width="18" height="11" rx="4" fill="${c}" opacity=".93"/><rect x="102" y="42" width="18" height="11" rx="4" fill="${c}" opacity=".93"/><path d="M98,46 L102,46" stroke="${c}" stroke-width="2"/>`;
      default: return '';
    }
  };

  // চুল
  const cap = `<path d="M77,46 C73,10 127,10 123,46 C119,33 108,27 100,27 C92,27 81,33 77,46 Z" fill="${hc}"/>`;
  const hairBack = {
    long: `<path d="M71,38 C62,95 58,150 70,195 L130,195 C142,150 138,95 129,38 Z" fill="${hc}"/>`,
    bob: `<path d="M72,38 C66,70 68,92 78,94 L122,94 C132,92 134,70 128,38 Z" fill="${hc}"/>`,
    ponytail: `<path d="M118,34 C152,30 160,92 136,128 C142,86 130,62 118,44 Z" fill="${hc}"/>`,
    curly: [[74, 40], [70, 56], [126, 40], [130, 56], [84, 22], [100, 16], [116, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="${hc}"/>`).join(''),
    bun: '', short: '', buzz: '',
  }[hairStyle] || '';
  const hairFront = {
    long: cap, bob: cap, ponytail: cap, short: cap,
    curly: `<circle cx="84" cy="26" r="11" fill="${hc}"/><circle cx="100" cy="21" r="12" fill="${hc}"/><circle cx="116" cy="26" r="11" fill="${hc}"/>`,
    bun: cap + `<circle cx="100" cy="14" r="10" fill="${hc}"/>`,
    buzz: `<path d="M77,46 C73,10 127,10 123,46 C119,33 108,27 100,27 C92,27 81,33 77,46 Z" fill="${hc}" fill-opacity=".78"/>`,
  }[hairStyle] || cap;

  // মুখ
  const face = `<ellipse cx="91" cy="48" rx="3.4" ry="4" fill="#2b1b17"/><ellipse cx="109" cy="48" rx="3.4" ry="4" fill="#2b1b17"/>`
    + `<circle cx="92.3" cy="46.6" r="1.2" fill="#fff"/><circle cx="110.3" cy="46.6" r="1.2" fill="#fff"/>`
    + (male
      ? `<path d="M84,40 L97,39" stroke="${hc}" stroke-width="2.8" stroke-linecap="round"/><path d="M103,39 L116,40" stroke="${hc}" stroke-width="2.8" stroke-linecap="round"/>`
      : `<path d="M85,41 Q91,37.5 97,40" fill="none" stroke="${hc}" stroke-width="1.6" stroke-linecap="round"/><path d="M103,40 Q109,37.5 115,41" fill="none" stroke="${hc}" stroke-width="1.6" stroke-linecap="round"/>`
        + `<path d="M87.5,44.5 L85.5,42.5 M110.5,44.5 L112.5,42.5" stroke="#2b1b17" stroke-width="1.3" stroke-linecap="round"/>`)
    + `<path d="M100,50 Q98.5,56 100.5,57" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.2" stroke-linecap="round"/>`
    + (male
      ? `<path d="M94,63 Q100,66 106,63" fill="none" stroke="#a5504a" stroke-width="2" stroke-linecap="round"/>`
      : `<path d="M93,62 Q100,68.5 107,62 Q100,64 93,62 Z" fill="#d94f6b"/>`)
    + `<ellipse cx="84" cy="56" rx="4" ry="2.4" fill="#ff7a8a" opacity=".22"/><ellipse cx="116" cy="56" rx="4" ry="2.4" fill="#ff7a8a" opacity=".22"/>`;

  // শেডিং
  let shade = '';
  if (male) {
    shade += `<path d="M100,128 L100,162" stroke="${dark}" stroke-width="1.4"/>`
      + sides.map((s) => `<path d="M${f(100 + s * 3)},142 Q${f(100 + s * chest * 0.5)},150 ${f(100 + s * (chest - 4))},136" fill="none" stroke="${dark}" stroke-width="1.6" stroke-linecap="round"/>`).join('');
    if (belly < 60) shade += [164, 177, 190].map((y) => `<path d="M${f(100 - 7)},${y} L${f(100 + 7)},${y}" stroke="${dark}" stroke-width="1.2" opacity=".7"/>`).join('');
  } else {
    shade += sides.map((s) => `<path d="M${f(100 + s * 3)},145 Q${f(100 + s * chest * 0.5)},157 ${f(100 + s * (chest - 2))},141" fill="none" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>`).join('')
      + `<path d="M100,124 Q98.5,135 100,147" fill="none" stroke="${dark}" stroke-width="1.2"/>`;
  }
  shade += `<ellipse cx="100" cy="${f(bel > wa + 4 ? 197 : 193)}" rx="1.8" ry="2.6" fill="${dark}"/>`;

  // সাজানোর ক্রম
  const hasDress = !!outfit.dress;
  const bottom = hasDress ? null : (outfit.bottom || { shape: male ? 'swim_trunks' : 'bikini_bottom', color: male ? '#1d3557' : '#e63946' });
  const top = hasDress ? null : (outfit.top || (male ? null : { shape: 'bikini_top', color: '#e63946' }));

  const out = [];
  out.push(`<defs><clipPath id="${id}t"><path d="${torsoD}"/></clipPath></defs>`);
  out.push(hairBack);
  sides.forEach((s) => out.push(`<path d="${legD(s)}" fill="${sk}"/><ellipse cx="${f(100 + s * cx + s)}" cy="402" rx="8.5" ry="4.5" fill="${sk}"/>`));
  out.push(`<path d="${torsoD}" fill="${sk}"/>`);
  sides.forEach((s) => {
    const [, , H] = armPts(s);
    out.push(line(armPts(s), sk, male ? 15 : 12) + `<circle cx="${f(H[0])}" cy="${f(H[1] + 4)}" r="6.5" fill="${sk}"/>`);
  });
  out.push(`<rect x="93" y="64" width="14" height="22" rx="5" fill="${sk}"/>`);
  out.push(`<circle cx="79" cy="50" r="4" fill="${sk}"/><circle cx="121" cy="50" r="4" fill="${sk}"/>`);
  out.push(`<ellipse cx="100" cy="48" rx="21" ry="25" fill="${sk}"/>`);
  out.push(shade, face);
  out.push(piece('bottom', bottom), piece('top', top), piece('dress', outfit.dress));
  out.push(piece('jacket', outfit.jacket), piece('shoes', outfit.shoes), piece('face', outfit.face));
  out.push(hairFront, piece('hat', outfit.hat));
  return out.join('');
}

// ---- component ----
export default function Avatar({ width = 200, ...p }) {
  const ref = useRef(null);
  if (!ref.current) ref.current = 'av' + Math.random().toString(36).slice(2, 8);
  return (
    <svg
      viewBox="0 0 200 424"
      width={width}
      style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="অ্যাভাটার"
      dangerouslySetInnerHTML={{ __html: avatarSvg({ ...p, id: ref.current }) }}
    />
  );
}


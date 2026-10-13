'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Avatar, { SLOTS, SHAPES, BODY_KEYS } from '../../lib/Avatar';

const KINDS = { action: 'অ্যাকশন', modifier: 'মডিফায়ার (কোথায়/কীভাবে)', truth: 'ট্রুথ', dare: 'ডেয়ার', card: 'কার্ড', wheel: 'চাকার সেগমেন্ট', scratch: 'স্ক্র্যাচ কার্ড' };
const DEF_LEVELS = {
  1: { name: 'লেভেল ১ · হালকা', icon: '🌸' },
  2: { name: 'লেভেল ২ · রোমান্টিক', icon: '💋' },
  3: { name: 'লেভেল ৩ · ইন্টিমেট', icon: '🔥' },
};
const GENDERS = { any: '👫 সবার জন্য', male: '♂️ পুরুষ', female: '♀️ নারী' };
const MOODS = { any: 'যেকোনো', romantic: 'রোমান্টিক', naughty: 'দুষ্টু', tired: 'ক্লান্ত' };
const EMPTY = { title: '', kind: 'action', level: 1, mood: 'any', seconds: 0, image_url: '', gender: 'any' };
const GEMPTY = { kind: 'gift', name: '', emoji: '🎁', level: 1, points: 5, price: 10, image_url: '' };
const BOXES = [
  ['action', '📦 বক্স ১ · কী করবেন', 'যে ডাইস ফেলছে তার লিঙ্গ অনুযায়ী আসবে (যেমন: ম্যাসাজ, চুমু)'],
  ['modifier', '📦 বক্স ২ · কোথায়/কীভাবে', 'পার্টনারের লিঙ্গ অনুযায়ী আসবে (যেমন: ঘাড়, ধীরে ধীরে)'],
];
const BUCKET = 'card-images';
// চাকার ডিফল্ট সেগমেন্ট: [লেভেল, 'চাকায় যা দেখাবে | ফলাফলে যা দেখাবে']
const WHEEL_DEFAULTS = [
  [1, 'চুমু | ১ মিনিট ধীরে ধীরে চুমু দিন'], [1, 'ম্যাসাজ | ৫ মিনিট কাঁধ ও পিঠে ম্যাসাজ দিন'], [1, 'আলিঙ্গন | চোখ বন্ধ করে ২ মিনিট জড়িয়ে থাকুন'],
  [1, 'ফিসফিস | কানে ফিসফিস করে একটা প্রশংসা করুন'], [1, 'নাচ | একটা গানে ধীরে ধীরে নাচুন'], [1, 'হাত ধরা | আঙুলে আঙুল জড়িয়ে ৩ মিনিট কথা বলুন'],
  [1, 'চোখে চোখ | ১ মিনিট চোখে চোখ রেখে থাকুন'], [1, 'প্রশংসা | আমার ৩টা জিনিস বলুন যা আপনার ভালো লাগে'],
  [2, 'চোখ বাঁধা | একজনের চোখ বেঁধে পালক বা বরফে অনুভূতি জাগান'], [2, 'রোলপ্লে | অচেনা দুজনের প্রথম সাক্ষাৎ অভিনয় করুন'],
  [2, 'টিজ | দীর্ঘ চুমু আর আদর, কিন্তু সীমা মেনে'], [2, 'ড্রেসআপ | পার্টনারের পছন্দের পোশাক পরুন'],
  [2, 'ঘাড়ে চুমু | গলা ও কাঁধে ধীরে ধীরে চুমু দিন'], [2, 'তেল ম্যাসাজ | হালকা গরম তেলে সারা শরীরে ম্যাসাজ'],
  [2, 'নিয়ন্ত্রণ | আজ কে নেতৃত্ব দেবে বেছে নিন'], [2, 'ফ্যান্টাসি | নিজের একটা ফ্যান্টাসি ফিসফিস করে বলুন'],
  [3, 'শাওয়ার | একসাথে গরম শাওয়ারে ঘনিষ্ঠ হোন'], [3, 'স্ট্রিপটিজ | ধীরে ধীরে একটা একটা করে পোশাক খুলুন'],
  [3, 'টিজ ও অপেক্ষা | কাছে এনে থেমে যান, প্রত্যাশা বাড়ান'], [3, 'রোলপ্লে+ | বস ও সেক্রেটারির দৃশ্য অভিনয় করুন'],
  [3, 'নেতৃত্ব | পার্টনার ৫ মিনিট পুরো নেতৃত্ব দেবে'], [3, 'নতুন জায়গা | ঘরের অন্য জায়গায় ঘনিষ্ঠ হোন'],
  [3, 'গোপন কথা | কানে খোলামেলা একটা ইচ্ছা বলুন'], [3, 'আপনার পছন্দ | পার্টনার একটা ইচ্ছা বেছে নেবে, আপনি রাজি হলে পূরণ'],
];
// স্ক্র্যাচ কার্ডের ডিফল্ট: [লেভেল, 'কার্ডের শিরোনাম | ভেতরের বার্তা']
const SCRATCH_DEFAULTS = [
  [1, 'মিষ্টি চুমু | পার্টনারের গালে ও কপালে ৫টি চুমু দিন'], [1, 'প্রশংসা | আজ আমার সবচেয়ে ভালো লাগার ৩টা জিনিস বলুন'],
  [1, 'আলিঙ্গন | ১ মিনিট কথা না বলে জড়িয়ে থাকুন'], [1, 'ম্যাসাজ | ৩ মিনিট কাঁধে ম্যাসাজ দিন'],
  [1, 'গান | পার্টনারের প্রিয় গান বাজিয়ে একসাথে নাচুন'], [1, 'ফিসফিস | কানে ফিসফিস করে একটা মিষ্টি কথা বলুন'],
  [2, 'চোখ বাঁধা | ৫ মিনিট চোখ বেঁধে আদর ও অনুমানের খেলা'], [2, 'রোলপ্লে | অচেনা দুজনের প্রথম দেখা অভিনয় করুন'],
  [2, 'তেল ম্যাসাজ | পিঠ ও কোমরে হালকা গরম তেলে ম্যাসাজ'], [2, 'টিজ | চুমু আর স্পর্শ, তবে এখনই বেশি নয়'],
  [2, 'ফ্যান্টাসি | নিজের একটা গোপন ইচ্ছা ফিসফিস করে বলুন'], [2, 'ড্রেসআপ | পার্টনারের পছন্দের পোশাকে সাজুন'],
  [3, 'শাওয়ার | একসাথে গরম শাওয়ারে ঘনিষ্ঠ হোন'], [3, 'ধীর নাচ | আলো কমিয়ে ধীরে ধীরে নাচতে নাচতে পোশাক খুলুন'],
  [3, 'নেতৃত্ব | আজ রাতে পার্টনার ১০ মিনিট পুরো নেতৃত্ব দেবে'], [3, 'নতুন জায়গা | ঘরের অন্য কোনো জায়গায় ঘনিষ্ঠ হোন'],
  [3, 'প্রত্যাশা | কাছে এনে থেমে যান, প্রত্যাশা বাড়ান'], [3, 'গোপন কথা | কানে খোলামেলা একটা ইচ্ছা বলুন'],
];
const SCRATCH_DEF = { text: '✨ স্ক্র্যাচ করুন', threshold: 55, imageMode: 'above', colors: { 1: '#d9b36a', 2: '#c9788a', 3: '#8e2a3c' } };
const WHEEL_COLORS = {
  1: ['#f3d9b1', '#e8b9a0', '#d9c28a', '#e5a9a9'],
  2: ['#d9a35f', '#c9788a', '#b98a4a', '#a65f78'],
  3: ['#8e2a3c', '#5b1d4a', '#b0533a', '#3d1a40'],
};
const wheelParts = (t) => {
  const [l, ...r] = String(t || '').split('|');
  return { label: l.trim(), detail: r.join('|').trim() };
};
// অ্যাডমিনের প্রিভিউ চাকা (SVG স্ট্রিং)
const miniWheel = (segs, level) => {
  const n = segs.length; const R = 138; const step = 360 / Math.max(n, 1);
  const pal = WHEEL_COLORS[level] || WHEEL_COLORS[1];
  const P = (deg, r) => { const t = ((deg - 90) * Math.PI) / 180; return [150 + r * Math.cos(t), 150 + r * Math.sin(t)]; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let body = '';
  segs.forEach((s, i) => {
    const [x1, y1] = P(i * step, R); const [x2, y2] = P((i + 1) * step, R);
    const [tx, ty] = P((i + 0.5) * step, 92); const th = (i + 0.5) * step;
    const rot = th - 90 + (th > 180 ? 180 : 0);
    const lab = wheelParts(s.title).label; const txt = lab.length > 12 ? lab.slice(0, 11) + '…' : lab;
    body += n === 1 ? `<circle cx="150" cy="150" r="${R}" fill="${pal[0]}"/>`
      : `<path d="M150,150 L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${step > 180 ? 1 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${pal[i % pal.length]}" stroke="#d4af37" stroke-width="1.5"/>`;
    body += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="${n <= 8 ? 13 : 10.5}" font-weight="700" text-anchor="middle" dominant-baseline="middle" fill="${level === 3 ? '#fff3d6' : '#3a2318'}" transform="rotate(${rot.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${esc(txt)}</text>`;
  });
  return `<svg viewBox="0 0 300 300" style="width:100%;height:100%"><circle cx="150" cy="150" r="146" fill="#1c1410" stroke="#d4af37" stroke-width="4"/>${body}<circle cx="150" cy="150" r="22" fill="#2a2420" stroke="#d4af37" stroke-width="3"/><path d="M140,2 L160,2 L150,24 Z" fill="#d4af37"/></svg>`;
};
const PEMPTY = { gender: 'female', name: '', bust: 60, waist: 40, hips: 65, belly: 25, thighs: 60 };
const IEMPTY = { name: '', slot: 'top', shape: 'crop_top', color: '#ff3d7f', gender: 'female', level: 1, price: 20, image_url: '' };
const SEMPTY = { name: '', emoji: '👗', gender: 'female', look: {} };


// ================= নেভিগেশন (মূল ট্যাব → উপ-ট্যাব) =================
// 'avatar:xxx' মানে অ্যাভাটার সেকশনের ভেতরের উপ-ট্যাব
const NAV = [
  { key: 'home', icon: '🏠', label: 'ড্যাশবোর্ড', desc: 'পুরো অ্যাপের এক নজরে অবস্থা, আর কোন কাজ বাকি তার তালিকা।',
    subs: [['home', '📊 ওভারভিউ']] },
  { key: 'games', icon: '🎮', label: 'গেম', desc: 'ডাইস, চাকা আর কার্ড/ট্রুথ/ডেয়ারের কনটেন্ট এখান থেকে নিয়ন্ত্রণ করুন।',
    subs: [['dice', '🎲 ডাইস বক্স'], ['wheel', '🎡 ইচ্ছার চাকা'], ['scratch', '🎟️ স্ক্র্যাচ কার্ড'], ['all', '📋 কার্ড · ট্রুথ · ডেয়ার']] },
  { key: 'gifts', icon: '🎁', label: 'গিফট', desc: 'গিফট কার্ড, মিস্ট্রি বক্স, কয়েনের নিয়ম আর ইউজারকে সরাসরি উপহার দেওয়া।',
    subs: [['gifts', '🎴 গিফট কার্ড'], ['coins', '🪙 কয়েন ও উপহার']] },
  { key: 'avatar', icon: '👗', label: 'অ্যাভাটার', desc: 'মডেলের শরীরের গড়ন, পোশাক, থিম সেট আর ইউজারকে পোশাক উপহার।',
    subs: [['avatar:presets', '🧍 বডি গড়ন'], ['avatar:items', '👙 পোশাক'], ['avatar:sets', '🎭 থিম সেট'], ['avatar:give', '👑 উপহার']] },
  { key: 'settings', icon: '⚙️', label: 'সেটিংস', desc: 'অ্যাপজুড়ে ব্যবহৃত লেভেলের নাম ও আইকন।',
    subs: [['levels', '🏷️ লেভেল নাম']] },
];

const ADM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');
.adm{font-family:'Hind Siliguri',system-ui,sans-serif;color:#f5ecd7;min-height:100vh;-webkit-font-smoothing:antialiased}
.adm *{box-sizing:border-box}
.adm a{color:inherit;text-decoration:none}
.adm h3{font-size:16px;font-weight:700;color:#f2d98a;margin:24px 0 8px;letter-spacing:.01em}
.adm input:focus,.adm select:focus,.adm textarea:focus{outline:none;border-color:#d4af37 !important;box-shadow:0 0 0 3px rgba(212,175,55,.22)}
.adm select option{background:#1a0d22;color:#f5ecd7}
.adm input[type=range]{accent-color:#d4af37}
.adm button{font-family:inherit;transition:transform .12s,filter .15s}
.adm button:hover:not(:disabled){filter:brightness(1.1)}
.adm button:active:not(:disabled){transform:scale(.97)}
.adm button:disabled{opacity:.5;cursor:not-allowed}
.adm small{color:#c9a5b4}
.adm-head{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;background:linear-gradient(180deg,rgba(28,6,30,.96),rgba(14,3,18,.9));-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid rgba(212,175,55,.25);box-shadow:0 8px 28px rgba(0,0,0,.45)}
.adm-logo{display:flex;align-items:center;gap:10px}
.adm-logo .mark{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-size:20px;background:linear-gradient(135deg,#f6e3a1,#d4af37);box-shadow:0 0 18px -4px #d4af37}
.adm-logo b{display:block;font-size:18px;line-height:1.1;background:linear-gradient(90deg,#f6e3a1,#d4af37,#ffb6cf);-webkit-background-clip:text;background-clip:text;color:transparent}
.adm-logo span{font-size:11px;letter-spacing:.18em;color:#c9a5b4}
.adm-back{padding:8px 14px;border-radius:999px;border:1px solid rgba(212,175,55,.45);font-size:13px;font-weight:600;color:#f2d98a;background:rgba(212,175,55,.08)}
.adm-main{display:flex;gap:8px;overflow-x:auto;padding:12px 14px 4px;scrollbar-width:none;max-width:860px;margin:0 auto}
.adm-main::-webkit-scrollbar,.adm-sub::-webkit-scrollbar{display:none}
.adm-main button{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:78px;padding:9px 10px 8px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#eadfcb;font-size:13px;font-weight:600;cursor:pointer}
.adm-main button .i{font-size:24px;line-height:1.1}
.adm-main button.on{background:linear-gradient(160deg,#f6e3a1,#d4af37);color:#2a1b05;border-color:#d4af37;box-shadow:0 8px 22px -6px rgba(212,175,55,.7)}
.adm-sub{display:flex;gap:6px;overflow-x:auto;padding:8px 14px 2px;scrollbar-width:none;max-width:860px;margin:0 auto}
.adm-sub button{flex:0 0 auto;padding:7px 15px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:transparent;color:#d9c9b0;font-size:13px;font-weight:600;cursor:pointer}
.adm-sub button.on{border-color:#d4af37;color:#f2d98a;background:rgba(212,175,55,.14)}
.adm-desc{margin:10px 0 4px;padding:11px 14px;border-radius:14px;border-left:3px solid #d4af37;background:rgba(212,175,55,.07);font-size:13px;color:#e6d6b8;line-height:1.55}
.adm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:12px 0}
.adm-stat{text-align:left;padding:14px;border-radius:18px;border:1px solid rgba(212,175,55,.22);background:linear-gradient(160deg,rgba(255,255,255,.08),rgba(255,255,255,.02));color:#f5ecd7;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.35)}
.adm-stat .ico{font-size:26px}
.adm-stat .num{font-size:28px;font-weight:700;color:#f2d98a;line-height:1.1;margin-top:4px}
.adm-stat .num small{font-size:13px;color:#c9a5b4;font-weight:500}
.adm-stat .lab{font-size:13px;color:#e6d6b8;margin-top:2px}
.adm-quick{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}
.adm-warn{padding:10px 14px;border-radius:14px;margin:6px 0;font-size:14px;background:rgba(255,160,60,.1);border:1px solid rgba(255,160,60,.35);color:#ffd9a0}
.adm-ok{padding:12px 14px;border-radius:14px;font-size:14px;background:rgba(61,220,132,.1);border:1px solid rgba(61,220,132,.35);color:#b9f3d3}
.adm-toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:50;max-width:92vw;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:600;color:#2a1b05;background:linear-gradient(135deg,#f6e3a1,#d4af37);box-shadow:0 12px 34px rgba(0,0,0,.55);cursor:pointer;animation:admpop .25s ease}
@keyframes admpop{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
`;

// ছবি ছোট করে JPEG বানায় (ফ্রি স্টোরেজ বাঁচাতে + দ্রুত লোডের জন্য)
const shrink = (file) => new Promise((res, rej) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const max = 900;
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((b) => (b ? res(b) : rej(new Error('ছবি প্রসেস করা যায়নি'))), 'image/jpeg', 0.82);
  };
  img.onerror = () => rej(new Error('ছবি পড়া যায়নি'));
  img.src = url;
});

// ছবি/GIF আপলোড: GIF হলে মূল ফাইলই (অ্যানিমেশন ঠিক রাখতে), অন্য ছবি ছোট করে JPEG
const uploadMedia = async (file) => {
  const isGif = file.type === 'image/gif';
  if (!file.type.startsWith('image/')) throw new Error('শুধু ছবি বা GIF দিন');
  if (isGif && file.size > 6 * 1024 * 1024) throw new Error('GIF ৬MB-এর বেশি বড়। ছোট করে আবার দিন');
  if (file.size > 15 * 1024 * 1024) throw new Error('ছবি ১৫MB-এর বেশি বড়');
  const blob = isGif ? file : await shrink(file);
  const path = `scr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${isGif ? 'gif' : 'jpg'}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: isGif ? 'image/gif' : 'image/jpeg' });
  if (error) throw new Error('ছবি আপলোড হয়নি: ' + error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

export default function Admin() {
  const [ok, setOk] = useState(null);
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('home');
  const [wf, setWf] = useState({ label: '', detail: '', level: 1, seconds: 0 });
  const [wLevel, setWLevel] = useState(1);
  const [sf, setSf] = useState({ label: '', detail: '', level: 1, seconds: 0 });
  const [sLevel, setSLevel] = useState(1);
  const [scfg, setScfg] = useState(SCRATCH_DEF);
  const [sFile, setSFile] = useState(null);
  const [sPrev, setSPrev] = useState('');
  const [diceG, setDiceG] = useState('any');
  const [qa, setQa] = useState({ action: { title: '', level: 1 }, modifier: { title: '', level: 1 } });
  const [levels, setLevels] = useState(DEF_LEVELS);
  // গিফট
  const [gifts, setGifts] = useState([]);
  const [gf, setGf] = useState(GEMPTY);
  const [gEditId, setGEditId] = useState(null);
  const [gFile, setGFile] = useState(null);
  const [gPrev, setGPrev] = useState('');
  const [rules, setRules] = useState([{ level: 1, coins: 5 }, { level: 2, coins: 10 }, { level: 3, coins: 20 }]);
  const [giveF, setGiveF] = useState({ email: '', coins: 0, gift: '', qty: 1 });
  // অ্যাভাটার
  const [aview, setAview] = useState('presets');
  const [presets, setPresets] = useState([]);
  const [pf, setPf] = useState(PEMPTY);
  const [pEditId, setPEditId] = useState(null);
  const [aItems, setAItems] = useState([]);
  const [itf, setItf] = useState(IEMPTY);
  const [iEditId, setIEditId] = useState(null);
  const [iFile, setIFile] = useState(null);
  const [aSets, setASets] = useState([]);
  const [stf, setStf] = useState(SEMPTY);
  const [giveItem, setGiveItem] = useState({ email: '', item: '' });

  // মেসেজ কিছুক্ষণ পর নিজে থেকে মুছে যাবে
  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => setMsg(''), 5000);
    return () => clearTimeout(t);
  }, [msg]);

  const load = async () => {
    const { data } = await supabase.from('activities').select('*').order('id');
    setList(data || []);
    const { data: lv } = await supabase.from('levels').select('*').order('id');
    if (lv?.length) {
      setLevels((prev) => {
        const n = { ...prev };
        lv.forEach((r) => { n[r.id] = { name: r.name, icon: r.icon || prev[r.id]?.icon || '' }; });
        return n;
      });
    }
    const { data: st } = await supabase.from('app_settings').select('value').eq('key', 'scratch').maybeSingle();
    if (st?.value) setScfg({ ...SCRATCH_DEF, ...st.value, colors: { ...SCRATCH_DEF.colors, ...(st.value.colors || {}) } });
    const { data: gs } = await supabase.from('gifts').select('*').order('level').order('id');
    setGifts(gs || []);
    const { data: cr } = await supabase.from('coin_rules').select('*').order('level');
    if (cr?.length) setRules(cr);
    const { data: bp } = await supabase.from('body_presets').select('*').order('id');
    setPresets(bp || []);
    const { data: ai } = await supabase.from('avatar_items').select('*').order('slot').order('id');
    setAItems(ai || []);
    const { data: as } = await supabase.from('avatar_sets').select('*').order('id');
    setASets(as || []);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (!u) return setOk(false);
      const { data: p } = await supabase.from('profiles').select('role').eq('id', u.id).single();
      if (p?.role === 'admin') { setOk(true); load(); } else setOk(false);
    })();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setMsg('শুধু ছবি দিন'); return; }
    if (f.size > 15 * 1024 * 1024) { setMsg('ছবি ১৫MB-এর বেশি বড়'); return; }
    setMsg('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const removeImage = () => { setFile(null); setPreview(''); set('image_url', ''); };

  const resetForm = () => { setForm(EMPTY); setEditId(null); setFile(null); setPreview(''); };

  const save = async () => {
    if (!form.title.trim()) return setMsg('নাম লিখুন');
    setBusy(true);
    try {
      let image_url = ['card', 'scratch'].includes(form.kind) ? (form.image_url || null) : null;
      if (file && ['card', 'scratch'].includes(form.kind)) {
        image_url = await uploadMedia(file);
      }
      const row = {
        title: form.title.trim(),
        kind: form.kind,
        level: Number(form.level),
        mood: form.mood,
        seconds: Number(form.seconds) || 0,
        image_url,
        gender: ['action', 'modifier'].includes(form.kind) ? form.gender : 'any',
      };
      const { error } = editId
        ? await supabase.from('activities').update(row).eq('id', editId)
        : await supabase.from('activities').insert(row);
      if (error) return setMsg(error.message);
      setMsg(editId ? 'আপডেট হয়েছে' : 'যোগ হয়েছে');
      resetForm(); load();
    } catch (e) {
      setMsg(e.message || 'কিছু একটা ভুল হয়েছে');
    } finally {
      setBusy(false);
    }
  };

  const edit = (a) => {
    setEditId(a.id);
    setFile(null); setPreview('');
    setForm({ title: a.title, kind: a.kind, level: a.level, mood: a.mood, seconds: a.seconds, image_url: a.image_url || '', gender: a.gender || 'any' });
    setView('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ডাইস বক্সে দ্রুত অপশন যোগ
  const quickAdd = async (kind) => {
    const q = qa[kind];
    if (!q.title.trim()) return setMsg('লেখা দিন');
    const { error } = await supabase.from('activities').insert({
      title: q.title.trim(), kind, level: Number(q.level), mood: 'any', seconds: 0, gender: diceG, image_url: null,
    });
    if (error) return setMsg(error.message);
    setQa((p) => ({ ...p, [kind]: { ...p[kind], title: '' } }));
    setMsg('✅ বক্সে যোগ হয়েছে');
    load();
  };

  const saveLevels = async () => {
    const rows = [1, 2, 3].map((id) => ({
      id,
      name: (levels[id]?.name || '').trim() || DEF_LEVELS[id].name,
      icon: (levels[id]?.icon || '').trim() || DEF_LEVELS[id].icon,
    }));
    const { error } = await supabase.from('levels').upsert(rows, { onConflict: 'id' });
    if (error) return setMsg('সেভ হয়নি: ' + error.message);
    setMsg('✅ লেভেলের নাম সেভ হয়েছে');
    load();
  };
  const setLv = (id, k, v) => setLevels((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));

  const cancel = () => { resetForm(); setMsg(''); };

  const toggle = async (a) => {
    await supabase.from('activities').update({ is_active: !a.is_active }).eq('id', a.id);
    load();
  };

  const del = async (a) => {
    if (!confirm('মুছবেন?')) return;
    const { error } = await supabase.from('activities').delete().eq('id', a.id);
    if (error) setMsg('মুছা যায়নি (আগে রোল হয়েছে)। বন্ধ করে রাখুন।');
    load();
  };

  // ---------- গিফট ----------
  const setG = (k, v) => setGf((f) => ({ ...f, [k]: v }));

  const pickGiftFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return setMsg('শুধু ছবি দিন');
    if (f.size > 15 * 1024 * 1024) return setMsg('ছবি ১৫MB-এর বেশি বড়');
    setMsg(''); setGFile(f); setGPrev(URL.createObjectURL(f));
  };

  const resetGift = () => { setGf(GEMPTY); setGEditId(null); setGFile(null); setGPrev(''); };

  const saveGift = async () => {
    if (!gf.name.trim()) return setMsg('নাম লিখুন');
    setBusy(true);
    try {
      let image_url = gf.image_url || null;
      if (gFile) {
        const blob = await shrink(gFile);
        const path = `gift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
        if (upErr) { setMsg('ছবি আপলোড হয়নি: ' + upErr.message); return; }
        image_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }
      const row = {
        kind: gf.kind,
        name: gf.name.trim(),
        emoji: (gf.emoji || '').trim() || '🎁',
        level: Number(gf.level) || 1,
        points: Number(gf.points) || 0,
        price: Number(gf.price) || 0,
        image_url,
      };
      const { error } = gEditId
        ? await supabase.from('gifts').update(row).eq('id', gEditId)
        : await supabase.from('gifts').insert(row);
      if (error) return setMsg(error.message);
      setMsg(gEditId ? '✅ আপডেট হয়েছে' : '✅ গিফট কার্ড যোগ হয়েছে');
      resetGift(); load();
    } catch (e) {
      setMsg(e.message || 'কিছু একটা ভুল হয়েছে');
    } finally {
      setBusy(false);
    }
  };

  const editGift = (g) => {
    setGEditId(g.id); setGFile(null); setGPrev('');
    setGf({ kind: g.kind, name: g.name, emoji: g.emoji || '🎁', level: g.level, points: g.points, price: g.price, image_url: g.image_url || '' });
    setView('gifts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleGift = async (g) => {
    await supabase.from('gifts').update({ is_active: !g.is_active }).eq('id', g.id);
    load();
  };

  const delGift = async (g) => {
    if (!confirm('মুছবেন?')) return;
    const { error } = await supabase.from('gifts').delete().eq('id', g.id);
    if (error) setMsg('মুছা যায়নি (কারও কাছে আছে)। বন্ধ করে রাখুন।');
    load();
  };

  const saveRules = async () => {
    const { error } = await supabase.from('coin_rules')
      .upsert(rules.map((r) => ({ level: r.level, coins: Number(r.coins) || 0 })), { onConflict: 'level' });
    setMsg(error ? error.message : '✅ কয়েনের নিয়ম সেভ হয়েছে');
  };

  const giveToUser = async () => {
    if (!giveF.email.trim()) return setMsg('ইমেইল দিন');
    const { error } = await supabase.rpc('admin_give', {
      p_email: giveF.email,
      p_coins: Number(giveF.coins) || 0,
      p_gift: giveF.gift ? Number(giveF.gift) : null,
      p_qty: Number(giveF.qty) || 1,
    });
    setMsg(error ? error.message : '✅ দেওয়া হয়েছে');
  };

  // ---------- অ্যাভাটার ----------
  const savePreset = async () => {
    if (!pf.name.trim()) return setMsg('প্রিসেটের নাম লিখুন');
    const row = { gender: pf.gender, name: pf.name.trim() };
    BODY_KEYS.forEach(([k]) => { row[k] = Math.max(0, Math.min(100, Number(pf[k]) || 0)); });
    const { error } = pEditId
      ? await supabase.from('body_presets').update(row).eq('id', pEditId)
      : await supabase.from('body_presets').insert(row);
    if (error) return setMsg(error.message);
    setMsg(pEditId ? '✅ আপডেট হয়েছে' : '✅ প্রিসেট যোগ হয়েছে');
    setPf(PEMPTY); setPEditId(null); load();
  };
  const editPreset = (b) => {
    setPEditId(b.id);
    setPf({ gender: b.gender, name: b.name, bust: b.bust, waist: b.waist, hips: b.hips, belly: b.belly, thighs: b.thighs });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const togglePreset = async (b) => { await supabase.from('body_presets').update({ is_active: !b.is_active }).eq('id', b.id); load(); };
  const delPreset = async (b) => {
    if (!confirm('মুছবেন?')) return;
    const { error } = await supabase.from('body_presets').delete().eq('id', b.id);
    if (error) setMsg(error.message);
    load();
  };

  const setItem = (k, v) => setItf((f) => {
    const n = { ...f, [k]: v };
    if (k === 'slot') n.shape = (SHAPES[v] || [[]])[0][0];
    return n;
  });
  const saveItem = async () => {
    if (!itf.name.trim()) return setMsg('নাম লিখুন');
    setBusy(true);
    try {
      let image_url = itf.image_url || null;
      if (iFile) {
        const blob = await shrink(iFile);
        const path = `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
        if (upErr) { setMsg('ছবি আপলোড হয়নি: ' + upErr.message); return; }
        image_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      }
      const row = {
        name: itf.name.trim(), slot: itf.slot, shape: itf.shape, color: itf.color,
        gender: itf.gender, level: Number(itf.level) || 1, price: Math.max(0, Number(itf.price) || 0), image_url,
      };
      const { error } = iEditId
        ? await supabase.from('avatar_items').update(row).eq('id', iEditId)
        : await supabase.from('avatar_items').insert(row);
      if (error) return setMsg(error.message);
      setMsg(iEditId ? '✅ আপডেট হয়েছে' : '✅ আইটেম যোগ হয়েছে');
      setItf(IEMPTY); setIEditId(null); setIFile(null); load();
    } catch (e) {
      setMsg(e.message || 'কিছু একটা ভুল হয়েছে');
    } finally {
      setBusy(false);
    }
  };
  const editItem = (a) => {
    setIEditId(a.id); setIFile(null);
    setItf({ name: a.name, slot: a.slot, shape: a.shape, color: a.color, gender: a.gender, level: a.level, price: a.price, image_url: a.image_url || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toggleItem = async (a) => { await supabase.from('avatar_items').update({ is_active: !a.is_active }).eq('id', a.id); load(); };
  const delItem = async (a) => {
    if (!confirm('মুছবেন? যাদের কাছে আছে তাদের কাছ থেকেও যাবে।')) return;
    const { error } = await supabase.from('avatar_items').delete().eq('id', a.id);
    if (error) setMsg(error.message);
    load();
  };

  const saveSet = async () => {
    if (!stf.name.trim()) return setMsg('সেটের নাম লিখুন');
    const look = {};
    Object.entries(stf.look).forEach(([k, v]) => { if (v) look[k] = Number(v); });
    if (!Object.keys(look).length) return setMsg('কমপক্ষে একটি আইটেম বাছুন');
    const { error } = await supabase.from('avatar_sets').insert({ name: stf.name.trim(), emoji: stf.emoji || '👗', gender: stf.gender, look });
    if (error) return setMsg(error.message);
    setMsg('✅ থিম সেট যোগ হয়েছে'); setStf(SEMPTY); load();
  };
  const toggleSet = async (a) => { await supabase.from('avatar_sets').update({ is_active: !a.is_active }).eq('id', a.id); load(); };
  const delSet = async (a) => {
    if (!confirm('মুছবেন?')) return;
    await supabase.from('avatar_sets').delete().eq('id', a.id);
    load();
  };
  const giveItemTo = async () => {
    if (!giveItem.email.trim() || !giveItem.item) return setMsg('ইমেইল ও আইটেম বাছুন');
    const { error } = await supabase.rpc('admin_give_item', { p_email: giveItem.email, p_item: Number(giveItem.item) });
    setMsg(error ? error.message : '✅ আইটেম দেওয়া হয়েছে');
  };

  // ---------- স্ক্র্যাচ কার্ড ----------
  const addScratch = async () => {
    if (!sf.label.trim()) return setMsg('কার্ডের শিরোনাম লিখুন');
    const title = sf.detail.trim() ? `${sf.label.trim()} | ${sf.detail.trim()}` : sf.label.trim();
    setBusy(true);
    try {
      const image_url = sFile ? await uploadMedia(sFile) : null;
      const { error } = await supabase.from('activities').insert({
        title, kind: 'scratch', level: Number(sf.level), mood: 'any', seconds: Number(sf.seconds) || 0, gender: 'any', image_url,
      });
      if (error) return setMsg(error.message);
      setSf((p) => ({ ...p, label: '', detail: '' }));
      setSFile(null); setSPrev('');
      setMsg('✅ স্ক্র্যাচ কার্ড যোগ হয়েছে');
      load();
    } catch (e) {
      setMsg(e.message || 'কিছু একটা ভুল হয়েছে');
    } finally {
      setBusy(false);
    }
  };
  const pickScratchFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return setMsg('শুধু ছবি বা GIF দিন');
    setSFile(f); setSPrev(URL.createObjectURL(f));
  };
  const setScratchImage = async (s, f) => {
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadMedia(f);
      const { error } = await supabase.from('activities').update({ image_url: url }).eq('id', s.id);
      setMsg(error ? error.message : '✅ ছবি আপডেট হয়েছে');
      load();
    } catch (e) {
      setMsg(e.message || 'কিছু একটা ভুল হয়েছে');
    } finally {
      setBusy(false);
    }
  };
  const clearScratchImage = async (s) => {
    const { error } = await supabase.from('activities').update({ image_url: null }).eq('id', s.id);
    setMsg(error ? error.message : '✅ ছবি সরানো হয়েছে');
    load();
  };
  const addScratchDefaults = async () => {
    const have = list.filter((x) => x.kind === 'scratch').length;
    if (have > 0 && !confirm(`আগে থেকে ${have}টি কার্ড আছে। ডিফল্টগুলো আরও যোগ করবেন?`)) return;
    const rows = SCRATCH_DEFAULTS.map(([level, title]) => ({ title, kind: 'scratch', level, mood: 'any', seconds: 0, gender: 'any', image_url: null }));
    const { error } = await supabase.from('activities').insert(rows);
    setMsg(error ? error.message : '✅ ডিফল্ট স্ক্র্যাচ কার্ড যোগ হয়েছে');
    load();
  };
  const saveScratchCfg = async () => {
    const value = {
      text: (scfg.text || '').trim() || SCRATCH_DEF.text,
      threshold: Math.min(90, Math.max(20, Number(scfg.threshold) || 55)),
      imageMode: scfg.imageMode === 'cover' ? 'cover' : 'above',
      colors: scfg.colors,
    };
    const { error } = await supabase.from('app_settings').upsert({ key: 'scratch', value }, { onConflict: 'key' });
    setMsg(error ? error.message : '✅ স্ক্র্যাচ সেটিংস সেভ হয়েছে');
  };

  // ---------- চাকা ----------
  const addWheel = async () => {
    if (!wf.label.trim()) return setMsg('চাকায় যা দেখাবে সেই নাম লিখুন');
    const title = wf.detail.trim() ? `${wf.label.trim()} | ${wf.detail.trim()}` : wf.label.trim();
    const { error } = await supabase.from('activities').insert({
      title, kind: 'wheel', level: Number(wf.level), mood: 'any', seconds: Number(wf.seconds) || 0, gender: 'any', image_url: null,
    });
    if (error) return setMsg(error.message);
    setWf((p) => ({ ...p, label: '', detail: '' }));
    setMsg('✅ সেগমেন্ট যোগ হয়েছে');
    load();
  };
  const addWheelDefaults = async () => {
    const have = list.filter((x) => x.kind === 'wheel').length;
    if (have > 0 && !confirm(`আগে থেকে ${have}টি সেগমেন্ট আছে। ডিফল্টগুলো আরও যোগ করবেন?`)) return;
    const rows = WHEEL_DEFAULTS.map(([level, title]) => ({ title, kind: 'wheel', level, mood: 'any', seconds: 0, gender: 'any', image_url: null }));
    const { error } = await supabase.from('activities').insert(rows);
    setMsg(error ? error.message : '✅ ডিফল্ট সেগমেন্ট যোগ হয়েছে');
    load();
  };

  const page = {
    background: 'radial-gradient(circle at 12% 0%, #3d0b3a 0, transparent 42%), radial-gradient(circle at 92% 18%, #2a0a3e 0, transparent 38%), radial-gradient(circle at 50% 110%, #4a0f1c 0, transparent 50%), #0b0210',
  };
  const box = { maxWidth: 760, margin: '0 auto', padding: '8px 14px 96px' };
  const inp = {
    width: '100%', padding: '11px 13px', margin: '6px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,.14)',
    background: 'rgba(0,0,0,.38)', color: '#f5ecd7', boxSizing: 'border-box', fontSize: 16, fontFamily: 'inherit',
  };
  const btn = {
    padding: '10px 18px', margin: 4, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ff3d7f,#7a1fa2)',
    color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 18px rgba(0,0,0,.35)',
  };
  const chip = (on) => ({
    padding: '7px 14px', margin: 3, borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    border: on ? '1px solid #d4af37' : '1px solid rgba(255,255,255,.14)',
    background: on ? 'linear-gradient(135deg,#f6e3a1,#d4af37)' : 'rgba(255,255,255,.06)',
    color: on ? '#2a1b05' : '#eadfcb',
  });
  const lbl = { fontSize: 13, color: '#c9a5b4', marginTop: 10, display: 'block' };

  if (ok === null) return (
    <div className="adm" style={{ ...page, display: 'grid', placeItems: 'center' }}>
      <style>{ADM_CSS}</style>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 40 }}>⚙️</div><div style={{ color: '#f2d98a' }}>লোড হচ্ছে...</div></div>
    </div>
  );
  if (!ok) return (
    <div className="adm" style={{ ...page, display: 'grid', placeItems: 'center', padding: 20 }}>
      <style>{ADM_CSS}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>🔒</div>
        <p>শুধু অ্যাডমিন ঢুকতে পারবে।</p>
        <a href="/" className="adm-back">← হোমে যান</a>
      </div>
    </div>
  );

  const shown = list.filter((a) => filter === 'all' || a.kind === filter);
  const boxItems = (kind) => list.filter((a) => a.kind === kind && (a.gender || 'any') === diceG);
  const lvName = (n) => `${levels[n]?.icon || ''} ${levels[n]?.name || 'লেভেল ' + n}`;
  const panel = {
    background: 'linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02))', border: '1px solid rgba(212,175,55,.2)',
    padding: 16, borderRadius: 18, margin: '12px 0', boxShadow: '0 10px 30px rgba(0,0,0,.35)',
  };

  // নেভিগেশন হেল্পার
  const isOn = (k) => (k.startsWith('avatar:') ? view === 'avatar' && aview === k.slice(7) : view === k);
  const curSection = NAV.find((s) => s.subs.some(([k]) => isOn(k))) || NAV[0];
  const go = (k) => {
    if (k.startsWith('avatar:')) { setView('avatar'); setAview(k.slice(7)); } else setView(k);
    setMsg('');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const levelOptions = Object.keys(DEF_LEVELS).map((k) => <option key={k} value={k}>{lvName(k)}</option>);

  return (
    <div className="adm" style={page}>
      <style>{ADM_CSS}</style>

      <header className="adm-head">
        <div className="adm-logo">
          <div className="mark">💋</div>
          <div><b>Dice App</b><span>অ্যাডমিন কন্ট্রোল</span></div>
        </div>
        <a href="/" className="adm-back">← অ্যাপে ফিরুন</a>
      </header>

      <nav className="adm-main" aria-label="মূল ট্যাব">
        {NAV.map((s) => (
          <button key={s.key} className={curSection.key === s.key ? 'on' : ''} onClick={() => go(s.subs[0][0])}>
            <span className="i">{s.icon}</span>{s.label}
          </button>
        ))}
      </nav>
      {curSection.subs.length > 1 && (
        <nav className="adm-sub" aria-label="উপ ট্যাব">
          {curSection.subs.map(([k, l]) => (
            <button key={k} className={isOn(k) ? 'on' : ''} onClick={() => go(k)}>{l}</button>
          ))}
        </nav>
      )}

      <div style={box}>
      <div className="adm-desc">{curSection.icon} <b>{curSection.label}</b> · {curSection.desc}</div>

      {view === 'home' && (() => {
        const act = (arr) => arr.filter((x) => x.is_active !== false).length;
        const dice = list.filter((x) => x.kind === 'action' || x.kind === 'modifier');
        const td = list.filter((x) => x.kind === 'truth' || x.kind === 'dare');
        const cards = list.filter((x) => x.kind === 'card');
        const wheel = list.filter((x) => x.kind === 'wheel');
        const scratch = list.filter((x) => x.kind === 'scratch');
        const stats = [
          ['🎲', 'ডাইস অপশন', dice, 'dice'], ['🎡', 'চাকার সেগমেন্ট', wheel, 'wheel'], ['🎟️', 'স্ক্র্যাচ কার্ড', scratch, 'scratch'],
          ['💬', 'ট্রুথ · ডেয়ার', td, 'all'], ['🃏', 'কার্ড', cards, 'all'],
          ['🎁', 'গিফট কার্ড', gifts, 'gifts'], ['👙', 'পোশাক', aItems, 'avatar:items'],
          ['🧍', 'বডি গড়ন', presets, 'avatar:presets'], ['🎭', 'থিম সেট', aSets, 'avatar:sets'],
        ];
        const warn = [];
        [1, 2, 3].forEach((n) => {
          const c = wheel.filter((x) => x.level === n && x.is_active).length;
          if (c < 3) warn.push(['wheel', `🎡 চাকা · ${lvName(n)}: ${c}টি সেগমেন্ট আছে (কমপক্ষে ৩টি দরকার)`]);
        });
        [1, 2, 3].forEach((n) => {
          const c = scratch.filter((x) => x.level === n && x.is_active).length;
          if (c < 3) warn.push(['scratch', `🎟️ স্ক্র্যাচ · ${lvName(n)}: ${c}টি কার্ড আছে (কমপক্ষে ৩টি দরকার)`]);
        });
        [1, 2, 3].forEach((n) => {
          if (!gifts.some((g) => g.kind === 'gift' && g.level === n && g.is_active)) warn.push(['gifts', `🎁 ${lvName(n)} লেভেলে কোনো গিফট কার্ড নেই`]);
        });
        if (!gifts.some((g) => g.kind === 'mystery' && g.is_active)) warn.push(['gifts', '❓ কোনো মিস্ট্রি বক্স নেই']);
        ['action', 'modifier'].forEach((k) => {
          if (!list.some((x) => x.kind === k && x.is_active)) warn.push(['dice', `🎲 ডাইসের "${KINDS[k]}" বক্স খালি`]);
        });
        if (aItems.length === 0) warn.push(['avatar:items', '👙 এখনো কোনো পোশাক যোগ হয়নি']);
        if (presets.length === 0) warn.push(['avatar:presets', '🧍 এখনো কোনো বডি গড়ন (প্রিসেট) নেই']);
        return (
          <>
            <div className="adm-stats">
              {stats.map(([ico, lab, arr, key]) => (
                <button key={lab} className="adm-stat" onClick={() => go(key)}>
                  <div className="ico">{ico}</div>
                  <div className="num">{act(arr)}<small> / {arr.length}</small></div>
                  <div className="lab">{lab}</div>
                </button>
              ))}
            </div>
            <small>সংখ্যা = চালু / মোট। কার্ডে চাপলে সেই সেকশনে যাবে।</small>

            <h3>⚡ দ্রুত কাজ</h3>
            <div className="adm-quick">
              <button style={btn} onClick={() => go('gifts')}>➕ গিফট কার্ড</button>
              <button style={btn} onClick={() => go('wheel')}>🎡 চাকা এডিট</button>
              <button style={btn} onClick={() => go('coins')}>🪙 কয়েন দিন</button>
              <button style={btn} onClick={() => go('avatar:items')}>👙 পোশাক যোগ</button>
            </div>

            <h3>✅ প্রস্তুতি যাচাই</h3>
            {warn.length === 0
              ? <div className="adm-ok">সব ঠিক আছে, কোনো কাজ বাকি নেই 🎉</div>
              : warn.map(([key, t], i) => (
                <div key={i} className="adm-warn" style={{ cursor: 'pointer' }} onClick={() => go(key)}>{t} →</div>
              ))}
          </>
        );
      })()}

      {view === 'dice' && (
        <>
          <p style={{ fontSize: 13, color: '#aaa' }}>
            ডাইসে দুটি বক্স আসে। কোন লিঙ্গের জন্য অপশন বসাতে চান, আগে সেটা বাছুন। "সবার জন্য" দিলে যেকোনো লিঙ্গের কাছে আসবে।
          </p>
          <div>
            {Object.entries(GENDERS).map(([k, l]) =>
              <button key={k} style={chip(diceG === k)} onClick={() => setDiceG(k)}>{l}</button>)}
          </div>
          {BOXES.map(([kind, title, hint]) => (
            <div key={kind} style={panel}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>{title} ({boxItems(kind).length})</div>
              <small style={{ color: '#aaa' }}>{hint}</small>
              <div style={{ margin: '8px 0' }}>
                <input
                  style={inp}
                  placeholder="নতুন অপশন লিখুন"
                  value={qa[kind].title}
                  onChange={(e) => setQa((p) => ({ ...p, [kind]: { ...p[kind], title: e.target.value } }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') quickAdd(kind); }}
                />
                <select
                  style={inp}
                  value={qa[kind].level}
                  onChange={(e) => setQa((p) => ({ ...p, [kind]: { ...p[kind], level: e.target.value } }))}
                >
                  {levelOptions}
                </select>
                <button style={btn} onClick={() => quickAdd(kind)}>➕ বক্সে যোগ করুন</button>
              </div>
              {boxItems(kind).map((a) => (
                <div key={a.id} style={{ background: 'rgba(0,0,0,.35)', padding: 10, borderRadius: 8, margin: '6px 0', opacity: a.is_active ? 1 : 0.5 }}>
                  <div style={{ fontSize: 16 }}>{a.title}</div>
                  <small>{lvName(a.level)} · {a.is_active ? 'চালু' : 'বন্ধ'}</small>
                  <div>
                    <button style={{ ...btn, background: '#35507a', padding: '6px 12px', fontSize: 13 }} onClick={() => edit(a)}>এডিট</button>
                    <button style={{ ...btn, background: '#3a3340', padding: '6px 12px', fontSize: 13 }} onClick={() => toggle(a)}>{a.is_active ? 'বন্ধ' : 'চালু'}</button>
                    <button style={{ ...btn, background: '#7d1d3a', padding: '6px 12px', fontSize: 13 }} onClick={() => del(a)}>মুছুন</button>
                  </div>
                </div>
              ))}
              {boxItems(kind).length === 0 && <small style={{ color: '#888' }}>এই লিঙ্গের জন্য এখনো কিছু নেই</small>}
            </div>
          ))}
        </>
      )}

      {(view === 'gifts' || view === 'coins') && (
        <>
          {view === 'gifts' && (
          <>
          <div style={panel}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>{gEditId ? '✏️ গিফট এডিট' : '➕ নতুন গিফট কার্ড'}</div>
            <label style={lbl}>ধরন</label>
            <select style={inp} value={gf.kind} onChange={(e) => setG('kind', e.target.value)}>
              <option value="gift">🎁 সাধারণ গিফট কার্ড</option>
              <option value="mystery">❓ মিস্ট্রি বক্স (ভেতরে র‍্যান্ডম কার্ড)</option>
            </select>
            <input style={inp} placeholder="নাম, যেমন: গোলাপ ফুল" value={gf.name} onChange={(e) => setG('name', e.target.value)} />
            <label style={lbl}>ইমোজি (ছবি না থাকলে এটা দেখাবে)</label>
            <input style={inp} value={gf.emoji} onChange={(e) => setG('emoji', e.target.value)} />
            {gf.kind === 'gift' && (
              <>
                <label style={lbl}>লেভেল (১ সাধারণ · ২ রেয়ার · ৩ লেজেন্ডারি)</label>
                <select style={inp} value={gf.level} onChange={(e) => setG('level', e.target.value)}>{levelOptions}</select>
                <label style={lbl}>পয়েন্ট (কার্ডে দেখাবে)</label>
                <input style={inp} type="number" min="0" value={gf.points} onChange={(e) => setG('points', e.target.value)} />
              </>
            )}
            <label style={lbl}>দাম (কয়েন, ০ = শপে বিক্রি হবে না)</label>
            <input style={inp} type="number" min="0" value={gf.price} onChange={(e) => setG('price', e.target.value)} />
            <label style={lbl}>কার্ডের ছবি</label>
            {(gPrev || gf.image_url) && (
              <div>
                <img src={gPrev || gf.image_url} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, margin: '6px 0' }} />
                <button style={{ ...btn, background: '#7d1d3a' }} onClick={() => { setGFile(null); setGPrev(''); setG('image_url', ''); }}>ছবি সরান</button>
              </div>
            )}
            <input style={{ ...inp, background: 'rgba(0,0,0,.35)', color: '#fff' }} type="file" accept="image/*" onChange={pickGiftFile} />
            <button style={btn} onClick={saveGift} disabled={busy}>{busy ? 'অপেক্ষা করুন...' : gEditId ? 'সেভ করুন' : 'যোগ করুন'}</button>
            {gEditId && <button style={{ ...btn, background: '#3a3340' }} onClick={resetGift}>বাতিল</button>}
          </div>

          </>
          )}

          {view === 'coins' && (
          <>
          <div style={panel}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>🪙 হ্যাঁ দিলে কত কয়েন (লেভেল অনুযায়ী)</div>
            {rules.map((r, i) => (
              <div key={r.level}>
                <label style={lbl}>{lvName(r.level)}</label>
                <input style={inp} type="number" min="0" value={r.coins}
                  onChange={(e) => setRules((p) => p.map((x, j) => (j === i ? { ...x, coins: e.target.value } : x)))} />
              </div>
            ))}
            <button style={btn} onClick={saveRules}>💾 সেভ করুন</button>
          </div>

          <div style={panel}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>👑 ইউজারকে কয়েন/গিফট দিন</div>
            <input style={inp} placeholder="ইউজারের ইমেইল" value={giveF.email} onChange={(e) => setGiveF((p) => ({ ...p, email: e.target.value }))} />
            <label style={lbl}>কয়েন (মাইনাস দিলে কাটা যাবে)</label>
            <input style={inp} type="number" value={giveF.coins} onChange={(e) => setGiveF((p) => ({ ...p, coins: e.target.value }))} />
            <label style={lbl}>গিফট কার্ড (ঐচ্ছিক)</label>
            <select style={inp} value={giveF.gift} onChange={(e) => setGiveF((p) => ({ ...p, gift: e.target.value }))}>
              <option value="">— কোনো কার্ড নয় —</option>
              {gifts.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}
            </select>
            <label style={lbl}>কয়টি কার্ড (সর্বোচ্চ ২০)</label>
            <input style={inp} type="number" min="1" value={giveF.qty} onChange={(e) => setGiveF((p) => ({ ...p, qty: e.target.value }))} />
            <button style={btn} onClick={giveToUser}>🎁 দিন</button>
          </div>

          </>
          )}

          {view === 'gifts' && (
          <>
          <h3>সব গিফট কার্ড ({gifts.length})</h3>
          {gifts.map((g) => (
            <div key={g.id} style={{ ...panel, opacity: g.is_active ? 1 : 0.5 }}>
              {g.image_url
                ? <img src={g.image_url} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, float: 'right', marginLeft: 8 }} />
                : <div style={{ fontSize: 44, float: 'right', marginLeft: 8 }}>{g.emoji}</div>}
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>{g.name}</div>
              <small>
                {g.kind === 'mystery' ? '❓ মিস্ট্রি বক্স' : `${lvName(g.level)} · ⭐ ${g.points}`} · 🪙 {g.price} · {g.is_active ? 'চালু' : 'বন্ধ'}
              </small>
              <div>
                <button style={{ ...btn, background: '#35507a', padding: '6px 12px', fontSize: 13 }} onClick={() => editGift(g)}>এডিট</button>
                <button style={{ ...btn, background: '#3a3340', padding: '6px 12px', fontSize: 13 }} onClick={() => toggleGift(g)}>{g.is_active ? 'বন্ধ' : 'চালু'}</button>
                <button style={{ ...btn, background: '#7d1d3a', padding: '6px 12px', fontSize: 13 }} onClick={() => delGift(g)}>মুছুন</button>
              </div>
            </div>
          ))}
          </>
          )}
        </>
      )}

      {view === 'avatar' && (
        <>

          {aview === 'presets' && (
            <>
              <p style={{ fontSize: 13, color: '#aaa' }}>প্রতিটি প্রিসেটে স্লাইডার (০–১০০) দিয়ে গড়ন ঠিক করুন। ইউজাররা এখান থেকে নিজের গড়ন বাছবে। প্রিভিউ সাথে সাথে বদলায়।</p>
              <div style={panel}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>{pEditId ? '✏️ প্রিসেট এডিট' : '➕ নতুন প্রিসেট'}</div>
                <Avatar gender={pf.gender} body={pf} width={150} />
                <select style={inp} value={pf.gender} onChange={(e) => setPf({ ...pf, gender: e.target.value })}>
                  <option value="female">♀️ নারী</option>
                  <option value="male">♂️ পুরুষ</option>
                </select>
                <input style={inp} placeholder="নাম, যেমন: কার্ভি" value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} />
                {BODY_KEYS.map(([k, l]) => (
                  <div key={k}>
                    <label style={lbl}>{l}: {pf[k]}</label>
                    <input style={{ width: '100%' }} type="range" min="0" max="100" value={pf[k]} onChange={(e) => setPf({ ...pf, [k]: Number(e.target.value) })} />
                  </div>
                ))}
                <button style={btn} onClick={savePreset}>{pEditId ? 'সেভ করুন' : 'যোগ করুন'}</button>
                {pEditId && <button style={{ ...btn, background: '#3a3340' }} onClick={() => { setPf(PEMPTY); setPEditId(null); }}>বাতিল</button>}
              </div>
              {presets.map((b) => (
                <div key={b.id} style={{ ...panel, opacity: b.is_active ? 1 : 0.5 }}>
                  <div style={{ fontSize: 16 }}>{b.gender === 'male' ? '♂️' : '♀️'} {b.name}</div>
                  <small>বক্ষ {b.bust} · কোমর {b.waist} · পেট {b.belly} · নিতম্ব {b.hips} · উরু {b.thighs}</small>
                  <div>
                    <button style={{ ...btn, background: '#35507a', padding: '6px 12px', fontSize: 13 }} onClick={() => editPreset(b)}>এডিট</button>
                    <button style={{ ...btn, background: '#3a3340', padding: '6px 12px', fontSize: 13 }} onClick={() => togglePreset(b)}>{b.is_active ? 'বন্ধ' : 'চালু'}</button>
                    <button style={{ ...btn, background: '#7d1d3a', padding: '6px 12px', fontSize: 13 }} onClick={() => delPreset(b)}>মুছুন</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {aview === 'items' && (
            <>
              <div style={panel}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>{iEditId ? '✏️ আইটেম এডিট' : '➕ নতুন পোশাক/আইটেম'}</div>
                <Avatar gender={itf.gender === 'male' ? 'male' : 'female'} body={itf.gender === 'male' ? { bust: 80, waist: 40, hips: 45, belly: 15, thighs: 55 } : { bust: 75, waist: 35, hips: 80, belly: 30, thighs: 70 }} outfit={{ [itf.slot]: itf }} width={150} />
                <input style={inp} placeholder="নাম" value={itf.name} onChange={(e) => setItem('name', e.target.value)} />
                <label style={lbl}>জায়গা</label>
                <select style={inp} value={itf.slot} onChange={(e) => setItem('slot', e.target.value)}>
                  {Object.entries(SLOTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <label style={lbl}>আকৃতি</label>
                <select style={inp} value={itf.shape} onChange={(e) => setItem('shape', e.target.value)}>
                  {(SHAPES[itf.slot] || []).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <label style={lbl}>রং</label>
                <input style={{ ...inp, height: 44, padding: 4 }} type="color" value={itf.color} onChange={(e) => setItem('color', e.target.value)} />
                <label style={lbl}>কার জন্য</label>
                <select style={inp} value={itf.gender} onChange={(e) => setItem('gender', e.target.value)}>
                  {Object.entries(GENDERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <label style={lbl}>লেভেল (১ সাধারণ · ২ রেয়ার · ৩ লেজেন্ডারি)</label>
                <select style={inp} value={itf.level} onChange={(e) => setItem('level', e.target.value)}>{levelOptions}</select>
                <label style={lbl}>দাম (কয়েন, ০ = সবার জন্য ফ্রি)</label>
                <input style={inp} type="number" min="0" value={itf.price} onChange={(e) => setItem('price', e.target.value)} />
                <label style={lbl}>নিজের ছবি (ঐচ্ছিক): ২০০×৪২৪ আকারের স্বচ্ছ PNG লেয়ার দিলে উপরের আকৃতির বদলে এটা দেখাবে</label>
                {itf.image_url && <div><small style={{ color: '#aaa' }}>ছবি আছে</small> <button style={{ ...btn, background: '#7d1d3a', padding: '4px 10px', fontSize: 12 }} onClick={() => setItem('image_url', '')}>সরান</button></div>}
                <input style={{ ...inp, background: 'rgba(0,0,0,.35)', color: '#fff' }} type="file" accept="image/*" onChange={(e) => setIFile(e.target.files?.[0] || null)} />
                <button style={btn} onClick={saveItem} disabled={busy}>{busy ? 'অপেক্ষা করুন...' : iEditId ? 'সেভ করুন' : 'যোগ করুন'}</button>
                {iEditId && <button style={{ ...btn, background: '#3a3340' }} onClick={() => { setItf(IEMPTY); setIEditId(null); setIFile(null); }}>বাতিল</button>}
              </div>
              <h3>সব আইটেম ({aItems.length})</h3>
              {aItems.map((a) => (
                <div key={a.id} style={{ ...panel, opacity: a.is_active ? 1 : 0.5 }}>
                  <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: 11, background: a.color, border: '2px solid #fff', marginRight: 8, verticalAlign: 'middle' }} />
                  <span style={{ fontSize: 16 }}>{a.name}</span><br />
                  <small>{SLOTS[a.slot]} · {GENDERS[a.gender]} · {lvName(a.level)} · 🪙 {a.price}{a.image_url ? ' · 🖼️' : ''} · {a.is_active ? 'চালু' : 'বন্ধ'}</small>
                  <div>
                    <button style={{ ...btn, background: '#35507a', padding: '6px 12px', fontSize: 13 }} onClick={() => editItem(a)}>এডিট</button>
                    <button style={{ ...btn, background: '#3a3340', padding: '6px 12px', fontSize: 13 }} onClick={() => toggleItem(a)}>{a.is_active ? 'বন্ধ' : 'চালু'}</button>
                    <button style={{ ...btn, background: '#7d1d3a', padding: '6px 12px', fontSize: 13 }} onClick={() => delItem(a)}>মুছুন</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {aview === 'sets' && (
            <>
              <div style={panel}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>➕ নতুন থিম সেট (এক চাপে পুরো লুক)</div>
                <input style={inp} placeholder="নাম, যেমন: বিচ নাইট" value={stf.name} onChange={(e) => setStf({ ...stf, name: e.target.value })} />
                <input style={inp} placeholder="ইমোজি" value={stf.emoji} onChange={(e) => setStf({ ...stf, emoji: e.target.value })} />
                <select style={inp} value={stf.gender} onChange={(e) => setStf({ ...stf, gender: e.target.value, look: {} })}>
                  {Object.entries(GENDERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                {Object.entries(SLOTS).map(([slot, l]) => (
                  <div key={slot}>
                    <label style={lbl}>{l}</label>
                    <select style={inp} value={stf.look[slot] || ''} onChange={(e) => setStf({ ...stf, look: { ...stf.look, [slot]: e.target.value } })}>
                      <option value="">— নেই —</option>
                      {aItems.filter((a) => a.slot === slot && (stf.gender === 'any' || a.gender === 'any' || a.gender === stf.gender)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                ))}
                <button style={btn} onClick={saveSet}>যোগ করুন</button>
              </div>
              {aSets.map((a) => (
                <div key={a.id} style={{ ...panel, opacity: a.is_active ? 1 : 0.5 }}>
                  <div style={{ fontSize: 16 }}>{a.emoji} {a.name}</div>
                  <small>{GENDERS[a.gender]} · {Object.keys(a.look || {}).length}টি আইটেম · {a.is_active ? 'চালু' : 'বন্ধ'}</small>
                  <div>
                    <button style={{ ...btn, background: '#3a3340', padding: '6px 12px', fontSize: 13 }} onClick={() => toggleSet(a)}>{a.is_active ? 'বন্ধ' : 'চালু'}</button>
                    <button style={{ ...btn, background: '#7d1d3a', padding: '6px 12px', fontSize: 13 }} onClick={() => delSet(a)}>মুছুন</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {aview === 'give' && (
            <div style={panel}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>👑 ইউজারকে পোশাক উপহার</div>
              <input style={inp} placeholder="ইউজারের ইমেইল" value={giveItem.email} onChange={(e) => setGiveItem({ ...giveItem, email: e.target.value })} />
              <select style={inp} value={giveItem.item} onChange={(e) => setGiveItem({ ...giveItem, item: e.target.value })}>
                <option value="">— আইটেম বাছুন —</option>
                {aItems.map((a) => <option key={a.id} value={a.id}>{SLOTS[a.slot]} · {a.name}</option>)}
              </select>
              <button style={btn} onClick={giveItemTo}>🎁 দিন</button>
            </div>
          )}
        </>
      )}

      {view === 'wheel' && (() => {
        const segs = list.filter((x) => x.kind === 'wheel' && x.level === Number(wLevel)).sort((x, y) => x.id - y.id);
        const active = segs.filter((x) => x.is_active);
        return (
          <>
            <p style={{ fontSize: 13, color: '#aaa' }}>
              প্রতিটি হিট লেভেলের আলাদা চাকা। লেখার ধরন: <b>চাকায় যা দেখাবে | ফলাফলে যা দেখাবে</b> (পরের অংশ না দিলে একই লেখা দেখাবে)। ৬ থেকে ১০টি সেগমেন্ট সবচেয়ে ভালো দেখায়।
            </p>
            <div>
              {[1, 2, 3].map((n) => <button key={n} style={chip(Number(wLevel) === n)} onClick={() => { setWLevel(n); setWf((p) => ({ ...p, level: n })); }}>{lvName(n)}</button>)}
            </div>
            <div style={panel}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>👀 প্রিভিউ ({active.length}টি চালু সেগমেন্ট)</div>
              <div style={{ width: 240, height: 240, margin: '10px auto' }} dangerouslySetInnerHTML={{ __html: miniWheel(active.slice().sort((x, y) => x.id - y.id), Number(wLevel)) }} />
              {active.length < 3 && <small style={{ color: '#f2c078' }}>কমপক্ষে ৩টি সেগমেন্ট রাখুন</small>}
            </div>
            <div style={panel}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>➕ নতুন সেগমেন্ট</div>
              <input style={inp} placeholder="চাকায় যা দেখাবে (ছোট), যেমন: ম্যাসাজ" value={wf.label} onChange={(e) => setWf((p) => ({ ...p, label: e.target.value }))} />
              <input style={inp} placeholder="ফলাফলে যা দেখাবে, যেমন: ৫ মিনিট পিঠে ম্যাসাজ দিন" value={wf.detail} onChange={(e) => setWf((p) => ({ ...p, detail: e.target.value }))} />
              <label style={lbl}>টাইমার সেকেন্ড (০ = নেই)</label>
              <input style={inp} type="number" min="0" value={wf.seconds} onChange={(e) => setWf((p) => ({ ...p, seconds: e.target.value }))} />
              <button style={btn} onClick={addWheel}>➕ {lvName(wLevel)} চাকায় যোগ করুন</button>
              <button style={{ ...btn, background: '#3a3340' }} onClick={addWheelDefaults}>✨ ডিফল্ট ২৪টি যোগ করুন</button>
            </div>
            {segs.map((s) => {
              const p = wheelParts(s.title);
              return (
                <div key={s.id} style={{ ...panel, opacity: s.is_active ? 1 : 0.5 }}>
                  <div style={{ fontSize: 16 }}>🎡 {p.label}</div>
                  {p.detail && <small style={{ color: '#ccc' }}>{p.detail}</small>}
                  <div><small>{s.seconds > 0 ? `${s.seconds}সে · ` : ''}{s.is_active ? 'চালু' : 'বন্ধ'}</small></div>
                  <div>
                    <button style={{ ...btn, background: '#35507a', padding: '6px 12px', fontSize: 13 }} onClick={() => edit(s)}>এডিট</button>
                    <button style={{ ...btn, background: '#3a3340', padding: '6px 12px', fontSize: 13 }} onClick={() => toggle(s)}>{s.is_active ? 'বন্ধ' : 'চালু'}</button>
                    <button style={{ ...btn, background: '#7d1d3a', padding: '6px 12px', fontSize: 13 }} onClick={() => del(s)}>মুছুন</button>
                  </div>
                </div>
              );
            })}
            {segs.length === 0 && <small style={{ color: '#888' }}>এই লেভেলে এখনো কিছু নেই</small>}
          </>
        );
      })()}

      {view === 'scratch' && (() => {
        const cards = list.filter((x) => x.kind === 'scratch' && x.level === Number(sLevel)).sort((x, y) => x.id - y.id);
        const colors = scfg.colors || {};
        return (
          <>
            <div style={panel}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>🎨 স্ক্র্যাচ সেটিংস</div>
              <label style={lbl}>ফয়েলের ওপরের লেখা</label>
              <input style={inp} value={scfg.text || ''} onChange={(e) => setScfg((p) => ({ ...p, text: e.target.value }))} />
              <label style={lbl}>কতটা মুছলে কার্ড নিজে খুলে যাবে: {scfg.threshold}%</label>
              <input style={{ width: '100%' }} type="range" min="20" max="90" value={scfg.threshold} onChange={(e) => setScfg((p) => ({ ...p, threshold: Number(e.target.value) }))} />
              <label style={lbl}>ছবি/GIF কীভাবে দেখাবে</label>
              <select style={inp} value={scfg.imageMode || 'above'} onChange={(e) => setScfg((p) => ({ ...p, imageMode: e.target.value }))}>
                <option value="above">ছবি ওপরে, নিচে লেখা</option>
                <option value="cover">ছবি পুরো কার্ড জুড়ে, লেখা ওপরে বসবে</option>
              </select>
              <label style={lbl}>ফয়েলের রং (লেভেল অনুযায়ী)</label>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
                  <input type="color" value={colors[n] || '#d9b36a'} style={{ width: 52, height: 40, border: 'none', background: 'none', padding: 0 }}
                    onChange={(e) => setScfg((p) => ({ ...p, colors: { ...p.colors, [n]: e.target.value } }))} />
                  <div style={{ flex: 1, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', color: 'rgba(60,35,5,.8)', fontWeight: 700,
                    background: `linear-gradient(135deg, ${colors[n] || '#d9b36a'}, #fff6d8 50%, ${colors[n] || '#d9b36a'})` }}>
                    {scfg.text}
                  </div>
                  <small style={{ width: 90 }}>{lvName(n)}</small>
                </div>
              ))}
              <button style={btn} onClick={saveScratchCfg}>💾 সেটিংস সেভ করুন</button>
            </div>

            <div>
              {[1, 2, 3].map((n) => <button key={n} style={chip(Number(sLevel) === n)} onClick={() => { setSLevel(n); setSf((p) => ({ ...p, level: n })); }}>{lvName(n)}</button>)}
            </div>
            <p style={{ fontSize: 13, color: '#c9a5b4' }}>
              লেখার ধরন: <b>শিরোনাম | ভেতরের বার্তা</b>। ফয়েল সরালে প্রথমে শিরোনাম, তার নিচে বার্তা দেখা যাবে।
            </p>
            <div style={panel}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f2d98a' }}>➕ নতুন কার্ড ({cards.filter((c) => c.is_active).length}টি চালু)</div>
              <input style={inp} placeholder="শিরোনাম, যেমন: ম্যাসাজ" value={sf.label} onChange={(e) => setSf((p) => ({ ...p, label: e.target.value }))} />
              <input style={inp} placeholder="ভেতরের বার্তা, যেমন: ৫ মিনিট কাঁধে ম্যাসাজ দিন" value={sf.detail} onChange={(e) => setSf((p) => ({ ...p, detail: e.target.value }))} />
              <label style={lbl}>টাইমার সেকেন্ড (০ = নেই)</label>
              <input style={inp} type="number" min="0" value={sf.seconds} onChange={(e) => setSf((p) => ({ ...p, seconds: e.target.value }))} />
              <label style={lbl}>ছবি বা GIF (ঐচ্ছিক, স্ক্র্যাচ করলে বেরোবে। GIF সর্বোচ্চ ৬MB)</label>
              {sPrev && (
                <div>
                  <div style={{ height: 160, borderRadius: 12, margin: '6px 0', backgroundImage: `url(${sPrev})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <button style={{ ...btn, background: '#7d1d3a' }} onClick={() => { setSFile(null); setSPrev(''); }}>ছবি সরান</button>
                </div>
              )}
              <input style={{ ...inp, background: 'rgba(0,0,0,.35)', color: '#fff' }} type="file" accept="image/*" onChange={pickScratchFile} />
              <button style={btn} disabled={busy} onClick={addScratch}>{busy ? 'অপেক্ষা করুন...' : `➕ ${lvName(sLevel)} লেভেলে যোগ করুন`}</button>
              <button style={{ ...btn, background: '#3a3340' }} onClick={addScratchDefaults}>✨ ডিফল্ট ১৮টি যোগ করুন</button>
            </div>
            {cards.map((s) => {
              const p = wheelParts(s.title);
              return (
                <div key={s.id} style={{ ...panel, opacity: s.is_active ? 1 : 0.5 }}>
                  {s.image_url && <div style={{ width: 84, height: 84, borderRadius: 12, float: 'right', marginLeft: 10, backgroundImage: `url(${s.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                  <div style={{ fontSize: 16 }}>🎟️ {p.label}</div>
                  {p.detail && <small style={{ color: '#e6d6b8' }}>{p.detail}</small>}
                  <div><small>{s.seconds > 0 ? `${s.seconds}সে · ` : ''}{s.image_url ? '🖼️ ছবি আছে · ' : ''}{s.is_active ? 'চালু' : 'বন্ধ'}</small></div>
                  <div>
                    <label style={{ ...btn, display: 'inline-block', background: '#35507a', padding: '6px 12px', fontSize: 13 }}>
                      🖼️ {s.image_url ? 'ছবি বদলান' : 'ছবি/GIF দিন'}
                      <input type="file" accept="image/*" hidden onChange={(e) => { setScratchImage(s, e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                    {s.image_url && <button style={{ ...btn, background: '#3a3340', padding: '6px 12px', fontSize: 13 }} onClick={() => clearScratchImage(s)}>ছবি সরান</button>}
                    <button style={{ ...btn, background: '#35507a', padding: '6px 12px', fontSize: 13 }} onClick={() => edit(s)}>এডিট</button>
                    <button style={{ ...btn, background: '#3a3340', padding: '6px 12px', fontSize: 13 }} onClick={() => toggle(s)}>{s.is_active ? 'বন্ধ' : 'চালু'}</button>
                    <button style={{ ...btn, background: '#7d1d3a', padding: '6px 12px', fontSize: 13 }} onClick={() => del(s)}>মুছুন</button>
                  </div>
                </div>
              );
            })}
            {cards.length === 0 && <small style={{ color: '#c9a5b4' }}>এই লেভেলে এখনো কোনো কার্ড নেই</small>}
          </>
        );
      })()}

      {view === 'levels' && (
        <>
          <p style={{ fontSize: 13, color: '#aaa' }}>প্রতিটি লেভেলের আইকন ও নাম বদলান। অ্যাপের সব জায়গায় এই নাম দেখাবে।</p>
          {[1, 2, 3].map((id) => (
            <div key={id} style={panel}>
              <label style={lbl}>লেভেল {id}</label>
              <input style={{ ...inp, width: 70, textAlign: 'center', display: 'inline-block' }} value={levels[id]?.icon || ''} onChange={(e) => setLv(id, 'icon', e.target.value)} />
              <input style={{ ...inp, width: 'calc(100% - 80px)', marginLeft: 8, display: 'inline-block' }} value={levels[id]?.name || ''} onChange={(e) => setLv(id, 'name', e.target.value)} />
            </div>
          ))}
          <button style={btn} onClick={saveLevels}>💾 সেভ করুন</button>
        </>
      )}

      {view === 'all' && (
      <>
      <div style={panel}>
      <h3 style={{ marginTop: 0 }}>{editId ? '✏️ এডিট করুন' : '➕ নতুন অ্যাক্টিভিটি'}</h3>
      <input style={inp} placeholder="লেখা, যেমন: পিঠে ম্যাসাজ" value={form.title} onChange={(e) => set('title', e.target.value)} />

      <label style={lbl}>ধরন</label>
      <select style={inp} value={form.kind} onChange={(e) => set('kind', e.target.value)}>
        {Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>

      <label style={lbl}>লেভেল</label>
      <select style={inp} value={form.level} onChange={(e) => set('level', e.target.value)}>
        {levelOptions}
      </select>

      {['action', 'modifier'].includes(form.kind) && (
        <>
          <label style={lbl}>কোন লিঙ্গের জন্য (ডাইস)</label>
          <select style={inp} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            {Object.entries(GENDERS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </>
      )}

      <label style={lbl}>মুড</label>
      <select style={inp} value={form.mood} onChange={(e) => set('mood', e.target.value)}>
        {Object.entries(MOODS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>

      <label style={lbl}>টাইমার সেকেন্ড (০ = টাইমার নেই)</label>
      <input style={inp} type="number" min="0" value={form.seconds} onChange={(e) => set('seconds', e.target.value)} />

      {['card', 'scratch'].includes(form.kind) && (
        <div>
          <label style={lbl}>কার্ডের ছবি (ঐচ্ছিক)</label>
          {(preview || form.image_url) && (
            <div>
              <img src={preview || form.image_url} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 10, margin: '6px 0' }} />
              <button style={{ ...btn, background: '#7d1d3a' }} onClick={removeImage}>ছবি সরান</button>
            </div>
          )}
          <input style={{ ...inp, background: 'rgba(255,255,255,.06)', color: '#fff' }} type="file" accept="image/*" onChange={pickFile} />
        </div>
      )}

      <button style={btn} onClick={save} disabled={busy}>{busy ? 'অপেক্ষা করুন...' : editId ? 'সেভ করুন' : 'যোগ করুন'}</button>
      {editId && <button style={{ ...btn, background: '#3a3340' }} onClick={cancel}>বাতিল</button>}
      </div>

      <h3>সব অ্যাক্টিভিটি ({shown.length})</h3>
      <div>
        <button style={chip(filter === 'all')} onClick={() => setFilter('all')}>সব</button>
        {Object.entries(KINDS).map(([k, l]) =>
          <button key={k} style={chip(filter === k)} onClick={() => setFilter(k)}>{l.split(' ')[0]}</button>)}
      </div>

      {shown.map((a) => (
        <div key={a.id} style={{ background: 'rgba(255,255,255,.06)', padding: 12, borderRadius: 10, margin: '8px 0', opacity: a.is_active ? 1 : 0.5 }}>
          {a.image_url && <img src={a.image_url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, float: 'right', marginLeft: 8 }} />}
          <div style={{ fontSize: 18 }}>{a.title}</div>
          <small>
            {KINDS[a.kind]?.split(' ')[0]} · {lvName(a.level)} · {MOODS[a.mood]}
            {['action', 'modifier'].includes(a.kind) ? ` · ${GENDERS[a.gender || 'any']}` : ''}
            {a.seconds > 0 ? ` · ${a.seconds}সে` : ''} · {a.is_active ? 'চালু' : 'বন্ধ'}
          </small>
          <div>
            <button style={{ ...btn, background: '#35507a' }} onClick={() => edit(a)}>এডিট</button>
            <button style={{ ...btn, background: '#3a3340' }} onClick={() => toggle(a)}>{a.is_active ? 'বন্ধ' : 'চালু'}</button>
            <button style={{ ...btn, background: '#7d1d3a' }} onClick={() => del(a)}>মুছুন</button>
          </div>
        </div>
      ))}
      </>
      )}
      </div>

      {msg && <div className="adm-toast" onClick={() => setMsg('')}>{msg}</div>}
    </div>
  );
}

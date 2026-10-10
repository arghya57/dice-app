'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const MOODS = { any: '🎲 যেকোনো', romantic: '💕 রোমান্টিক', naughty: '😏 দুষ্টু', tired: '😴 ক্লান্ত' };
// ডিফল্ট লেভেল নাম (অ্যাডমিন প্যানেল থেকে বদলানো যায়, না বদলালে এগুলো দেখাবে)
const DEF_LEVELS = {
  1: { name: 'লেভেল ১ · হালকা', icon: '🌸' },
  2: { name: 'লেভেল ২ · রোমান্টিক', icon: '💋' },
  3: { name: 'লেভেল ৩ · ইন্টিমেট', icon: '🔥' },
};
const GENDERS = { male: '♂️ পুরুষ', female: '♀️ নারী' };
const RARITY = { 1: 'সাধারণ', 2: 'রেয়ার', 3: 'লেজেন্ডারি' };
const SRC = { reward: '🏆 খেলার পুরস্কার', purchase: '💝 পার্টনারের উপহার', admin: '👑 অ্যাডমিন' };

const T = {
  home:    { icon: '🏠', label: 'হোম',    color: '#ff3d7f', title: 'হোম', desc: '', hero: '', btn: '', stk: [] },
  dice:    { icon: '🎲', label: 'ডাইস',   color: '#ff3d7f', title: 'ডাইস গেম',  desc: 'দুটি ডাইস ফেলুন: কী করবেন আর কোথায়/কীভাবে', hero: '🎲🎲', btn: '🎲 ডাইস ফেলুন', stk: ['💋', '😘', '🔥', '💞'] },
  card:    { icon: '🃏', label: 'কার্ড',   color: '#ffb347', title: 'কার্ড গেম',  desc: 'একটা কার্ড তুলুন, দেখুন ভাগ্যে কী আছে', hero: '🃏', btn: '🃏 কার্ড তুলুন', stk: ['🌹', '🍷', '✨', '😏'] },
  truth:   { icon: '💬', label: 'ট্রুথ',   color: '#b266ff', title: 'ট্রুথ',     desc: 'সত্যি বলুন... কোনো লুকোছাপা নয় 😏', hero: '💬😏', btn: '💬 ট্রুথ নিন', stk: ['🤫', '🙈', '💜', '👀'] },
  dare:    { icon: '🔥', label: 'ডেয়ার',   color: '#ff4d2e', title: 'ডেয়ার',     desc: 'সাহস আছে? পিছিয়ে যাবেন না 😈', hero: '🔥😈', btn: '🔥 ডেয়ার নিন', stk: ['😈', '🥵', '💥', '🍑'] },
  wish:    { icon: '💭', label: 'উইশ',    color: '#ff7eb6', title: 'গোপন ইচ্ছা', desc: '', hero: '', btn: '', stk: ['🤫', '💌', '🌙'] },
  history: { icon: '⭐', label: 'হিস্ট্রি', color: '#ffd369', title: 'পছন্দ ও ইতিহাস', desc: '', hero: '', btn: '', stk: ['⭐', '💝', '🕰️'] },
  gifts:   { icon: '🎁', label: 'গিফট',   color: '#ff9f1c', title: 'গিফট ও কয়েন', desc: '', hero: '', btn: '', stk: ['🎁', '💝', '✨'] },
  chat:    { icon: '🗨️', label: 'চ্যাট',   color: '#5ec8ff', title: 'রুম চ্যাট', desc: '', hero: '', btn: '', stk: ['💌', '😘', '🫶'] },
};
const GAME_TABS = ['dice', 'card', 'truth', 'dare'];
const HUB_TEXT = {
  dice: 'কী করবেন + কীভাবে, দুই ডাইসে',
  card: 'ঘুরন্ত ডেক থেকে একটা কার্ড',
  truth: 'সত্যি বলার খেলা',
  dare: 'সাহসের চ্যালেঞ্জ',
};
const QUICK_MSGS = ['😘 আমি রেডি', '⏳ একটু অপেক্ষা করো', '🔄 অন্যটা দাও', '💗 একটু বিরতি চাই', '🔥 আরও চাই'];
const FLOATERS = [
  ['💋', '6%', '12%', '0s'], ['🔥', '82%', '8%', '2s'], ['😈', '12%', '48%', '4s'], ['🌹', '88%', '42%', '1s'],
  ['🍷', '8%', '78%', '3s'], ['🥵', '78%', '74%', '5s'], ['🍑', '46%', '90%', '2.5s'], ['💞', '50%', '4%', '6s'],
  ['😘', '30%', '30%', '7s'], ['🫦', '65%', '60%', '3.5s'], ['💦', '20%', '65%', '8s'], ['🖤', '92%', '85%', '1.5s'],
  ['💏', '14%', '20%', '1s'], ['👩‍❤️‍💋‍👨', '70%', '18%', '3s'], ['💑', '40%', '55%', '5s'],
  ['😘', '85%', '60%', '2s'], ['🫂', '25%', '85%', '4s'], ['💏', '60%', '82%', '6s'],
  ['👩‍❤️‍💋‍👨', '5%', '55%', '7s'], ['💋', '92%', '25%', '0.5s'],
];
const HERO_STICKERS = [['💏', -12], ['😍', 8], ['👩‍❤️‍💋‍👨', -6], ['🫦', 12], ['💑', -10], ['😈', 6], ['💋', -8], ['🔥', 10]];

const tabOfAct = (a) => (a?.kind === 'card' ? 'card' : a?.kind === 'truth' ? 'truth' : a?.kind === 'dare' ? 'dare' : 'dice');

const urlB64ToUint8Array = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const CSS = `
.app{position:relative;min-height:100vh;padding:128px 46px 50px;max-width:460px;margin:0 auto;text-align:center;overflow-x:hidden;font-family:'Hind Siliguri',sans-serif}
.bg{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(circle at 18% 8%,#4d0b30 0,transparent 46%),radial-gradient(circle at 88% 30%,#3a0a48 0,transparent 42%),radial-gradient(circle at 50% 105%,#5e0f20 0,transparent 52%),#0b0210}
.float{position:fixed;font-size:28px;opacity:.24;animation:drift 14s ease-in-out infinite;pointer-events:none;z-index:0}
.z{position:relative;z-index:1}
.logo{font-size:36px;font-weight:700;margin:6px 0 0;background:linear-gradient(90deg,#ffa6c9,#ff3d7f,#ffb347);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 0 30px rgba(255,61,127,.35)}
.sub{font-size:12px;letter-spacing:.16em;color:#e0a9c2;margin:0 0 10px}
.glass{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-radius:22px;padding:16px;margin:12px 0;box-shadow:0 10px 40px rgba(0,0,0,.35)}
.inp{width:100%;padding:13px 15px;margin:6px 0;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.38);color:#fff;font-size:16px;box-sizing:border-box;outline:none;font-family:inherit}
.inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(255,61,127,.28)}
.btn{padding:12px 20px;margin:4px;border:none;border-radius:999px;color:#fff;font-size:15px;font-weight:600;background:linear-gradient(135deg,var(--accent),#7a1fa2);box-shadow:0 6px 20px rgba(0,0,0,.45);cursor:pointer;font-family:inherit}
.btn:active{transform:scale(.95)}
.btn:disabled{opacity:.5}
.big{padding:15px 30px;font-size:18px;box-shadow:0 8px 30px rgba(0,0,0,.5),0 0 26px -4px var(--accent)}
.ghost{background:rgba(255,255,255,.1);box-shadow:none;border:1px solid rgba(255,255,255,.16)}
.stop{background:linear-gradient(135deg,#d90429,#7a0019)}
.tiny{font-size:12px;padding:7px 14px}
.pill{padding:7px 14px;margin:3px;border-radius:999px;font-size:13px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#eee;font-family:inherit;cursor:pointer}
.pill.on{background:var(--accent);border-color:transparent;color:#fff;box-shadow:0 0 16px var(--accent)}
.hero{font-size:86px;margin:8px 0 4px;filter:drop-shadow(0 0 24px var(--accent))}
.spin{animation:spin 1.2s ease-out}
.loop{animation:spin .8s linear infinite}
.go{background:linear-gradient(135deg,#1fb85a,#0b6b32)}
.who{font-size:15px;color:#ffd9a0;margin:2px 0 10px}
.dbox{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0}
.dbox.one{grid-template-columns:1fr}
.dbox .b{padding:16px 8px 18px;border-radius:18px;border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.38);font-size:19px;line-height:1.4;box-shadow:0 0 18px -8px var(--accent)}
.dbox .b small{display:block;font-size:11px;color:#d9b4c6;margin-bottom:6px}
.lvbadge{display:inline-block;padding:4px 14px;border-radius:999px;background:rgba(0,0,0,.4);border:1px solid var(--accent);font-size:13px;margin-bottom:8px}
.fan{height:152px;margin:10px 0}
.fan .c{display:inline-block;width:92px;height:134px;margin:0 -18px;border-radius:14px;background:linear-gradient(160deg,#2c0a1e,#0e0212);border:2px solid var(--accent);font-size:38px;line-height:130px;box-shadow:0 8px 24px rgba(0,0,0,.55),0 0 18px -6px var(--accent)}
.res{padding:18px;border-radius:24px;background:linear-gradient(160deg,rgba(255,255,255,.11),rgba(255,255,255,.03));border:1.5px solid var(--accent);box-shadow:0 0 30px rgba(0,0,0,.4),0 0 26px -6px var(--accent);font-size:21px;line-height:1.55;margin:12px 0}
.res img{width:100%;max-height:320px;object-fit:cover;border-radius:16px;margin-bottom:12px}
.mod{color:#ffd9a0;margin-top:8px}
.stopbox{padding:16px;border-radius:20px;background:rgba(120,10,30,.45);border:1px solid rgba(255,80,100,.4);margin:12px 0;font-size:18px}
.time{font-size:48px;font-weight:700;letter-spacing:.06em;text-shadow:0 0 20px var(--accent)}
.code{display:inline-block;padding:5px 18px;margin-left:6px;border-radius:999px;background:rgba(0,0,0,.4);border:1px dashed var(--accent);font-size:22px;letter-spacing:.3em;font-weight:700}
.h3{margin:18px 0 8px;font-size:17px;color:#ffd0e3}
.item{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);padding:12px 14px;border-radius:16px;margin:8px 0;font-size:16px}
.muted{font-size:13px;color:#d9b4c6}
.sticker{display:inline-block;font-size:34px;line-height:1;padding:9px;margin:4px;border-radius:50%;background:rgba(255,255,255,.09);border:2px dashed rgba(255,255,255,.35);box-shadow:0 6px 18px rgba(0,0,0,.4),0 0 16px -4px var(--accent);transform:rotate(var(--r,0deg));animation:wob 3.4s ease-in-out infinite}
.stkrow{margin:2px 0 8px}
.welcome{font-size:15px;color:#ffd0e3;margin:2px 0 10px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
.gcard{position:relative;overflow:hidden;text-align:center;padding:18px 10px 14px;border-radius:24px;border:1.5px solid var(--c);background:linear-gradient(160deg,rgba(255,255,255,.12),rgba(255,255,255,.02));box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 26px -8px var(--c);color:#fff;font-family:inherit;cursor:pointer;animation:pop .45s ease-out}
.gcard:active{transform:scale(.96)}
.gcard .e{font-size:50px;filter:drop-shadow(0 0 14px var(--c))}
.gcard .t{font-size:19px;font-weight:700;margin-top:4px}
.gcard .d{font-size:12px;color:#e6c3d3;margin-top:3px;line-height:1.4}
.gcard .s{position:absolute;font-size:18px;opacity:.55}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:2px 0 10px}
.mini{padding:12px 8px;border-radius:18px;border:1px solid var(--c);background:rgba(255,255,255,.07);color:#fff;font-family:inherit;font-size:15px;cursor:pointer}
.badge{display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.18);font-size:12px;margin:3px}
.tabs{position:fixed;top:0;left:0;right:0;z-index:5;display:flex;gap:8px;overflow-x:auto;padding:calc(10px + env(safe-area-inset-top)) 10px 10px;background:linear-gradient(180deg,rgba(40,4,30,.96),rgba(12,2,16,.88));-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.14);box-shadow:0 8px 30px rgba(0,0,0,.5);scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tabs button{flex:0 0 auto;min-width:76px;padding:8px 6px 7px;border-radius:20px;border:1.5px solid var(--nc);background:rgba(255,255,255,.07);color:#f3d3e1;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.tabs button span{display:block;font-size:32px;line-height:1.1;filter:drop-shadow(0 0 8px var(--nc))}
.tabs button.on{background:linear-gradient(160deg,var(--nc),#5a1450);color:#fff;transform:translateY(2px) scale(1.06);box-shadow:0 0 22px -2px var(--nc)}
.tabs button i{display:none}
.side{position:fixed;top:130px;bottom:50px;width:44px;z-index:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-around;align-items:center;font-size:30px;opacity:.75}
.side.l{left:2px}.side.r{right:2px}
.side span{display:block;animation:sway 3s ease-in-out infinite;filter:drop-shadow(0 0 8px rgba(255,150,200,.6))}
.side .dn{animation:dance 1.1s ease-in-out infinite;font-size:36px}
.waves{position:fixed;left:0;right:0;bottom:0;z-index:0;pointer-events:none;font-size:26px;white-space:nowrap;overflow:hidden;opacity:.55;line-height:1}
.waves div{display:inline-block;animation:wave 14s linear infinite}
.beach{font-size:38px;margin:6px 0;white-space:nowrap}
.beach span{display:inline-block;animation:dance 1.3s ease-in-out infinite}
.tabs button{position:relative}
.tabs button .dot{position:absolute;top:2px;right:6px;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#ff2d55;color:#fff;font-size:11px;line-height:18px;font-weight:700;box-shadow:0 0 10px rgba(255,45,85,.8)}
.status{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:6px 0}
.status .badge.turn{border-color:var(--accent);box-shadow:0 0 14px -4px var(--accent)}
.status .badge.wait{opacity:.8}
.dotp{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;background:#777;vertical-align:middle}
.dotp.on{background:#3ddc84;box-shadow:0 0 8px #3ddc84}
.notice{padding:10px 14px;border-radius:16px;margin:8px 0;font-size:15px;cursor:pointer;background:rgba(94,200,255,.14);border:1px solid rgba(94,200,255,.5)}
.chatbox{height:46vh;overflow-y:auto;text-align:left;padding:12px;display:flex;flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch}
.bub{max-width:82%;padding:9px 13px;border-radius:18px;font-size:15px;line-height:1.5;word-wrap:break-word;overflow-wrap:anywhere;white-space:pre-wrap}
.bub.me{align-self:flex-end;background:linear-gradient(135deg,#ff3d7f,#7a1fa2);border-bottom-right-radius:6px}
.bub.th{align-self:flex-start;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.14);border-bottom-left-radius:6px}
.bub small{display:block;font-size:10px;opacity:.65;margin-top:3px;text-align:right}
.sendrow{display:flex;gap:6px;align-items:center}
.sendrow .inp{margin:0;flex:1}
.sendrow .btn{margin:0;flex:0 0 auto}
.quick{margin:6px 0}
.setbox{margin-top:14px}
.coinbar{display:inline-block;padding:8px 18px;margin:8px 0;border-radius:999px;font-size:20px;font-weight:700;background:rgba(255,211,105,.14);border:1.5px solid #ffd369;box-shadow:0 0 18px -4px #ffd369}
.ggrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
.gwrap{display:flex;flex-direction:column;gap:6px;align-items:stretch}
.gcx{position:relative;border-radius:18px;padding:10px 8px 12px;border:2px solid var(--rc);background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(0,0,0,.35));box-shadow:0 8px 24px rgba(0,0,0,.5),0 0 18px -6px var(--rc);animation:pop .4s ease-out}
.gcx.r1{--rc:#9fb3c8}
.gcx.r2{--rc:#5ec8ff}
.gcx.r3{--rc:#ffd369;animation:pop .4s ease-out,glow 2.4s ease-in-out infinite}
.gcx.myst{--rc:#b266ff;border-style:dashed}
.gcx .rt{font-size:11px;font-weight:700;color:var(--rc)}
.gcx .gi{height:96px;display:flex;align-items:center;justify-content:center;font-size:58px;margin:4px 0}
.gcx .gi img{width:100%;height:96px;object-fit:cover;border-radius:12px}
.gcx .gn{font-size:15px;font-weight:700;line-height:1.3}
.gcx .gp{font-size:12px;color:#e6c3d3;margin-top:2px}
.gcx .gs{font-size:11px;color:#d9b4c6;margin-top:3px}
.modal{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.75)}
.mbox{width:100%;max-width:300px;padding:18px;border-radius:24px;background:#1b0a26;border:1.5px solid var(--accent);box-shadow:0 0 40px -6px var(--accent)}
@keyframes sway{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg) translateY(-4px)}}
@keyframes dance{0%,100%{transform:translateY(0) rotate(-10deg)}50%{transform:translateY(-12px) rotate(10deg)}}
@keyframes wave{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(720deg)}}
@keyframes shuf{0%{transform:translateX(0) rotate(0)}25%{transform:translateX(-40px) rotate(-12deg)}50%{transform:translateX(40px) rotate(12deg)}75%{transform:translateX(-25px) rotate(-6deg)}100%{transform:translateX(0) rotate(0)}}
@keyframes flip{from{transform:rotateY(90deg)}to{transform:rotateY(0)}}
@keyframes drift{0%,100%{transform:translateY(0) rotate(-8deg)}50%{transform:translateY(-28px) rotate(10deg)}}
@keyframes pop{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes wob{0%,100%{transform:rotate(var(--r,0deg)) scale(1)}50%{transform:rotate(calc(var(--r,0deg) * -1)) scale(1.08)}}
@keyframes glow{0%,100%{box-shadow:0 8px 24px rgba(0,0,0,.5),0 0 14px -6px #ffd369}50%{box-shadow:0 8px 24px rgba(0,0,0,.5),0 0 30px 0 #ffd369}}
`;

export default function Home() {
  const [user, setUser] = useState(null);
  const [adult, setAdult] = useState(null);
  const [tick, setTick] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [room, setRoom] = useState(null);
  const [code, setCode] = useState('');
  const [acts, setActs] = useState([]);
  const [cur, setCur] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [rollTab, setRollTab] = useState('dice');
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('home');
  const [mood, setMood] = useState('any');
  const [myVote, setMyVote] = useState(null);
  const [result, setResult] = useState(null);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [wish, setWish] = useState('');
  const [wishes, setWishes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [favs, setFavs] = useState([]);
  const [history, setHistory] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [chatText, setChatText] = useState('');
  const [unread, setUnread] = useState(0);
  const [online, setOnline] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushOk, setPushOk] = useState(false);
  const [installEvt, setInstallEvt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [levels, setLevels] = useState(DEF_LEVELS);
  const [gender, setGender] = useState('');
  const [spinning, setSpinning] = useState(false);
  // গিফট সিস্টেম
  const [coins, setCoins] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [myGifts, setMyGifts] = useState([]);
  const [gv, setGv] = useState('mine');
  const [gbusy, setGbusy] = useState(false);
  const [gnotice, setGnotice] = useState(null);
  const [popup, setPopup] = useState(null);
  const claimedRef = useRef(new Set());
  const lastEvt = useRef(null);
  const seenRoll = useRef(null);
  const actsRef = useRef([]);
  actsRef.current = acts;
  const tabRef = useRef('home');
  tabRef.current = tab;
  const userIdRef = useRef(null);
  userIdRef.current = user?.id ?? null;
  const chatBoxRef = useRef(null);

  const isP1 = room && room.partner1_id === user?.id;
  const eff = room ? Math.min(room.p1_level, room.p2_level) : 1;
  const myLevel = room ? (isP1 ? room.p1_level : room.p2_level) : 1;
  const partnerId = room ? (isP1 ? room.partner2_id : room.partner1_id) : null;
  const myGender = room ? (isP1 ? room.p1_gender : room.p2_gender) : null;
  const partnerGender = room ? (isP1 ? room.p2_gender : room.p1_gender) : null;
  const lv = (n) => levels[n] || DEF_LEVELS[n] || { name: 'লেভেল ' + n, icon: '✨' };
  const lvLabel = (n) => `${lv(n).icon} ${lv(n).name}`;
  const partnerRef = useRef(null);
  partnerRef.current = partnerId;
  const myTurn = !room?.turn_user_id || room.turn_user_id === user?.id;
  const isGameTab = GAME_TABS.includes(tab);
  const accent = T[tab]?.color || '#ff3d7f';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    try {
      const g = localStorage.getItem('dice_gender');
      if (g === 'male' || g === 'female') setGender(g);
    } catch (e) { /* চুপচাপ */ }
  }, []);

  // ট্যাব বদলালে ঘুরন্ত ডাইস থামে
  useEffect(() => { setSpinning(false); }, [tab]);

  // PWA: manifest, আইকন, service worker, ইন্সটল প্রম্পট
  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
    setStandalone(!!(window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone));
    setPushOk('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);

    const addTag = (tag, attrs) => {
      const key = tag === 'link' ? attrs.rel : attrs.name;
      if (document.head.querySelector(`${tag}[${tag === 'link' ? 'rel' : 'name'}="${key}"]`)) return;
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
    };
    addTag('link', { rel: 'manifest', href: '/manifest.json' });
    addTag('link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' });
    addTag('meta', { name: 'theme-color', content: '#0b0210' });
    addTag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    addTag('meta', { name: 'mobile-web-app-capable', content: 'yes' });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const onPrompt = (e) => { e.preventDefault(); setInstallEvt(e); };
    const onInstalled = () => { setInstallEvt(null); setStandalone(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('adult_ok').eq('id', user.id).single()
      .then(({ data }) => setAdult(!!data?.adult_ok));
    supabase.from('activities').select('*').eq('is_active', true)
      .then(({ data }) => setActs(data || []));
    supabase.from('rooms').select('*')
      .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
      .order('id', { ascending: false }).limit(1)
      .then(({ data }) => setRoom(data?.[0] ?? null));
    supabase.from('levels').select('*').order('id').then(({ data }) => {
      if (!data?.length) return;
      setLevels((prev) => {
        const n = { ...prev };
        data.forEach((r) => { n[r.id] = { name: r.name, icon: r.icon || prev[r.id]?.icon || '' }; });
        return n;
      });
    });
    loadFavs();
    loadGifts();
    syncPush();
  }, [user]);

  const loadFavs = async () => {
    const { data } = await supabase.from('favorites').select('activity_id, activities(title)');
    setFavs(data || []);
  };

  // ---------- গিফট ----------
  const gById = (id) => catalog.find((x) => x.id === id);

  const loadGifts = async () => {
    if (!user) return;
    const { data: c } = await supabase.from('gifts').select('*').order('level').order('price');
    setCatalog(c || []);
    const { data: w } = await supabase.rpc('my_coins');
    setCoins(typeof w === 'number' ? w : 0);
    const { data: g } = await supabase.from('user_gifts').select('*')
      .eq('owner_id', user.id).order('id', { ascending: false });
    setMyGifts(g || []);
  };

  // পার্টনারের পাঠানো গিফট / বক্স খোলার নোটিস (পোলিং)
  const checkGiftEvents = async () => {
    if (!user) return;
    const { data } = await supabase.from('gift_events').select('*')
      .eq('to_user', user.id).order('id', { ascending: false }).limit(5);
    if (!data?.length) return;
    if (lastEvt.current === null) { lastEvt.current = data[0].id; return; }
    const fresh = data.filter((e) => e.id > lastEvt.current);
    if (!fresh.length) return;
    lastEvt.current = data[0].id;
    setGnotice(fresh[0]);
    loadGifts();
    if (navigator.vibrate) navigator.vibrate(80);
  };

  const noticeText = (e) => {
    const g = gById(e.gift_id);
    const n = g ? `${g.emoji || '🎁'} ${g.name}` : 'একটি গিফট';
    if (e.kind === 'received') return `🎁 পার্টনার আপনাকে পাঠিয়েছে: ${n}`;
    if (e.kind === 'opened') return `🎉 পার্টনার মিস্ট্রি বক্স খুলেছে, ভেতরে ছিল: ${n}`;
    return `👑 অ্যাডমিন থেকে উপহার: ${n}`;
  };

  // দুজনেই হ্যাঁ দিলে পুরস্কার
  const claimReward = async (rid) => {
    if (claimedRef.current.has(rid)) return;
    claimedRef.current.add(rid);
    const { data, error } = await supabase.rpc('claim_roll_reward', { p_roll: rid });
    if (error || !data?.ok) { claimedRef.current.delete(rid); return; }
    await loadGifts();
    setPopup({
      title: '💖 দুজনেই হ্যাঁ বলেছেন!',
      gift: data.gift,
      note: `+${data.coins} 🪙 কয়েন`,
    });
  };

  const openBox = async (u) => {
    setGbusy(true);
    const { data, error } = await supabase.rpc('open_mystery', { p_ug: u.id });
    setGbusy(false);
    if (error) return setMsg(error.message);
    await loadGifts();
    setPopup({ title: '🎉 মিস্ট্রি বক্স খুলেছে!', gift: data.gift, note: 'পার্টনারও এটা জেনে গেছে 😉' });
  };

  const buyGift = async (g) => {
    if (!window.confirm(`"${g.name}" পাঠাতে ${g.price} কয়েন লাগবে। পাঠাবেন?`)) return;
    setGbusy(true);
    const { data, error } = await supabase.rpc('send_gift', { p_room: room.id, p_gift: g.id });
    setGbusy(false);
    if (error) return setMsg(error.message);
    setCoins(data.coins);
    setMsg('🎁 গিফট পাঠানো হয়েছে');
    loadGifts();
  };

  // গিফট কার্ড (ছবি না থাকলে ইমোজি)
  const giftCard = (g, sub) => {
    const mys = g.kind === 'mystery';
    const lvl = mys ? 2 : g.level || 1;
    return (
      <div className={'gcx r' + lvl + (mys ? ' myst' : '')}>
        <div className="rt">{mys ? '❓ রহস্য' : RARITY[lvl]}</div>
        <div className="gi">{g.image_url ? <img src={g.image_url} alt="" /> : g.emoji || '🎁'}</div>
        <div className="gn">{g.name}</div>
        <div className="gp">{mys ? 'ভেতরে কী আছে? ???' : `⭐ ${g.points} পয়েন্ট`}</div>
        {sub && <div className="gs">{sub}</div>}
      </div>
    );
  };

  const showRoll = (r) => {
    if (seenRoll.current !== null && r.id <= seenRoll.current) return;
    seenRoll.current = r.id;
    setMyVote(null); setResult(null); setRunning(false); setSpinning(false);
    if (r.stopped) { setCur({ id: r.id, stopped: true }); return; }
    const list = actsRef.current;
    const a = list.find((x) => x.id === r.activity_id) || null;
    const b = list.find((x) => x.id === r.activity2_id) || null;
    setRollTab(tabOfAct(a));
    setRolling(true);
    setTimeout(() => {
      setCur({ id: r.id, a, b, by: r.rolled_by });
      setSecs(a?.seconds || 0);
      setRolling(false);
    }, 1200);
  };

  useEffect(() => {
    seenRoll.current = null;
    if (!room) return;
    (async () => {
      const { data } = await supabase.from('rolls').select('id')
        .eq('room_id', room.id).order('id', { ascending: false }).limit(1);
      if (seenRoll.current === null) seenRoll.current = data?.[0]?.id ?? 0;
    })();
  }, [room?.id]);

  // রিয়েলটাইম: রোল, চ্যাট, রুমের পালা/লেভেল, পার্টনার অনলাইন কিনা
  useEffect(() => {
    if (!room || !user) return;
    setOnline(false);
    const channel = supabase.channel('room-' + room.id, { config: { presence: { key: user.id } } })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rolls', filter: `room_id=eq.${room.id}` },
        (p) => showRoll(p.new))
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` },
        (p) => {
          const m = p.new;
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.user_id !== userIdRef.current && tabRef.current !== 'chat') {
            setUnread((u) => u + 1);
            if (navigator.vibrate) navigator.vibrate(60);
          }
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (p) => setRoom(p.new))
      .on('presence', { event: 'sync' }, () => {
        const st = channel.presenceState();
        setOnline(!!partnerRef.current && Object.keys(st).includes(partnerRef.current));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ at: Date.now() });
      });
    return () => { supabase.removeChannel(channel); };
  }, [room?.id, user?.id]);

  useEffect(() => {
    if (!room) { setMsgs([]); setUnread(0); return; }
    loadMsgs();
  }, [room?.id]);

  useEffect(() => {
    if (tab === 'chat') { setUnread(0); if (room) loadMsgs(); }
  }, [tab]);

  useEffect(() => {
    const el = chatBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length, tab]);

  useEffect(() => {
    if (!room) return;
    const t = setInterval(async () => {
      const { data } = await supabase.from('rooms').select('*').eq('id', room.id).single();
      if (data) setRoom(data);
      const { data: lr } = await supabase.from('rolls').select('*')
        .eq('room_id', room.id).order('id', { ascending: false }).limit(1);
      if (lr?.[0] && seenRoll.current !== null) showRoll(lr[0]);
      if (cur?.id && !cur.stopped) {
        const { data: r } = await supabase.rpc('vote_result', { rid: cur.id });
        if (r) { setResult(r); if (r.yes >= 2) claimReward(cur.id); }
      }
      checkGiftEvents();
      if (tab === 'gifts') loadGifts();
      if (tab === 'wish') loadWishes();
      if (tab === 'chat') loadMsgs();
    }, 3000);
    return () => clearInterval(t);
  }, [room?.id, cur?.id, tab]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs((s) => {
      if (s <= 1) { setRunning(false); if (navigator.vibrate) navigator.vibrate(500); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [running]);

  const loadWishes = async () => {
    if (!room) return;
    const { data } = await supabase.from('wishes').select('*').eq('room_id', room.id).order('id');
    setWishes(data || []);
    const { data: m } = await supabase.rpc('matched_wishes', { rid: room.id });
    setMatches(m || []);
  };
  const loadHistory = async () => {
    const { data } = await supabase.from('rolls')
      .select('id, created_at, stopped, a:activities!activity_id(title), b:activities!activity2_id(title)')
      .eq('room_id', room.id).eq('stopped', false).order('id', { ascending: false }).limit(30);
    setHistory(data || []);
  };
  const loadMsgs = async () => {
    if (!room) return;
    const { data } = await supabase.from('messages').select('*')
      .eq('room_id', room.id).order('id', { ascending: false }).limit(100);
    if (data) setMsgs([...data].reverse());
  };
  useEffect(() => {
    if (!room) return;
    if (tab === 'wish') loadWishes();
    if (tab === 'history') { loadHistory(); loadFavs(); }
    if (tab === 'gifts') loadGifts();
  }, [tab, room?.id]);

  // পুশ নোটিফিকেশন
  const syncPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      const j = sub.toJSON();
      await supabase.from('push_subscriptions').upsert({ endpoint: j.endpoint, sub: j }, { onConflict: 'endpoint' });
      setPushOn(true);
    } catch (e) { /* চুপচাপ */ }
  };
  const enablePush = async () => {
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) return setMsg('পুশ কী (VAPID) সেট করা নেই। সেটআপ গাইড দেখুন।');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return setMsg('নোটিফিকেশনের অনুমতি দেওয়া হয়নি');
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(key) });
      }
      const j = sub.toJSON();
      const { error } = await supabase.from('push_subscriptions')
        .upsert({ user_id: user.id, endpoint: j.endpoint, sub: j }, { onConflict: 'endpoint' });
      if (error) return setMsg(error.message);
      setPushOn(true); setMsg('🔔 নোটিফিকেশন চালু হয়েছে');
    } catch (e) {
      setMsg('নোটিফিকেশন চালু করা যায়নি: ' + (e?.message || ''));
    }
  };
  const removePush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
    } catch (e) { /* চুপচাপ */ }
    setPushOn(false);
  };
  const notifyPartner = async (kind) => {
    try {
      if (!room) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ room_id: room.id, kind }),
      });
    } catch (e) { /* পুশ না গেলে খেলা থামবে না */ }
  };
  const installApp = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice.catch(() => {});
    setInstallEvt(null);
  };

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? error.message : 'সাইন আপ হয়েছে');
  };
  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
  };
  const signOut = async () => {
    await removePush();
    supabase.auth.signOut();
    setRoom(null); setCur(null); setAdult(null); setTab('home');
  };
  const leaveRoom = () => { setRoom(null); setCur(null); setTab('home'); };
  const confirmAdult = async () => {
    if (!tick) return setMsg('বয়স ১৮+ কনফার্ম করতে টিক দিন');
    await supabase.rpc('confirm_adult');
    setAdult(true); setMsg('');
  };

  const rememberGender = (g) => {
    setGender(g);
    try { localStorage.setItem('dice_gender', g); } catch (e) { /* চুপচাপ */ }
  };
  const createRoom = async () => {
    if (!gender) return setMsg('আগে আপনার লিঙ্গ বাছুন');
    const c = Math.random().toString(36).slice(2, 7).toUpperCase();
    const { data, error } = await supabase.from('rooms')
      .insert({ code: c, partner1_id: user.id, p1_gender: gender }).select().single();
    if (error) return setMsg(error.message);
    setRoom(data);
  };
  const joinRoom = async () => {
    if (!gender) return setMsg('আগে আপনার লিঙ্গ বাছুন');
    const { data, error } = await supabase.from('rooms')
      .update({ partner2_id: user.id, p2_gender: gender })
      .eq('code', code.trim().toUpperCase()).is('partner2_id', null)
      .select().single();
    if (error || !data) return setMsg('রুম পাওয়া যায়নি বা ভরে গেছে');
    setRoom(data);
  };
  const setLevel = async (n) => {
    const col = isP1 ? 'p1_level' : 'p2_level';
    const { data } = await supabase.from('rooms').update({ [col]: n }).eq('id', room.id).select().single();
    if (data) setRoom(data);
  };
  // রুমে ঢোকার পর (বা পুরোনো রুমে) নিজের লিঙ্গ সেট/বদলানো
  const saveRoomGender = async (g) => {
    if (!room) return rememberGender(g);
    const col = isP1 ? 'p1_gender' : 'p2_gender';
    const { data, error } = await supabase.from('rooms').update({ [col]: g }).eq('id', room.id).select().single();
    if (error) return setMsg(error.message);
    if (data) setRoom(data);
    rememberGender(g);
  };
  const handOver = async () => {
    if (!partnerId) return;
    const { data } = await supabase.from('rooms').update({ turn_user_id: partnerId }).eq('id', room.id).select().single();
    if (data) setRoom(data);
  };

  // g = যার লিঙ্গ অনুযায়ী অপশন বাছা হবে ('any' চিহ্নিত অপশন সবার জন্য)
  const pick = (kind, g) => {
    const pool = acts.filter((a) => a.kind === kind && a.level <= eff &&
      (mood === 'any' || a.mood === 'any' || a.mood === mood) &&
      (!a.gender || a.gender === 'any' || a.gender === g));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  };
  // ডাইসে: বক্স ১ (কী করবেন) = যে ফেলছে তার লিঙ্গ, বক্স ২ (কোথায়/কীভাবে) = পার্টনারের লিঙ্গ
  const makePicks = () => {
    if (!room?.partner2_id) return { err: 'পার্টনার এখনো জয়েন করেনি' };
    if (!myTurn) return { err: 'এখন পার্টনারের পালা, একটু অপেক্ষা করুন 💞' };
    if (!myGender) return { err: 'আগে আপনার লিঙ্গ বাছুন' };
    let a, b = null;
    if (tab === 'dice') {
      if (!partnerGender) return { err: 'পার্টনার এখনো লিঙ্গ বাছেনি' };
      a = pick('action', myGender);
      b = pick('modifier', partnerGender);
    } else a = pick(tab, myGender);
    if (!a) return { err: 'এই লেভেল/মুডে কোনো অ্যাক্টিভিটি নেই' };
    return { a, b };
  };
  const startSpin = () => {
    const { err } = makePicks();
    if (err) return setMsg(err);
    setMsg('');
    setSpinning(true);
  };
  const roll = async () => {
    const { a, b, err } = makePicks();
    setSpinning(false);
    if (err) return setMsg(err);
    setMsg('');
    const { error } = await supabase.from('rolls')
      .insert({ room_id: room.id, activity_id: a.id, activity2_id: b?.id ?? null, rolled_by: user.id });
    if (error) return setMsg(error.message);
    notifyPartner('roll');
  };
  const stop = async () => {
    await supabase.from('rolls').insert({ room_id: room.id, rolled_by: user.id, stopped: true });
    notifyPartner('stop');
  };
  const castVote = async (v) => {
    setMyVote(v);
    await supabase.from('votes').insert({ roll_id: cur.id, user_id: user.id, vote: v });
    const { data } = await supabase.rpc('vote_result', { rid: cur.id });
    if (data) { setResult(data); if (data.yes >= 2) claimReward(cur.id); }
  };
  const toggleFav = async (a) => {
    if (!a) return;
    if (favs.some((f) => f.activity_id === a.id))
      await supabase.from('favorites').delete().eq('activity_id', a.id).eq('user_id', user.id);
    else await supabase.from('favorites').insert({ activity_id: a.id, user_id: user.id });
    loadFavs();
  };
  const addWish = async () => {
    if (!wish.trim()) return;
    await supabase.from('wishes').insert({ room_id: room.id, user_id: user.id, body: wish.trim() });
    setWish(''); loadWishes();
  };
  const delWish = async (id) => { await supabase.from('wishes').delete().eq('id', id); loadWishes(); };

  const sendMsg = async (text) => {
    const body = (text ?? chatText).trim();
    if (!body || !room) return;
    const { data, error } = await supabase.from('messages')
      .insert({ room_id: room.id, user_id: user.id, body }).select().single();
    if (error) return setMsg(error.message);
    setMsgs((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
    setChatText('');
    notifyPartner('msg');
  };

  const wipeRoom = async () => {
    if (!window.confirm('রুমের সব ইতিহাস, চ্যাট, ভোট ও গোপন ইচ্ছা দুজনের জন্যই মুছে যাবে। আর ফেরানো যাবে না। মুছবেন?')) return;
    const { error } = await supabase.rpc('clear_room_data', { rid: room.id, also_favs: false });
    if (error) return setMsg(error.message);
    setCur(null); setHistory([]); setWishes([]); setMatches([]); setMsgs([]); setUnread(0);
    setMsg('✅ রুমের সব ডেটা মুছে ফেলা হয়েছে');
  };
  const wipeFavs = async () => {
    if (!window.confirm('আপনার পছন্দের তালিকা মুছে ফেলবেন?')) return;
    const { error } = await supabase.from('favorites').delete().eq('user_id', user.id);
    if (error) return setMsg(error.message);
    setFavs([]);
    setMsg('✅ পছন্দের তালিকা মুছে ফেলা হয়েছে');
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const bothVoted = result && result.total >= 2;
  const verdict = !bothVoted ? null
    : result.no > 0 ? '😌 আজ না, অন্য কিছু বেছে নিন'
    : result.yes === 2 ? '💖 দুজনেই হ্যাঁ!' : '🤔 দুজনেই রাজি, তবে ধীরে';

  const showCur = cur && (cur.stopped || tabOfAct(cur.a) === tab);
  const showRolling = rolling && rollTab === tab;
  const inRoom = user && adult && room;
  const lastTheirs = [...msgs].reverse().find((m) => m.user_id !== user?.id);
  const resLevel = cur && !cur.stopped ? Math.max(cur.a?.level || 1, cur.b?.level || 1) : 1;
  const GenderPills = ({ value, onPick }) => (
    <div>
      {Object.entries(GENDERS).map(([k, l]) => (
        <button key={k} className={'pill' + (value === k ? ' on' : '')} onClick={() => onPick(k)}>{l}</button>
      ))}
    </div>
  );

  const StatusBar = () => (
    <div className="status">
      <span className="badge"><span className={'dotp' + (online ? ' on' : '')} />{online ? 'পার্টনার অনলাইন' : 'পার্টনার অফলাইন'}</span>
      {room?.partner2_id && (
        <span className={'badge turn' + (myTurn ? '' : ' wait')}>{myTurn ? '🎯 এখন আপনার পালা' : '⏳ এখন পার্টনারের পালা'}</span>
      )}
    </div>
  );

  return (
    <div className="app" style={{ '--accent': accent }}>
      <style>{CSS}</style>
      <div className="bg" />
      {FLOATERS.map(([e, x, y, d], i) => (
        <span key={i} className="float" style={{ left: x, top: y, animationDelay: d }}>{e}</span>
      ))}
      <div className="side l">
        {['🌴', '💃', '👙', '🍹', '🏖️'].map((e, i) => (
          <span key={i} className={e === '💃' ? 'dn' : ''} style={{ animationDelay: i * 0.4 + 's' }}>{e}</span>
        ))}
      </div>
      <div className="side r">
        {['🕶️', '🕺', '🩳', '🩱', '🌴'].map((e, i) => (
          <span key={i} className={e === '🕺' ? 'dn' : ''} style={{ animationDelay: i * 0.5 + 's' }}>{e}</span>
        ))}
      </div>
      <div className="waves"><div>{'🌊'.repeat(60)}</div></div>

      <div className="z">
        <h1 className="logo">💋 Dice App</h1>
        <p className="sub">শুধু দুজনের জন্য · ১৮+ · সম্মতিই আসল</p>

        {!user && (
          <div className="glass" style={{ animation: 'pop .4s ease-out' }}>
            <div className="stkrow">
              {HERO_STICKERS.map(([e, r], i) => <span key={i} className="sticker" style={{ '--r': r + 'deg' }}>{e}</span>)}
            </div>
            <p className="muted">লগইন করে শুরু করুন</p>
            <input className="inp" placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="inp" type="password" placeholder="পাসওয়ার্ড (৬+ অক্ষর)" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn" onClick={signIn}>🔑 লগইন</button>
            <button className="btn ghost" onClick={signUp}>✨ সাইন আপ</button>
          </div>
        )}

        {user && adult === false && (
          <div className="glass" style={{ animation: 'pop .4s ease-out' }}>
            <div className="hero" style={{ fontSize: 64 }}>🔞</div>
            <p style={{ fontSize: 16, lineHeight: 1.6 }}>এই অ্যাপ শুধু প্রাপ্তবয়স্ক দম্পতির জন্য। সব কিছু পারস্পরিক সম্মতিতে, যেকোনো সময় থামানো যাবে।</p>
            <label style={{ fontSize: 16 }}>
              <input type="checkbox" checked={tick} onChange={(e) => setTick(e.target.checked)} /> আমার বয়স ১৮+ এবং আমি রাজি
            </label>
            <div><button className="btn big" onClick={confirmAdult}>চালিয়ে যান 💞</button></div>
          </div>
        )}

        {user && adult && !room && (
          <div className="glass" style={{ animation: 'pop .4s ease-out' }}>
            <div className="stkrow">
              {[['🍷', -10], ['💞', 8], ['🌹', -6]].map(([e, r], i) => <span key={i} className="sticker" style={{ '--r': r + 'deg' }}>{e}</span>)}
            </div>
            <div className="muted">আপনার লিঙ্গ বাছুন (ডাইসের অপশন মেলাতে লাগে)</div>
            <GenderPills value={gender} onPick={rememberGender} />
            <button className="btn big" onClick={createRoom}>🌹 নতুন রুম বানান</button>
            <p className="muted">অথবা পার্টনারের রুম কোড দিয়ে জয়েন করুন</p>
            <input className="inp" placeholder="রুম কোড" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn ghost" onClick={joinRoom}>জয়েন করুন</button>
          </div>
        )}

        {inRoom && !myGender && (
          <div className="glass" style={{ animation: 'pop .4s ease-out' }}>
            <div className="hero" style={{ fontSize: 56 }}>💞</div>
            <p style={{ fontSize: 16 }}>শুরুর আগে আপনার লিঙ্গ বাছুন। ডাইসের অপশন এই অনুযায়ী আসবে।</p>
            <GenderPills value={myGender} onPick={saveRoomGender} />
            <div style={{ marginTop: 8 }}><button className="btn ghost tiny" onClick={leaveRoom}>← রুম বদলান</button></div>
          </div>
        )}

        {inRoom && myGender && (
          <>
            <div style={{ margin: '4px 0 6px' }}>
              <span className="muted">রুম কোড</span><span className="code">{room.code}</span>
              <div>
                {!room.partner2_id && <span className="muted">⏳ পার্টনারের জন্য অপেক্ষা...</span>}
                {tab !== 'home' && <button className="btn ghost tiny" onClick={() => setTab('home')}>🏠 হোম</button>}
                <button className="btn ghost tiny" onClick={leaveRoom}>← রুম বদলান</button>
              </div>
            </div>

            {gnotice && (
              <div className="notice" onClick={() => { setGnotice(null); setGv('mine'); setTab('gifts'); }}>
                {noticeText(gnotice)}
              </div>
            )}

            {tab === 'home' && (
              <>
                <div className="stkrow">
                  {HERO_STICKERS.map(([e, r], i) => (
                    <span key={i} className="sticker" style={{ '--r': r + 'deg', animationDelay: i * 0.3 + 's' }}>{e}</span>
                  ))}
                </div>
                <div className="beach">
                  <span>🕺</span><span style={{ animationDelay: '.2s' }}>🌴</span>
                  <span style={{ animationDelay: '.4s' }}>💞</span>
                  <span style={{ animationDelay: '.6s' }}>🏖️</span><span style={{ animationDelay: '.8s' }}>💃</span>
                </div>
                <p className="welcome">
                  {room.partner2_id ? '💞 দুজনেই এসেছেন, শুরু করুন!' : '⏳ পার্টনার আসার অপেক্ষায়...'}
                </p>
                <StatusBar />
                <div>
                  <span className="badge">{lvLabel(eff)}</span>
                  <span className="badge">আজকের মুড: {MOODS[mood]}</span>
                </div>
                <div style={{ margin: '6px 0' }}>
                  <div className="muted">আমি</div>
                  <GenderPills value={myGender} onPick={saveRoomGender} />
                </div>
                <div style={{ margin: '8px 0' }}>
                  {Object.entries(MOODS).map(([k, l]) => (
                    <button key={k} className={'pill' + (mood === k ? ' on' : '')} onClick={() => setMood(k)}>{l}</button>
                  ))}
                </div>

                {unread > 0 && lastTheirs && (
                  <div className="notice" onClick={() => setTab('chat')}>💌 পার্টনার: {lastTheirs.body}</div>
                )}

                <div className="h3">🎮 গেম বেছে নিন</div>
                <div className="grid">
                  {GAME_TABS.map((k, i) => (
                    <button key={k} className="gcard" style={{ '--c': T[k].color, animationDelay: i * 0.08 + 's' }} onClick={() => setTab(k)}>
                      <span className="s" style={{ left: 8, top: 6 }}>{T[k].stk[0]}</span>
                      <span className="s" style={{ right: 8, top: 8 }}>{T[k].stk[1]}</span>
                      <div className="e">{T[k].icon}</div>
                      <div className="t">{T[k].label}</div>
                      <div className="d">{HUB_TEXT[k]}</div>
                    </button>
                  ))}
                </div>

                <div className="row2">
                  {['wish', 'history'].map((k) => (
                    <button key={k} className="mini" style={{ '--c': T[k].color }} onClick={() => setTab(k)}>
                      {T[k].icon} {k === 'wish' ? 'গোপন ইচ্ছা' : 'পছন্দ ও ইতিহাস'}
                    </button>
                  ))}
                </div>
                <div className="row2">
                  <button className="mini" style={{ '--c': T.chat.color }} onClick={() => setTab('chat')}>
                    {T.chat.icon} রুম চ্যাট{unread > 0 ? ` (${unread})` : ''}
                  </button>
                  <button className="mini" style={{ '--c': '#ff3d7f' }} onClick={handOver} disabled={!partnerId || !myTurn}>
                    🔁 পালা দিন
                  </button>
                </div>
                <div className="row2">
                  <button className="mini" style={{ '--c': T.gifts.color }} onClick={() => setTab('gifts')}>🎁 গিফট</button>
                  <div className="mini" style={{ '--c': '#ffd369' }}>🪙 {coins} কয়েন</div>
                </div>
                <p className="muted">🛡️ ⛔ থামুন বাটন সব গেমেই আছে। কেউ অস্বস্তি বোধ করলে সাথে সাথে থামান। 💗</p>

                <div className="glass setbox">
                  <div className="h3" style={{ marginTop: 0 }}>📲 অ্যাপ ও নোটিফিকেশন</div>
                  {!standalone && installEvt && (
                    <div><button className="btn" onClick={installApp}>📲 ফোনে অ্যাপ হিসেবে ইন্সটল করুন</button></div>
                  )}
                  {!standalone && !installEvt && isIOS && (
                    <p className="muted">আইফোনে: Safari-তে Share বাটন চাপুন, তারপর “Add to Home Screen”। নোটিফিকেশনের জন্য এটা দরকার।</p>
                  )}
                  {standalone && <p className="muted">✅ অ্যাপ হিসেবে চালু আছে</p>}
                  {pushOk ? (
                    pushOn ? (
                      <div>
                        <p className="muted">🔔 নোটিফিকেশন চালু আছে। পার্টনার রোল করলে বা মেসেজ দিলে জানাবে। লক স্ক্রিনে কোনো বিস্তারিত দেখানো হয় না।</p>
                        <button className="btn ghost tiny" onClick={removePush}>🔕 বন্ধ করুন</button>
                      </div>
                    ) : (
                      <button className="btn ghost" onClick={enablePush}>🔔 নোটিফিকেশন চালু করুন</button>
                    )
                  ) : (
                    <p className="muted">এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই। (আইফোনে আগে হোম স্ক্রিনে যোগ করুন)</p>
                  )}
                </div>
              </>
            )}

            {isGameTab && (
              <>
                <h2 style={{ margin: '10px 0 2px', fontSize: 24 }}>{T[tab].icon} {T[tab].title}</h2>
                <div className="stkrow">
                  {T[tab].stk.map((e, i) => (
                    <span key={i} className="sticker" style={{ '--r': (i % 2 ? 9 : -9) + 'deg', fontSize: 26, animationDelay: i * 0.3 + 's' }}>{e}</span>
                  ))}
                </div>
                <p className="muted" style={{ margin: 0 }}>{T[tab].desc}</p>
                <StatusBar />

                {unread > 0 && lastTheirs && (
                  <div className="notice" onClick={() => setTab('chat')}>💌 পার্টনার: {lastTheirs.body}</div>
                )}

                <div className="glass" style={{ padding: 12 }}>
                  <div className="muted">আমি রাজি আছি</div>
                  {[1, 2, 3].map((n) => (
                    <button key={n} className={'pill' + (myLevel === n ? ' on' : '')} onClick={() => setLevel(n)}>
                      {lv(n).icon} {n}
                    </button>
                  ))}
                  <div style={{ fontSize: 13, margin: '4px 0 8px' }}>দুজনের মিল: <b>{lvLabel(eff)}</b></div>
                  <div>
                    {Object.entries(MOODS).map(([k, l]) => (
                      <button key={k} className={'pill' + (mood === k ? ' on' : '')} onClick={() => setMood(k)}>{l}</button>
                    ))}
                  </div>
                </div>

                {tab === 'card' ? (
                  <div className="fan">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="c" style={{
                        transform: `rotate(${(i - 1) * 10}deg)`,
                        animation: showRolling ? `shuf 0.5s ${i * 0.1}s infinite` : 'none',
                      }}>🃏</div>
                    ))}
                  </div>
                ) : (
                  <div className={'hero' + (tab === 'dice' && spinning ? ' loop' : showRolling ? ' spin' : '')}>{T[tab].hero}</div>
                )}
                {tab === 'dice' && spinning && <p className="muted">🎲 ডাইস ঘুরছে... ইচ্ছামতো সময়ে ✋ স্টপ চাপুন</p>}

                {cur?.stopped && !rolling && <div className="stopbox">⛔ থামানো হয়েছে। কোনো সমস্যা নেই। 💗</div>}

                {showCur && !cur.stopped && !rolling && (
                  <>
                    <div className="res" style={{ animation: tab === 'card' ? 'flip .6s ease-out' : 'pop .4s ease-out' }}>
                      <div className="lvbadge">{lvLabel(resLevel)}</div>
                      {cur.a?.image_url && <img src={cur.a.image_url} alt="" />}
                      {tab === 'dice' ? (
                        <>
                          {cur.by && (
                            <div className="who">
                              {cur.by === user.id ? '🎯 আপনি পার্টনারের সাথে এটা করুন' : '🎯 পার্টনার আপনার সাথে এটা করবে'}
                            </div>
                          )}
                          <div className={'dbox' + (cur.b ? '' : ' one')}>
                            <div className="b"><small>কী করবেন</small>{cur.a?.title}</div>
                            {cur.b && <div className="b"><small>কোথায়/কীভাবে</small>{cur.b.title}</div>}
                          </div>
                        </>
                      ) : (
                        <>
                          {cur.a?.title}
                          {cur.b && <div className="mod">{cur.b.title}</div>}
                        </>
                      )}
                      {tab !== 'dice' && cur.by &&<div className="muted" style={{ marginTop: 6 }}>{cur.by === user.id ? 'আপনি ফেলেছেন' : 'পার্টনার ফেলেছে'}</div>}
                      <div style={{ marginTop: 10 }}>
                        <button className="btn ghost tiny" onClick={() => toggleFav(cur.a)}>
                          {favs.some((f) => f.activity_id === cur.a?.id) ? '⭐ সেভ করা' : '☆ সেভ করুন'}
                        </button>
                      </div>
                    </div>

                    <div className="muted">🙈 গোপন ভোট · দুজনেই হ্যাঁ দিলে 🎁 গিফট পাবেন</div>
                    {!myVote ? (
                      <div>
                        <button className="btn" onClick={() => castVote('yes')}>✅ হ্যাঁ</button>
                        <button className="btn ghost" onClick={() => castVote('maybe')}>🤔 হয়তো</button>
                        <button className="btn ghost" onClick={() => castVote('no')}>❌ না</button>
                      </div>
                    ) : (
                      <p style={{ fontSize: 17 }}>{verdict || '💌 ভোট দিয়েছেন, পার্টনারের অপেক্ষা...'}</p>
                    )}

                    <div className="glass" style={{ padding: 12 }}>
                      <div className="time">⏱ {mm}:{ss}</div>
                      {[60, 180, 300].map((s) => (
                        <button key={s} className="pill" onClick={() => { setSecs(s); setRunning(true); }}>{s / 60} মিনিট</button>
                      ))}
                      {secs > 0 && <button className="pill on" onClick={() => setRunning(!running)}>{running ? '⏸ পজ' : '▶ শুরু'}</button>}
                    </div>
                  </>
                )}

                <div style={{ marginTop: 10 }}>
                  {tab === 'dice' ? (
                    spinning
                      ? <button className="btn big go" onClick={roll}>✋ স্টপ</button>
                      : <button className="btn big" onClick={startSpin} disabled={rolling || !myTurn}>{rolling ? '...' : T[tab].btn}</button>
                  ) : (
                    <button className="btn big" onClick={roll} disabled={rolling || !myTurn}>{rolling ? '...' : T[tab].btn}</button>
                  )}
                  {showCur && !cur.stopped && !rolling && <button className="btn ghost" onClick={roll} disabled={!myTurn}>পাস করুন</button>}
                  <button className="btn stop" onClick={stop}>⛔ থামুন</button>
                </div>
                {!myTurn && <p className="muted">⏳ পার্টনার রোল করলে এখানে সাথে সাথে দেখা যাবে। আপনার পালা এলে নোটিফিকেশন পাবেন।</p>}

                <div className="quick">
                  <div className="muted">⚡ দ্রুত মেসেজ</div>
                  {QUICK_MSGS.map((q) => (
                    <button key={q} className="pill" onClick={() => sendMsg(q)}>{q}</button>
                  ))}
                </div>
              </>
            )}

            {tab === 'chat' && (
              <>
                <h2 style={{ margin: '10px 0 2px', fontSize: 24 }}>🗨️ রুম চ্যাট</h2>
                <StatusBar />
                <div className="glass chatbox" ref={chatBoxRef}>
                  {msgs.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>এখনো কোনো মেসেজ নেই। প্রথম মেসেজটা আপনি দিন 💌</p>}
                  {msgs.map((m) => (
                    <div key={m.id} className={'bub ' + (m.user_id === user.id ? 'me' : 'th')}>
                      {m.body}
                      <small>{new Date(m.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                  ))}
                </div>
                <div className="quick">
                  {QUICK_MSGS.map((q) => (
                    <button key={q} className="pill" onClick={() => sendMsg(q)}>{q}</button>
                  ))}
                </div>
                <div className="sendrow">
                  <input
                    className="inp"
                    placeholder="মেসেজ লিখুন..."
                    value={chatText}
                    maxLength={1000}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendMsg(); }}
                  />
                  <button className="btn" onClick={() => sendMsg()}>পাঠান</button>
                </div>
              </>
            )}

            {tab === 'wish' && (
              <>
                <h2 style={{ margin: '10px 0 2px', fontSize: 24 }}>💭 গোপন ইচ্ছা</h2>
                <div className="stkrow">
                  {T.wish.stk.map((e, i) => <span key={i} className="sticker" style={{ '--r': (i % 2 ? 9 : -9) + 'deg', fontSize: 26 }}>{e}</span>)}
                </div>
                <p className="muted">নিজের ইচ্ছা লিখুন। এগুলো পার্টনার দেখবে না। দুজনের একই ইচ্ছা মিললে শুধু তখনই নিচে দেখাবে। 🤫</p>
                <div className="glass">
                  <input className="inp" placeholder="যেমন: একসাথে সিনেমা দেখা" value={wish} onChange={(e) => setWish(e.target.value)} />
                  <button className="btn" onClick={addWish}>💌 যোগ করুন</button>
                </div>
                <div className="h3">💞 দুজনের মিল</div>
                {matches.length === 0 ? <p className="muted">এখনো কিছু মেলেনি</p> :
                  matches.map((m) => <div key={m} className="item" style={{ borderColor: accent }}>{m}</div>)}
                <div className="h3">📝 আমার তালিকা</div>
                {wishes.filter((w) => w.user_id === user.id).map((w) => (
                  <div key={w.id} className="item">
                    {w.body} <button className="btn ghost tiny" onClick={() => delWish(w.id)}>মুছুন</button>
                  </div>
                ))}
              </>
            )}

            {tab === 'gifts' && (
              <>
                <h2 style={{ margin: '10px 0 2px', fontSize: 24 }}>🎁 গিফট ও কয়েন</h2>
                <div className="stkrow">
                  {T.gifts.stk.map((e, i) => <span key={i} className="sticker" style={{ '--r': (i % 2 ? 9 : -9) + 'deg', fontSize: 26 }}>{e}</span>)}
                </div>
                <div className="coinbar">🪙 {coins}</div>
                <p className="muted">দুজনেই "হ্যাঁ" দিলে একটি করে গিফট কার্ড ও কয়েন পাবেন। কয়েন দিয়ে পার্টনারকে গিফট দিতে পারবেন।</p>
                <div>
                  {[['mine', '🎴 আমার কালেকশন'], ['shop', '🛍️ গিফট শপ']].map(([k, l]) => (
                    <button key={k} className={'pill' + (gv === k ? ' on' : '')} onClick={() => setGv(k)}>{l}</button>
                  ))}
                </div>

                {gv === 'mine' && (
                  myGifts.length === 0 ? (
                    <p className="muted">এখনো কোনো গিফট নেই। খেলুন আর দুজনেই হ্যাঁ বলুন! 💞</p>
                  ) : (
                    <div className="ggrid">
                      {myGifts.map((u) => {
                        const box = gById(u.gift_id);
                        if (!box) return null;
                        const isBox = box.kind === 'mystery';
                        const shown = isBox && u.opened ? gById(u.revealed_gift_id) : box;
                        return (
                          <div key={u.id} className="gwrap">
                            {giftCard(shown || box, (SRC[u.source] || '') + (isBox && u.opened ? ' · 📦 খোলা' : ''))}
                            {isBox && !u.opened && (
                              <button className="btn tiny" disabled={gbusy} onClick={() => openBox(u)}>🎁 খুলুন</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {gv === 'shop' && (
                  <>
                    {!room.partner2_id && <p className="muted">⏳ পার্টনার জয়েন করলে গিফট পাঠাতে পারবেন</p>}
                    {catalog.filter((g) => g.is_active && g.price > 0).length === 0 && (
                      <p className="muted">শপে এখনো কোনো গিফট নেই</p>
                    )}
                    <div className="ggrid">
                      {catalog.filter((g) => g.is_active && g.price > 0).map((g) => (
                        <div key={g.id} className="gwrap">
                          {giftCard(g, '🪙 ' + g.price)}
                          <button className="btn tiny" disabled={gbusy || coins < g.price || !room.partner2_id} onClick={() => buyGift(g)}>
                            💝 পার্টনারকে দিন
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {tab === 'history' && (
              <>
                <h2 style={{ margin: '10px 0 2px', fontSize: 24 }}>⭐ পছন্দ ও ইতিহাস</h2>
                <div className="stkrow">
                  {T.history.stk.map((e, i) => <span key={i} className="sticker" style={{ '--r': (i % 2 ? 9 : -9) + 'deg', fontSize: 26 }}>{e}</span>)}
                </div>
                <div className="h3">⭐ পছন্দের তালিকা</div>
                {favs.length === 0 && <p className="muted">এখনো কিছু সেভ করা নেই</p>}
                {favs.map((f) => <div key={f.activity_id} className="item">{f.activities?.title}</div>)}
                <div className="h3">🕘 সাম্প্রতিক রোল</div>
                {history.map((h) => (
                  <div key={h.id} className="item">
                    {h.a?.title}{h.b ? ' · ' + h.b.title : ''}
                    <br /><small className="muted">{new Date(h.created_at).toLocaleString('bn-BD')}</small>
                  </div>
                ))}

                <div className="glass setbox">
                  <div className="h3" style={{ marginTop: 0 }}>🗑️ ডেটা মুছুন</div>
                  <p className="muted">রুমের ইতিহাস, চ্যাট, ভোট ও গোপন ইচ্ছা দুজনের জন্যই মুছে যাবে। আর ফেরানো যাবে না।</p>
                  <button className="btn stop tiny" onClick={wipeRoom}>🗑️ রুমের সব ডেটা মুছুন</button>
                  <button className="btn ghost tiny" onClick={wipeFavs}>⭐ আমার পছন্দ মুছুন</button>
                </div>
              </>
            )}
          </>
        )}

        {popup && (
          <div className="modal" onClick={() => setPopup(null)}>
            <div className="mbox" onClick={(e) => e.stopPropagation()}>
              <div className="h3" style={{ marginTop: 0 }}>{popup.title}</div>
              {popup.gift && giftCard(popup.gift)}
              {popup.note && <p style={{ fontSize: 17 }}>{popup.note}</p>}
              <button className="btn" onClick={() => { setPopup(null); setGv('mine'); setTab('gifts'); }}>🎴 কালেকশন</button>
              <button className="btn ghost" onClick={() => setPopup(null)}>ঠিক আছে</button>
            </div>
          </div>
        )}

        {msg && <p style={{ color: '#ffd369', fontSize: 15 }}>{msg}</p>}
        {user && <div style={{ marginTop: 16 }}><button className="btn ghost tiny" onClick={signOut}>লগআউট</button></div>}
      </div>

      {inRoom && myGender && (
        <nav className="tabs">
          {Object.entries(T).map(([k, v]) => (
            <button key={k} className={tab === k ? 'on' : ''} style={{ '--nc': v.color }} onClick={() => setTab(k)}>
              <span>{v.icon}</span>{v.label}{k === 'chat' && unread > 0 ? <b className="dot">{unread}</b> : <i />}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

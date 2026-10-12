'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import Avatar, { SLOTS, HAIR_STYLES, SKINS, HAIR_COLORS } from '../lib/Avatar';

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
  wheel:   { icon: '🎡', label: 'চাকা',   color: '#d4af37', title: 'ইচ্ছার চাকা', desc: 'চাকা ঘুরান, ভাগ্যে কী আছে দেখুন ✨', hero: '', btn: '🎡 চাকা ঘোরান', stk: ['✨', '🔥', '💞'] },
  gifts:   { icon: '🎁', label: 'গিফট',   color: '#ff9f1c', title: 'গিফট ও কয়েন', desc: '', hero: '', btn: '', stk: ['🎁', '💝', '✨'] },
  avatar:  { icon: '👗', label: 'সাজ',   color: '#ff6ad5', title: 'সাজ-সজ্জা', desc: '', hero: '', btn: '', stk: ['👗', '💄', '👠'] },
  chat:    { icon: '🗨️', label: 'চ্যাট',   color: '#5ec8ff', title: 'রুম চ্যাট', desc: '', hero: '', btn: '', stk: ['💌', '😘', '🫶'] },
};
const GAME_TABS = ['dice', 'card', 'truth', 'dare', 'wheel'];
const HUB_TEXT = {
  dice: 'কী করবেন + কীভাবে, দুই ডাইসে',
  card: 'ঘুরন্ত ডেক থেকে একটা কার্ড',
  truth: 'সত্যি বলার খেলা',
  dare: 'সাহসের চ্যালেঞ্জ',
  wheel: 'ইচ্ছার চাকা ঘুরিয়ে ভাগ্য দেখুন',
};
const QUICK_MSGS = ['😘 আমি রেডি', '⏳ একটু অপেক্ষা করো', '🔄 অন্যটা দাও', '💗 একটু বিরতি চাই', '🔥 আরও চাই'];

const tabOfAct = (a) => (a?.kind === 'card' ? 'card' : a?.kind === 'truth' ? 'truth' : a?.kind === 'dare' ? 'dare' : a?.kind === 'wheel' ? 'wheel' : 'dice');

const DOCK = [['home', 'হোম'], ['games', 'গেম'], ['gifts', 'গিফট'], ['chat', 'চ্যাট'], ['avatar', 'সাজ']];
const DockIcon = ({ k }) => {
  const p = {
    home: <><path d="M3.5 11 12 3.5 20.5 11" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5.5h4V20" /></>,
    games: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="9" cy="9" r=".9" fill="currentColor" /><circle cx="15" cy="9" r=".9" fill="currentColor" /><circle cx="12" cy="12" r=".9" fill="currentColor" /><circle cx="9" cy="15" r=".9" fill="currentColor" /><circle cx="15" cy="15" r=".9" fill="currentColor" /></>,
    gifts: <><rect x="3.5" y="8" width="17" height="4" rx="1" /><path d="M5 12h14v8H5z" /><path d="M12 8v12" /><path d="M12 8C9.5 3.8 5.8 5.5 7.4 7.8 8.2 8.2 10.4 8.2 12 8Zm0 0c2.5-4.200 6.200-2.500 4.600-.2-.8.400-3 .4-4.600.2Z" /></>,
    chat: <><path d="M4.5 5.5h15v10.5H10l-4.500 3.500V16h-1z" /></>,
    avatar: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20.500c.5-4 3.800-6 7.500-6s7 2 7.500 6" /></>,
  }[k];
  return <svg viewBox="0 0 24 24" aria-hidden="true">{p}</svg>;
};

const urlB64ToUint8Array = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const CSS = `
.app{--gold:#e3bd76;--gold2:#f7e0b0;--line:rgba(255,255,255,.09);--ink:#f6eff3;--mut:#a99ba8;position:relative;min-height:100vh;padding:calc(18px + env(safe-area-inset-top)) 16px calc(124px + env(safe-area-inset-bottom));max-width:480px;margin:0 auto;text-align:center;overflow-x:hidden;font-family:'Hind Siliguri',sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
.bg{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(120% 55% at 50% -8%,color-mix(in srgb,var(--accent) 26%,transparent) 0,transparent 62%),radial-gradient(90% 50% at 100% 100%,rgba(227,189,118,.10) 0,transparent 60%),radial-gradient(70% 40% at 0% 70%,rgba(120,40,160,.14) 0,transparent 60%),linear-gradient(180deg,#0e0815,#07050b)}
.z{position:relative;z-index:1}
.logo{font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;letter-spacing:.02em;margin:0;background:linear-gradient(90deg,#f7e0b0,#e3bd76 50%,#f3c9d8);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{font-size:11px;letter-spacing:.2em;color:var(--mut);margin:2px 0 14px}
.ptitle{font-size:22px;font-weight:700;letter-spacing:.01em;margin:8px 0 2px;color:#fff}
.glass{background:linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.025));border:1px solid var(--line);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border-radius:22px;padding:16px;margin:12px 0;box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 22px 44px -22px rgba(0,0,0,.75)}
.emblem{width:76px;height:76px;margin:6px auto 12px;border-radius:24px;display:grid;place-items:center;font-size:36px;background:linear-gradient(145deg,rgba(227,189,118,.28),rgba(227,189,118,.06));border:1px solid rgba(227,189,118,.4);box-shadow:0 14px 34px -12px rgba(227,189,118,.5)}
.inp{width:100%;padding:14px 16px;margin:6px 0;border-radius:14px;border:1px solid var(--line);background:rgba(0,0,0,.35);color:#fff;font-size:16px;box-sizing:border-box;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s}
.inp::placeholder{color:#7d6f7c}
.inp:focus{border-color:rgba(227,189,118,.65);box-shadow:0 0 0 3px rgba(227,189,118,.15)}
.btn{padding:12px 22px;margin:4px;border:none;border-radius:999px;color:#1a1008;font-size:15px;font-weight:700;background:linear-gradient(135deg,#f6dba0,#cf9f4f);box-shadow:0 12px 26px -12px rgba(227,189,118,.75),inset 0 1px 0 rgba(255,255,255,.45);cursor:pointer;font-family:inherit;transition:transform .15s,filter .2s}
.btn:active{transform:scale(.96)}
.btn:disabled{opacity:.42;filter:saturate(.6)}
.big{padding:15px 32px;font-size:17px}
.ghost{background:rgba(255,255,255,.06);color:var(--ink);box-shadow:none;border:1px solid var(--line);font-weight:600}
.stop{background:linear-gradient(135deg,#e5314f,#8d1230);color:#fff;box-shadow:0 12px 26px -12px rgba(229,49,79,.7)}
.go{background:linear-gradient(135deg,#34d07a,#0f7a3f);color:#fff;box-shadow:0 12px 26px -12px rgba(52,208,122,.6)}
.tiny{font-size:12px;padding:7px 14px;font-weight:600}
.pill{padding:8px 15px;margin:3px;border-radius:999px;font-size:13px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:#e9dfe6;font-family:inherit;cursor:pointer;transition:all .2s}
.pill:disabled{opacity:.4}
.pill.on{background:linear-gradient(135deg,rgba(227,189,118,.26),rgba(227,189,118,.08));border-color:rgba(227,189,118,.6);color:var(--gold2)}
.seg{display:flex;gap:4px;padding:4px;margin:10px 0;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid var(--line);overflow-x:auto;scrollbar-width:none}
.seg::-webkit-scrollbar{display:none}
.seg button{flex:1 0 auto;padding:10px 14px;border:0;border-radius:14px;background:transparent;color:var(--mut);font-family:inherit;font-size:13px;font-weight:600;white-space:nowrap;cursor:pointer;transition:all .22s}
.seg button:disabled{opacity:.4}
.seg button.on{background:linear-gradient(135deg,#f6dba0,#cf9f4f);color:#1a1008;box-shadow:0 8px 18px -8px rgba(227,189,118,.7)}
.hero{font-size:72px;margin:10px 0 6px;filter:drop-shadow(0 10px 26px color-mix(in srgb,var(--accent) 55%,transparent))}
.spin{animation:spin 1.2s ease-out}
.loop{animation:spin .8s linear infinite}
.who{font-size:14px;color:var(--gold2);margin:2px 0 12px}
.dbox{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0}
.dbox.one{grid-template-columns:1fr}
.dbox .b{padding:16px 10px 18px;border-radius:18px;border:1px solid var(--line);background:rgba(0,0,0,.32);font-size:18px;line-height:1.45;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.dbox .b small{display:block;font-size:10.5px;letter-spacing:.14em;color:var(--gold);margin-bottom:8px}
.lvbadge{display:inline-block;padding:4px 14px;border-radius:999px;background:rgba(227,189,118,.1);border:1px solid rgba(227,189,118,.4);color:var(--gold2);font-size:12px;letter-spacing:.04em;margin-bottom:10px}
.fan{height:152px;margin:10px 0}
.fan .c{display:inline-block;width:92px;height:134px;margin:0 -18px;border-radius:16px;background:repeating-linear-gradient(45deg,rgba(227,189,118,.07) 0 6px,transparent 6px 12px),linear-gradient(160deg,#2a1636,#0c0714);border:1px solid rgba(227,189,118,.55);font-size:34px;line-height:130px;box-shadow:0 16px 30px -10px rgba(0,0,0,.8)}
.res{position:relative;padding:22px 18px 18px;border-radius:26px;background:linear-gradient(160deg,rgba(255,255,255,.09),rgba(255,255,255,.025));border:1px solid rgba(227,189,118,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 26px 50px -22px rgba(0,0,0,.8),0 0 40px -18px var(--gold);font-size:20px;line-height:1.55;margin:14px 0;overflow:hidden}
.res::before{content:'';position:absolute;left:20%;right:20%;top:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
.res img{width:100%;max-height:320px;object-fit:cover;border-radius:16px;margin-bottom:12px}
.mod{color:var(--gold2);margin-top:8px}
.stopbox{padding:16px;border-radius:20px;background:rgba(150,20,45,.28);border:1px solid rgba(255,90,110,.35);margin:12px 0;font-size:17px}
.time{font-size:44px;font-weight:600;letter-spacing:.06em;font-variant-numeric:tabular-nums;color:var(--gold2)}
.code{display:inline-block;padding:4px 16px;margin-left:8px;border-radius:999px;background:rgba(227,189,118,.08);border:1px solid rgba(227,189,118,.4);color:var(--gold2);font-size:16px;letter-spacing:.28em;font-weight:700}
.h3{display:flex;align-items:center;gap:12px;margin:24px 0 12px;font-size:12.5px;font-weight:700;letter-spacing:.14em;color:var(--gold)}
.h3::before,.h3::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(227,189,118,.4))}
.h3::after{background:linear-gradient(270deg,transparent,rgba(227,189,118,.4))}
.item{background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.025));border:1px solid var(--line);padding:13px 15px;border-radius:16px;margin:8px 0;font-size:15.5px;text-align:left}
.muted{font-size:12.5px;color:var(--mut);line-height:1.55}
.welcome{font-size:14px;color:#ecdde6;margin:2px 0 12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
.gcard{position:relative;overflow:hidden;text-align:center;padding:20px 12px 16px;border-radius:24px;border:1px solid var(--line);background:linear-gradient(165deg,rgba(255,255,255,.075),rgba(255,255,255,.02));box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 18px 36px -20px rgba(0,0,0,.8);color:#fff;font-family:inherit;cursor:pointer;animation:pop .45s ease-out;transition:transform .2s,border-color .2s}
.gcard::before{content:'';position:absolute;inset:0;background:radial-gradient(90% 70% at 50% -10%,color-mix(in srgb,var(--c) 28%,transparent),transparent 70%);pointer-events:none}
.gcard:active{transform:scale(.97)}
.gcard:hover{border-color:color-mix(in srgb,var(--c) 55%,transparent)}
.gcard .e{position:relative;width:58px;height:58px;margin:0 auto 10px;border-radius:19px;display:grid;place-items:center;font-size:29px;background:linear-gradient(145deg,color-mix(in srgb,var(--c) 40%,#1b1022),color-mix(in srgb,var(--c) 10%,#0d0813));border:1px solid color-mix(in srgb,var(--c) 50%,transparent);box-shadow:0 12px 22px -10px var(--c)}
.gcard .t{position:relative;font-size:16.5px;font-weight:700}
.gcard .d{position:relative;font-size:11.5px;color:var(--mut);margin-top:3px;line-height:1.45}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:2px 0 12px}
.mini{padding:14px 10px;border-radius:18px;border:1px solid var(--line);background:linear-gradient(165deg,rgba(255,255,255,.07),rgba(255,255,255,.025));color:#fff;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.06);transition:transform .15s}
.mini:active{transform:scale(.97)}
.mini:disabled{opacity:.45}
.badge{display:inline-block;padding:5px 13px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid var(--line);font-size:12px;margin:3px;color:#eadce4}
.status{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:8px 0}
.status .badge.turn{border-color:rgba(227,189,118,.5);color:var(--gold2);background:rgba(227,189,118,.08)}
.status .badge.wait{opacity:.8}
.dotp{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:7px;background:#6b5f69;vertical-align:middle}
.dotp.on{background:#3ddc84;box-shadow:0 0 10px #3ddc84}
.notice{padding:11px 15px;border-radius:16px;margin:10px 0;font-size:14.5px;cursor:pointer;background:linear-gradient(135deg,rgba(227,189,118,.14),rgba(227,189,118,.05));border:1px solid rgba(227,189,118,.4);color:var(--gold2);text-align:left}
.dock{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));max-width:456px;margin:0 auto;z-index:10;display:flex;gap:2px;padding:7px;border-radius:28px;background:rgba(20,13,28,.74);-webkit-backdrop-filter:blur(26px) saturate(1.4);backdrop-filter:blur(26px) saturate(1.4);border:1px solid rgba(255,255,255,.11);box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 24px 50px -12px rgba(0,0,0,.85)}
.dock button{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 2px 8px;border:0;border-radius:21px;background:transparent;color:#8f8190;font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;transition:all .22s}
.dock button svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.dock button.on{color:var(--gold2);background:linear-gradient(180deg,rgba(227,189,118,.18),rgba(227,189,118,.04))}
.dock button.on::after{content:'';position:absolute;bottom:3px;width:14px;height:2px;border-radius:2px;background:var(--gold)}
.dock .dot{position:absolute;top:3px;left:calc(50% + 4px);min-width:17px;height:17px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#ff2d55;color:#fff;font-size:10.5px;line-height:17px;font-weight:700;box-shadow:0 0 10px rgba(255,45,85,.7)}
.chatbox{height:48vh;overflow-y:auto;text-align:left;padding:14px;display:flex;flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch}
.bub{max-width:82%;padding:10px 14px;border-radius:20px;font-size:15px;line-height:1.5;word-wrap:break-word;overflow-wrap:anywhere;white-space:pre-wrap}
.bub.me{align-self:flex-end;background:linear-gradient(135deg,#f3d595,#c9994c);color:#1a1008;border-bottom-right-radius:6px;box-shadow:0 10px 22px -12px rgba(227,189,118,.7)}
.bub.th{align-self:flex-start;background:rgba(255,255,255,.08);border:1px solid var(--line);border-bottom-left-radius:6px}
.bub small{display:block;font-size:10px;opacity:.6;margin-top:3px;text-align:right}
.sendrow{display:flex;gap:6px;align-items:center}
.sendrow .inp{margin:0;flex:1}
.sendrow .btn{margin:0;flex:0 0 auto}
.quick{margin:8px 0}
.setbox{margin-top:20px}
.coinbar{display:inline-block;padding:8px 20px;margin:8px 0;border-radius:999px;font-size:18px;font-weight:700;color:var(--gold2);background:linear-gradient(135deg,rgba(227,189,118,.16),rgba(227,189,118,.05));border:1px solid rgba(227,189,118,.5);box-shadow:0 10px 24px -12px rgba(227,189,118,.7)}
.ggrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
.gwrap{display:flex;flex-direction:column;gap:8px;align-items:stretch}
.gcx{position:relative;border-radius:20px;padding:11px 9px 13px;border:1px solid color-mix(in srgb,var(--rc) 55%,transparent);background:linear-gradient(165deg,color-mix(in srgb,var(--rc) 14%,#150d1d),rgba(0,0,0,.35));box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 16px 30px -16px rgba(0,0,0,.85);animation:pop .4s ease-out}
.gcx.r1{--rc:#9fb3c8}
.gcx.r2{--rc:#5ec8ff}
.gcx.r3{--rc:#e3bd76;animation:pop .4s ease-out,glow 2.8s ease-in-out infinite}
.gcx.myst{--rc:#b266ff;border-style:dashed}
.gcx .rt{font-size:10.5px;font-weight:700;letter-spacing:.12em;color:var(--rc)}
.gcx .gi{height:96px;display:flex;align-items:center;justify-content:center;font-size:56px;margin:6px 0}
.gcx .gi img{width:100%;height:96px;object-fit:cover;border-radius:12px}
.gcx .gn{font-size:15px;font-weight:700;line-height:1.3}
.gcx .gp{font-size:12px;color:var(--mut);margin-top:2px}
.gcx .gs{font-size:11px;color:var(--mut);margin-top:3px}
.modal{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(5,3,9,.78);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.mbox{width:100%;max-width:310px;padding:20px;border-radius:28px;background:linear-gradient(180deg,#1b1126,#110a19);border:1px solid rgba(227,189,118,.45);box-shadow:0 30px 70px -10px rgba(0,0,0,.9),0 0 50px -16px var(--gold)}
.avrow{display:flex;gap:4px;flex-wrap:wrap;justify-content:center}
.avstage{margin:10px 0;padding:12px 0;border-radius:26px;background:radial-gradient(80% 60% at 50% 0,rgba(227,189,118,.12),transparent 70%),linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.25));border:1px solid var(--line)}
.sw{display:inline-block;width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,.25);margin:3px;cursor:pointer;padding:0;vertical-align:middle;transition:transform .15s}
.sw.on{border-color:#fff;transform:scale(1.15);box-shadow:0 0 0 3px rgba(227,189,118,.5)}
.itile{display:flex;flex-direction:column;align-items:center;gap:5px;width:100%;padding:13px 6px;border-radius:18px;border:1px solid color-mix(in srgb,var(--rc) 60%,transparent);background:linear-gradient(165deg,rgba(255,255,255,.07),rgba(255,255,255,.02));color:#fff;font-family:inherit;font-size:14px;cursor:pointer}
.itile.r1{--rc:#9fb3c8}.itile.r2{--rc:#5ec8ff}.itile.r3{--rc:#e3bd76}
.itile.eq{background:linear-gradient(135deg,var(--rc),color-mix(in srgb,var(--rc) 60%,#000));color:#111}
.itile small{font-size:11px;opacity:.85}
@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(720deg)}}
@keyframes shuf{0%{transform:translateX(0) rotate(0)}25%{transform:translateX(-40px) rotate(-12deg)}50%{transform:translateX(40px) rotate(12deg)}75%{transform:translateX(-25px) rotate(-6deg)}100%{transform:translateX(0) rotate(0)}}
@keyframes flip{from{transform:rotateY(90deg)}to{transform:rotateY(0)}}
@keyframes pop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
.wheelbox{position:relative;width:min(100%,340px);aspect-ratio:1/1;margin:14px auto;transition:transform .5s}
.wheelbox.d3{transform:perspective(900px) rotateX(34deg) scale(.96);filter:drop-shadow(0 28px 22px rgba(0,0,0,.55))}
.wheelbox .wslices,.wheelbox .wrim{position:absolute;inset:0}
.wheelbox svg{width:100%;height:100%;display:block}
@keyframes glow{0%,100%{box-shadow:0 16px 30px -16px rgba(0,0,0,.85),0 0 14px -6px #e3bd76}50%{box-shadow:0 16px 30px -16px rgba(0,0,0,.85),0 0 30px 0 #e3bd76}}
`;

export default function Home() {
  const [user, setUser] = useState(null);
  const [adult, setAdult] = useState(null);
  const [tick, setTick] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [room, setRoom] = useState(null);
  const [code, setCode] = useState('');
  const [pendingJoin, setPendingJoin] = useState('');
  const [roomLoaded, setRoomLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
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
  // ইচ্ছার চাকা
  const [wheelHeat, setWheelHeat] = useState(1);
  const [wheelRot, setWheelRot] = useState(0);
  const [wheelView, setWheelView] = useState('3d');
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
  // অ্যাভাটার
  const [avItems, setAvItems] = useState([]);
  const [avPresets, setAvPresets] = useState([]);
  const [avSets, setAvSets] = useState([]);
  const [avMap, setAvMap] = useState({});
  const [owned, setOwned] = useState(new Set());
  const [avWho, setAvWho] = useState('me');
  const [avSlot, setAvSlot] = useState('top');
  const [draft, setDraft] = useState(null);
  const [avEdit, setAvEdit] = useState(false);
  const [avForm, setAvForm] = useState({ gender: 'female', preset: null, skin: SKINS[1], hairStyle: 'long', hairColor: HAIR_COLORS[1] });
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

  // ইনভাইট লিংক: /?join=CODE
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('join');
      const c = (q || localStorage.getItem('pending_join') || '').trim().toUpperCase();
      if (q) localStorage.setItem('pending_join', c);
      if (c) { setPendingJoin(c); setCode(c); }
    } catch (e) { /* চুপচাপ */ }
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
      .then(({ data }) => { setRoom(data?.[0] ?? null); setRoomLoaded(true); });
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
    if (e.kind === 'dressed') return '👗 পার্টনার আপনাকে নতুন সাজে সাজিয়েছে! এসে দেখুন';
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

  // ---------- অ্যাভাটার ----------
  const loadAvatar = async (full = true) => {
    if (!user) return;
    const ids = [user.id, partnerId].filter(Boolean);
    const { data: av } = await supabase.from('avatars').select('*').in('user_id', ids);
    const m = {};
    (av || []).forEach((a) => { m[a.user_id] = a; });
    setAvMap(m);
    if (!full) return;
    const [{ data: it }, { data: pr }, { data: st }, { data: ui }] = await Promise.all([
      supabase.from('avatar_items').select('*').order('slot').order('price'),
      supabase.from('body_presets').select('*').order('id'),
      supabase.from('avatar_sets').select('*').order('id'),
      supabase.from('user_items').select('item_id').eq('user_id', user.id),
    ]);
    setAvItems(it || []); setAvPresets(pr || []); setAvSets(st || []);
    setOwned(new Set((ui || []).map((x) => x.item_id)));
    if (!m[user.id]) setAvForm((f) => ({ ...f, gender: myGender === 'male' ? 'male' : 'female', preset: null }));
  };
  const avBody = (a) => avPresets.find((p) => p.id === a?.preset_id) || {};
  const avOutfit = (lk) => {
    const o = {};
    Object.entries(lk || {}).forEach(([k, v]) => {
      const it = avItems.find((x) => x.id === Number(v));
      if (it) o[k] = it;
    });
    return o;
  };
  const toggleLook = (lk, it) => {
    const n = { ...lk };
    if (n[it.slot] === it.id) { delete n[it.slot]; return n; }
    n[it.slot] = it.id;
    if (it.slot === 'dress') { delete n.top; delete n.bottom; }
    if ((it.slot === 'top' || it.slot === 'bottom') && n.dress) delete n.dress;
    return n;
  };
  const applySet = (st) => {
    const n = {};
    let miss = 0;
    Object.entries(st.look || {}).forEach(([k, v]) => {
      const it = avItems.find((x) => x.id === Number(v));
      if (!it) return;
      if (it.price <= 0 || owned.has(it.id)) n[k] = it.id; else miss += 1;
    });
    setDraft(n);
    setMsg(miss ? `🔒 ${miss}টি আইটেম আপনার নেই, সেগুলো বাদ দিয়ে পরানো হয়েছে` : '');
  };
  const startEditAvatar = () => {
    const a = avMap[user.id];
    if (a) setAvForm({ gender: a.gender, preset: a.preset_id, skin: a.skin, hairStyle: a.hair_style, hairColor: a.hair_color });
    setAvEdit(true);
  };
  const saveProfile = async () => {
    const pid = avForm.preset ?? avPresets.find((p) => p.gender === avForm.gender && p.is_active)?.id ?? null;
    setGbusy(true);
    const { error } = await supabase.rpc('save_avatar', {
      p_gender: avForm.gender, p_preset: pid, p_skin: avForm.skin,
      p_hair_style: avForm.hairStyle, p_hair_color: avForm.hairColor,
    });
    setGbusy(false);
    if (error) return setMsg(error.message);
    setAvEdit(false); setDraft(null);
    setMsg('✅ অ্যাভাটার সেভ হয়েছে');
    loadAvatar();
  };
  const saveLook = async (tId, lk) => {
    setGbusy(true);
    const { error } = await supabase.rpc('set_look', { p_target: tId, p_look: lk });
    setGbusy(false);
    if (error) return setMsg(error.message);
    setDraft(null);
    setMsg(tId === user.id ? '✅ সাজ সেভ হয়েছে' : '💝 পার্টনারকে সাজানো হয়েছে');
    loadAvatar(false);
  };
  const buyItem = async (it) => {
    if (!window.confirm(`"${it.name}" কিনতে ${it.price} কয়েন লাগবে। কিনবেন?`)) return;
    setGbusy(true);
    const { data, error } = await supabase.rpc('buy_item', { p_item: it.id });
    setGbusy(false);
    if (error) return setMsg(error.message);
    setCoins(data);
    setMsg('🛍️ কেনা হয়েছে');
    loadAvatar();
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
    const isWheel = a?.kind === 'wheel';
    if (isWheel) { setCur(null); spinWheelTo(a); }
    setTimeout(() => {
      setCur({ id: r.id, a, b, by: r.rolled_by });
      setSecs(a?.seconds || 0);
      setRolling(false);
    }, isWheel ? 4400 : 1200);
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
      if (tab === 'avatar') loadAvatar(false);
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
    if (tab === 'avatar') { setDraft(null); setAvWho('me'); loadAvatar(); }
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
  const clearPending = () => {
    setPendingJoin('');
    try {
      localStorage.removeItem('pending_join');
      if (window.location.search) window.history.replaceState({}, '', window.location.pathname);
    } catch (e) { /* চুপচাপ */ }
  };
  const joinRoom = async (c0) => {
    if (!gender) return setMsg('আগে আপনার লিঙ্গ বাছুন');
    const c = (typeof c0 === 'string' ? c0 : code).trim().toUpperCase();
    if (!c) return setMsg('রুম কোড দিন');
    const { data, error } = await supabase.from('rooms')
      .update({ partner2_id: user.id, p2_gender: gender })
      .eq('code', c).is('partner2_id', null).neq('partner1_id', user.id)
      .select().single();
    clearPending();
    if (error || !data) return setMsg('রুম পাওয়া যায়নি, ভরে গেছে, বা এটা আপনারই রুম');
    setMsg('');
    setRoom(data);
  };
  const inviteLink = () => `${window.location.origin}/?join=${room?.code}`;
  const shareInvite = async () => {
    const url = inviteLink();
    const text = '💞 Dice App-এ আমার রুমে জয়েন করুন';
    try {
      if (navigator.share) { await navigator.share({ title: 'Dice App', text, url }); return; }
    } catch (e) { if (e?.name === 'AbortError') return; }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch (e) { window.prompt('এই লিংকটা পার্টনারকে পাঠান:', url); }
  };
  const copyInvite = async () => {
    const url = inviteLink();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch (e) { window.prompt('এই লিংকটা কপি করে পার্টনারকে পাঠান:', url); }
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
    if (tab === 'wheel') {
      if (wheelHeat > eff) return { err: 'এই হিট লেভেল দুজনের সম্মতির বাইরে। আগে "আমি রাজি আছি" মিলিয়ে নিন' };
      const segs = acts.filter((x) => x.kind === 'wheel' && x.level === wheelHeat);
      if (!segs.length) return { err: 'এই লেভেলে চাকার কোনো সেগমেন্ট নেই (অ্যাডমিন থেকে যোগ করুন)' };
      return { a: segs[Math.floor(Math.random() * segs.length)], b: null };
    }
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

  // ইনভাইট লিংক থেকে এলে লিঙ্গ বাছা হলেই নিজে থেকে জয়েন
  useEffect(() => {
    if (pendingJoin && user && adult && roomLoaded && !room && gender) joinRoom(pendingJoin);
  }, [pendingJoin, user?.id, adult, roomLoaded, room?.id, gender]);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const bothVoted = result && result.total >= 2;
  const verdict = !bothVoted ? null
    : result.no > 0 ? '😌 আজ না, অন্য কিছু বেছে নিন'
    : result.yes === 2 ? '💖 দুজনেই হ্যাঁ!' : '🤔 দুজনেই রাজি, তবে ধীরে';

  const showCur = cur && (cur.stopped || tabOfAct(cur.a) === tab);
  // ---------- ইচ্ছার চাকা ----------
  const spinWheelTo = (a) => {
    const segs = actsRef.current.filter((x) => x.kind === 'wheel' && x.level === a.level).sort((x, y) => x.id - y.id);
    const i = Math.max(0, segs.findIndex((x) => x.id === a.id));
    const step = 360 / Math.max(1, segs.length);
    const target = (i + 0.5) * step + (Math.random() - 0.5) * step * 0.6;
    setWheelHeat(a.level);
    setWheelRot((cur0) => {
      const c = ((cur0 % 360) + 360) % 360;
      const add = ((((-target - c) % 360) + 360) % 360);
      return cur0 + 360 * 5 + add;
    });
  };
  const wheelParts = (t) => {
    const [l, ...r] = String(t || '').split('|');
    const label = l.trim();
    return { label, detail: r.join('|').trim() || label };
  };
  const WHEEL_COLORS = {
    1: ['#f3d9b1', '#e8b9a0', '#d9c28a', '#e5a9a9'],
    2: ['#d9a35f', '#c9788a', '#b98a4a', '#a65f78'],
    3: ['#8e2a3c', '#5b1d4a', '#b0533a', '#3d1a40'],
  };
  const wheelNode = () => {
    const segs = acts.filter((x) => x.kind === 'wheel' && x.level === wheelHeat).sort((x, y) => x.id - y.id);
    const n = segs.length;
    const pal = WHEEL_COLORS[wheelHeat] || WHEEL_COLORS[1];
    const dark = wheelHeat === 3;
    const R = 132;
    const step = 360 / Math.max(n, 1);
    const P = (deg, r) => { const t = ((deg - 90) * Math.PI) / 180; return [150 + r * Math.cos(t), 150 + r * Math.sin(t)]; };
    const fs = n <= 6 ? 15 : n <= 8 ? 13 : n <= 10 ? 11.5 : 10;
    const slices = n === 0 ? null : segs.map((s, i) => {
      const [x1, y1] = P(i * step, R);
      const [x2, y2] = P((i + 1) * step, R);
      const [tx, ty] = P((i + 0.5) * step, 92);
      const th = (i + 0.5) * step;
      const rot = th - 90 + (th > 180 ? 180 : 0);
      const lab = wheelParts(s.title).label;
      const txt = lab.length > 12 ? lab.slice(0, 11) + '…' : lab;
      return (
        <g key={s.id}>
          {n === 1
            ? <circle cx="150" cy="150" r={R} fill={pal[0]} />
            : <path d={`M150,150 L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${step > 180 ? 1 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`} fill={pal[i % pal.length]} />}
          <text x={tx.toFixed(1)} y={ty.toFixed(1)} fontSize={fs} fontWeight="700" textAnchor="middle" dominantBaseline="middle"
            fill={dark ? '#fff3d6' : '#3a2318'} transform={`rotate(${rot.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})`}>{txt}</text>
        </g>
      );
    });
    const lines = n > 1 ? segs.map((s, i) => { const [x, y] = P(i * step, R); return <line key={s.id} x1="150" y1="150" x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="#d4af37" strokeWidth="1.6" />; }) : null;
    const dots = Array.from({ length: 24 }, (_, i) => { const [x, y] = P(i * 15, 141); return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.3" fill={i % 2 ? '#c4a1ff' : '#e9d8ff'} opacity=".85" />; });
    return (
      <div className={'wheelbox' + (wheelView === '3d' ? ' d3' : '')}>
        <div className="wslices" style={{ transform: `rotate(${wheelRot}deg)`, transition: 'transform 4.2s cubic-bezier(.12,.75,.12,1)' }}>
          <svg viewBox="0 0 300 300">
            <circle cx="150" cy="150" r={R} fill="#2a2420" />
            {slices}{lines}
          </svg>
        </div>
        <svg className="wrim" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r="141" fill="none" stroke="#1c1410" strokeWidth="12" />
          <circle cx="150" cy="150" r="134" fill="none" stroke="#d4af37" strokeWidth="3" />
          {dots}
          <circle cx="150" cy="150" r="26" fill="#2a2420" stroke="#d4af37" strokeWidth="4" />
          <text x="150" y="151" fontSize="22" textAnchor="middle" dominantBaseline="middle">🔥</text>
          <path d="M139,0 L161,0 L150,26 Z" fill="#d4af37" stroke="#8a6d1a" strokeWidth="1" />
          <circle cx="150" cy="7" r="3.6" fill="#e11d48" />
        </svg>
        {n === 0 && <p className="muted" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>এই লেভেলে সেগমেন্ট নেই</p>}
      </div>
    );
  };
  const wheelControls = (
    <div className="glass" style={{ padding: 12 }}>
      <div className="muted">হিট (দুজনের সম্মতির মধ্যে)</div>
      {[1, 2, 3].map((n) => (
        <button key={n} className={'pill' + (wheelHeat === n ? ' on' : '')} disabled={n > eff} style={n > eff ? { opacity: 0.4 } : undefined} onClick={() => setWheelHeat(n)}>
          {lv(n).icon} {lv(n).name}
        </button>
      ))}
      <div className="muted" style={{ marginTop: 8 }}>চাকার ধরন</div>
      {[['3d', '3D'], ['flat', 'ফ্ল্যাট']].map(([k, l]) => (
        <button key={k} className={'pill' + (wheelView === k ? ' on' : '')} onClick={() => setWheelView(k)}>{l}</button>
      ))}
    </div>
  );

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
      <div className="z">
        <h1 className="logo">💋 Dice App</h1>
        <p className="sub">শুধু দুজনের জন্য · ১৮+ · সম্মতিই আসল</p>

        {!user && (
          <div className="glass" style={{ animation: 'pop .4s ease-out' }}>
            <div className="emblem">💋</div>
            {pendingJoin && <div className="notice" style={{ cursor: 'default' }}>💌 আপনাকে একটি রুমে ইনভাইট করা হয়েছে। লগইন বা সাইন আপ করলেই জয়েন হবে।</div>}
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
            {pendingJoin && <div className="notice" style={{ cursor: 'default' }}>💌 ইনভাইট লিংক থেকে এসেছেন। আপনার লিঙ্গ বাছুন, নিজে থেকেই রুমে জয়েন হবে।</div>}
            <div className="muted">আপনার লিঙ্গ বাছুন (ডাইসের অপশন মেলাতে লাগে)</div>
            <GenderPills value={gender} onPick={rememberGender} />
            <button className="btn big" onClick={createRoom}>🌹 নতুন রুম বানান</button>
            <p className="muted">অথবা পার্টনারের রুম কোড দিয়ে জয়েন করুন</p>
            <input className="inp" placeholder="রুম কোড" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn ghost" onClick={() => joinRoom()}>জয়েন করুন</button>
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
                {!room.partner2_id && (
                  <div style={{ margin: '6px 0' }}>
                    <button className="btn tiny" onClick={shareInvite}>📤 ইনভাইট লিংক পাঠান</button>
                    <button className="btn ghost tiny" onClick={copyInvite}>{copied ? '✅ কপি হয়েছে' : '🔗 লিংক কপি'}</button>
                  </div>
                )}
                {tab !== 'home' && <button className="btn ghost tiny" onClick={() => setTab('home')}>🏠 হোম</button>}
                <button className="btn ghost tiny" onClick={leaveRoom}>← রুম বদলান</button>
              </div>
            </div>

            {gnotice && (
              <div className="notice" onClick={() => { const dr = gnotice.kind === 'dressed'; setGnotice(null); setGv('mine'); setTab(dr ? 'avatar' : 'gifts'); }}>
                {noticeText(gnotice)}
              </div>
            )}

            {tab === 'home' && (
              <>
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
                    <button key={k} className="gcard" style={{ '--c': T[k].color, animationDelay: i * 0.08 + 's', gridColumn: k === 'wheel' ? '1 / -1' : undefined }} onClick={() => setTab(k)}>
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
                <div className="row2" style={{ gridTemplateColumns: '1fr' }}>
                  <button className="mini" style={{ '--c': T.avatar.color }} onClick={() => setTab('avatar')}>👗 সাজ-সজ্জা (অ্যাভাটার)</button>
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
                <div className="seg">
                  {GAME_TABS.map((k) => (
                    <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{T[k].icon} {T[k].label}</button>
                  ))}
                </div>
                <h2 className="ptitle">{T[tab].icon} {T[tab].title}</h2>
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
                ) : tab === 'wheel' ? (
                  <>{wheelControls}{wheelNode()}</>
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
                          {tab === 'wheel'
                            ? <><div className="muted">🎡 {wheelParts(cur.a?.title).label}</div>{wheelParts(cur.a?.title).detail}</>
                            : cur.a?.title}
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
                <h2 className="ptitle">🗨️ রুম চ্যাট</h2>
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
                <h2 className="ptitle">💭 গোপন ইচ্ছা</h2>
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
                <h2 className="ptitle">🎁 গিফট ও কয়েন</h2>
                <div className="coinbar">🪙 {coins}</div>
                <p className="muted">দুজনেই "হ্যাঁ" দিলে একটি করে গিফট কার্ড ও কয়েন পাবেন। কয়েন দিয়ে পার্টনারকে গিফট দিতে পারবেন।</p>
                <div className="seg">
                  {[['mine', '🎴 আমার কালেকশন'], ['shop', '🛍️ গিফট শপ']].map(([k, l]) => (
                    <button key={k} className={gv === k ? 'on' : ''} onClick={() => setGv(k)}>{l}</button>
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

            {tab === 'avatar' && (() => {
              const mine = avMap[user.id];
              const theirs = partnerId ? avMap[partnerId] : null;
              const target = avWho === 'me' ? mine : theirs;
              const tId = avWho === 'me' ? user.id : partnerId;
              const look = draft ?? target?.look ?? {};
              const own = (it) => it.price <= 0 || owned.has(it.id);
              const formPreset = avPresets.find((p) => p.id === avForm.preset)
                || avPresets.find((p) => p.gender === avForm.gender && p.is_active) || {};
              return (
                <>
                  <h2 className="ptitle">👗 সাজ-সজ্জা</h2>
                  <div className="coinbar">🪙 {coins}</div>
                  {(!mine || avEdit) ? (
                    <div className="glass">
                      <div className="muted">আপনার অ্যাভাটার বানান</div>
                      <div>
                        {[['female', '♀️ নারী'], ['male', '♂️ পুরুষ']].map(([k, l]) => (
                          <button key={k} className={'pill' + (avForm.gender === k ? ' on' : '')} onClick={() => setAvForm({ ...avForm, gender: k, preset: null })}>{l}</button>
                        ))}
                      </div>
                      <Avatar gender={avForm.gender} body={formPreset} skin={avForm.skin} hairStyle={avForm.hairStyle} hairColor={avForm.hairColor} width={170} />
                      <div className="muted">দেহের গড়ন</div>
                      <div>
                        {avPresets.filter((p) => p.gender === avForm.gender && p.is_active).map((p) => (
                          <button key={p.id} className={'pill' + (formPreset.id === p.id ? ' on' : '')} onClick={() => setAvForm({ ...avForm, preset: p.id })}>{p.name}</button>
                        ))}
                      </div>
                      <div className="muted">ত্বকের রং</div>
                      <div>{SKINS.map((c) => <button key={c} className={'sw' + (avForm.skin === c ? ' on' : '')} style={{ background: c }} onClick={() => setAvForm({ ...avForm, skin: c })} />)}</div>
                      <div className="muted">চুল</div>
                      <div>
                        {HAIR_STYLES.map(([k, l]) => (
                          <button key={k} className={'pill' + (avForm.hairStyle === k ? ' on' : '')} onClick={() => setAvForm({ ...avForm, hairStyle: k })}>{l}</button>
                        ))}
                      </div>
                      <div>{HAIR_COLORS.map((c) => <button key={c} className={'sw' + (avForm.hairColor === c ? ' on' : '')} style={{ background: c }} onClick={() => setAvForm({ ...avForm, hairColor: c })} />)}</div>
                      <button className="btn big" onClick={saveProfile} disabled={gbusy}>✅ সেভ করুন</button>
                      {mine && <button className="btn ghost" onClick={() => setAvEdit(false)}>বাতিল</button>}
                    </div>
                  ) : (
                    <>
                      <div className="seg">
                        <button className={avWho === 'me' ? 'on' : ''} onClick={() => { setAvWho('me'); setDraft(null); }}>আমি</button>
                        <button className={avWho === 'partner' ? 'on' : ''} disabled={!theirs} onClick={() => { setAvWho('partner'); setDraft(null); }}>
                          পার্টনার{!theirs ? ' (অ্যাভাটার নেই)' : ''}
                        </button>
                      </div>
                      {target ? (
                        <div className="avstage">
                          <Avatar gender={target.gender} body={avBody(target)} skin={target.skin} hairStyle={target.hair_style} hairColor={target.hair_color} outfit={avOutfit(look)} width={230} />
                        </div>
                      ) : <p className="muted">পার্টনার অ্যাভাটার বানালে এখানে দেখা যাবে</p>}
                      {target && (
                        <>
                          <div>
                            {draft && (
                              <button className="btn go" disabled={gbusy} onClick={() => saveLook(tId, draft)}>
                                {avWho === 'me' ? '✅ সাজ সেভ করুন' : '💝 পার্টনারকে সাজিয়ে দিন'}
                              </button>
                            )}
                            {draft && <button className="btn ghost tiny" onClick={() => setDraft(null)}>↺ বাতিল</button>}
                            <button className="btn ghost tiny" onClick={() => setDraft({})}>👙 ডিফল্ট সাজ</button>
                            {avWho === 'me' && <button className="btn ghost tiny" onClick={startEditAvatar}>✏️ অ্যাভাটার বদলান</button>}
                          </div>
                          <div className="h3">🎭 থিম সেট</div>
                          <div className="avrow">
                            {avSets.filter((st) => st.is_active && (st.gender === 'any' || st.gender === target.gender)).map((st) => (
                              <button key={st.id} className="pill" onClick={() => applySet(st)}>{st.emoji} {st.name}</button>
                            ))}
                          </div>
                          <div className="h3">🧥 আইটেম</div>
                          <div>
                            {Object.entries(SLOTS).map(([k, l]) => (
                              <button key={k} className={'pill' + (avSlot === k ? ' on' : '')} onClick={() => setAvSlot(k)}>{l}</button>
                            ))}
                          </div>
                          <div className="ggrid">
                            {avItems.filter((it) => it.is_active && it.slot === avSlot && (it.gender === 'any' || it.gender === target.gender)).map((it) => {
                              const on = look[it.slot] === it.id;
                              const ok = own(it);
                              return (
                                <div key={it.id} className="gwrap">
                                  <button className={'itile r' + it.level + (on ? ' eq' : '')} onClick={() => (ok ? setDraft(toggleLook(look, it)) : buyItem(it))}>
                                    <span className="sw" style={{ background: it.color, cursor: 'inherit' }} />
                                    <b>{it.name}</b>
                                    <small>{on ? '✓ পরা আছে' : ok ? 'পরুন' : `🔒 কিনুন · 🪙 ${it.price}`}</small>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              );
            })()}

            {tab === 'history' && (
              <>
                <h2 className="ptitle">⭐ পছন্দ ও ইতিহাস</h2>
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
        <nav className="dock">
          {DOCK.map(([k, l]) => {
            const on = k === 'games' ? isGameTab : tab === k;
            return (
              <button key={k} className={on ? 'on' : ''} onClick={() => setTab(k === 'games' ? (isGameTab ? tab : 'dice') : k)}>
                <DockIcon k={k} />{l}{k === 'chat' && unread > 0 ? <b className="dot">{unread}</b> : null}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

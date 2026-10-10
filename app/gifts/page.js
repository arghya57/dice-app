'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

const BUCKET = 'card-images';
const RAR = {
  1: { label: 'সাধারণ', color: '#5ec8ff', glow: 'rgba(94,200,255,.45)' },
  3: { label: '🔥 লেজেন্ডারি', color: '#ffd369', glow: 'rgba(255,211,105,.7)' },
};
const rar = (l) => RAR[l >= 3 ? 3 : 1];

const shrink = (file) => new Promise((res, rej) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const s = Math.min(1, 700 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((b) => (b ? res(b) : rej(new Error('ছবি প্রসেস হয়নি'))), 'image/jpeg', 0.82);
  };
  img.onerror = () => rej(new Error('ছবি পড়া যায়নি'));
  img.src = url;
});

const CSS = `
.gp{min-height:100vh;padding:18px 14px 60px;max-width:480px;margin:0 auto;text-align:center;color:#fff;font-family:'Hind Siliguri',sans-serif;background:radial-gradient(circle at 18% 8%,#4d0b30 0,transparent 46%),radial-gradient(circle at 88% 30%,#3a0a48 0,transparent 42%),#0b0210}
.gp a{color:#ffd369}
.gp h1{font-size:28px;margin:6px 0;background:linear-gradient(90deg,#ffa6c9,#ff3d7f,#ffb347);-webkit-background-clip:text;background-clip:text;color:transparent}
.coin{display:inline-block;padding:8px 20px;border-radius:999px;background:rgba(255,211,105,.14);border:1.5px solid #ffd369;font-size:20px;font-weight:700;margin:8px 0;box-shadow:0 0 20px -4px #ffd369}
.tb{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:10px 0}
.pill{padding:8px 14px;border-radius:999px;font-size:14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#fff;font-family:inherit;cursor:pointer}
.pill.on{background:#ff3d7f;border-color:transparent;box-shadow:0 0 16px #ff3d7f}
.btn{padding:10px 18px;margin:4px;border:none;border-radius:999px;color:#fff;font-size:14px;font-weight:600;background:linear-gradient(135deg,#ff3d7f,#7a1fa2);cursor:pointer;font-family:inherit}
.btn:disabled{opacity:.45}
.btn.ghost{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18)}
.btn.sm{padding:6px 12px;font-size:12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 0}
.gc{position:relative;padding:12px 8px 12px;border-radius:20px;border:2px solid var(--rc);background:linear-gradient(160deg,rgba(255,255,255,.13),rgba(255,255,255,.02));box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 22px -6px var(--gl);overflow:hidden}
.gc.leg{background:linear-gradient(160deg,rgba(255,211,105,.25),rgba(122,31,162,.18));animation:shine 3s ease-in-out infinite}
.gc .im{height:96px;display:flex;align-items:center;justify-content:center;font-size:58px;filter:drop-shadow(0 0 12px var(--rc))}
.gc .im img{width:100%;height:96px;object-fit:cover;border-radius:12px}
.gc .nm{font-size:15px;font-weight:700;margin:6px 0 2px;min-height:40px;display:flex;align-items:center;justify-content:center;line-height:1.3}
.gc .rb{font-size:11px;color:var(--rc);margin-bottom:4px}
.gc .pr{font-size:14px;color:#ffd369;margin:2px 0 4px}
.msg{padding:10px 14px;border-radius:14px;background:rgba(255,211,105,.14);border:1px solid #ffd369;margin:8px 0;font-size:15px}
.box{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:14px;margin:10px 0}
.inp{width:100%;padding:11px 13px;margin:5px 0;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.4);color:#fff;font-size:15px;box-sizing:border-box;outline:none;font-family:inherit}
.muted{font-size:13px;color:#d9b4c6}
.sec{margin:16px 0 4px;font-size:16px;color:#ffd0e3}
.row{display:flex;gap:8px;align-items:center;text-align:left;margin:8px 0;padding:8px;border-radius:14px;background:rgba(255,255,255,.06)}
.row .th{width:54px;height:54px;border-radius:10px;overflow:hidden;font-size:34px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;background:rgba(0,0,0,.3)}
.row .th img{width:100%;height:100%;object-fit:cover}
.pop{position:fixed;inset:0;z-index:10;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:20px}
@keyframes shine{0%,100%{box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 18px -6px var(--gl)}50%{box-shadow:0 8px 24px rgba(0,0,0,.45),0 0 34px 0 var(--gl)}}
@keyframes bump{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
`;

function Card({ g, children, mystery }) {
  const r = rar(g.level);
  return (
    <div className={'gc' + (g.level >= 3 ? ' leg' : '')} style={{ '--rc': r.color, '--gl': r.glow }}>
      <div className="im">
        {mystery ? '❓' : g.image_url ? <img src={g.image_url} alt={g.name} /> : g.emoji || '🎁'}
      </div>
      <div className="nm">{mystery ? 'মিস্ট্রি বক্স' : g.name}</div>
      <div className="rb">{mystery ? '🔥 লেজেন্ডারি' : r.label}</div>
      {children}
    </div>
  );
}

export default function Gifts() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [adult, setAdult] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [room, setRoom] = useState(null);
  const [coins, setCoins] = useState(0);
  const [gifts, setGifts] = useState([]);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('mine');
  const [shopLv, setShopLv] = useState(1);
  const [msg, setMsg] = useState('');
  const [reveal, setReveal] = useState(null);
  const [adm, setAdm] = useState({ email: '', amt: 50, gid: '' });
  const [busy, setBusy] = useState(false);
  const roomRef = useRef(null);
  roomRef.current = room;

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const loadAll = async (u) => {
    const uid = (u || user)?.id;
    if (!uid) return;
    const { data: w } = await supabase.from('wallets').select('coins').eq('user_id', uid).maybeSingle();
    setCoins(w?.coins || 0);
    const { data: it } = await supabase.from('gift_items')
      .select('*, gift:gifts!gift_id(*), reveal:gifts!reveal_id(*)').order('id', { ascending: false }).limit(200);
    setItems(it || []);
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (!u) return setReady(true);
      setUser(u);
      const { data: p } = await supabase.from('profiles').select('adult_ok, role').eq('id', u.id).single();
      setAdult(!!p?.adult_ok);
      setAdmin(p?.role === 'admin');
      const { data: gs } = await supabase.from('gifts').select('*').eq('is_active', true).order('level').order('id');
      setGifts(gs || []);
      const { data: rs } = await supabase.from('rooms').select('*')
        .or(`partner1_id.eq.${u.id},partner2_id.eq.${u.id}`).order('id', { ascending: false }).limit(1);
      setRoom(rs?.[0] ?? null);
      setReady(true);
      loadAll(u);
    })();
  }, []);

  // দুজনেই হ্যাঁ দিলে পুরস্কার দাবি (প্রতি ৫ সেকেন্ডে চেক)
  useEffect(() => {
    if (!user || !room) return;
    const claim = async () => {
      const { data } = await supabase.rpc('claim_rewards', { rid: room.id });
      if (data > 0) { flash(`🎉 দুজনেই হ্যাঁ বলায় ${data}টি নতুন গিফট কার্ড ও কয়েন পেয়েছেন!`); loadAll(); }
    };
    claim();
    const t = setInterval(() => { claim(); loadAll(); }, 5000);
    return () => clearInterval(t);
  }, [user?.id, room?.id]);

  const buy = async (g) => {
    if (!room) return flash('আগে একটি রুমে ঢুকুন');
    if (!room.partner2_id) return flash('পার্টনার রুমে জয়েন করেনি');
    if (!window.confirm(`${g.is_mystery ? 'মিস্ট্রি বক্স' : g.name} — ${g.price} কয়েনে পার্টনারকে পাঠাবেন?`)) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('buy_gift', { rid: room.id, gid: g.id });
    setBusy(false);
    if (error) return flash(error.message);
    if (data !== 'ok') return flash(data);
    flash('🎁 গিফট পাঠানো হয়েছে! পার্টনারের চ্যাটেও জানানো হয়েছে।');
    loadAll();
  };

  const open = async (it) => {
    const { data, error } = await supabase.rpc('open_gift', { iid: it.id });
    if (error) return flash(error.message);
    const g = gifts.find((x) => x.id === data) || (await supabase.from('gifts').select('*').eq('id', data).single()).data;
    setReveal(g);
    loadAll();
  };

  const uploadImg = async (g, file) => {
    if (!file) return;
    try {
      const blob = await shrink(file);
      const path = `gift-${g.id}-${Date.now()}.jpg`;
      const { error: ue } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
      if (ue) return flash('আপলোড হয়নি: ' + ue.message);
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.from('gifts').update({ image_url: url }).eq('id', g.id);
      if (error) return flash(error.message);
      setGifts((p) => p.map((x) => (x.id === g.id ? { ...x, image_url: url } : x)));
      flash('✅ ছবি সেভ হয়েছে');
    } catch (e) { flash(e.message || 'ভুল হয়েছে'); }
  };
  const setPrice = async (g, v) => {
    const price = Math.max(0, Number(v) || 0);
    const { error } = await supabase.from('gifts').update({ price }).eq('id', g.id);
    if (error) return flash(error.message);
    setGifts((p) => p.map((x) => (x.id === g.id ? { ...x, price } : x)));
  };
  const giveCoins = async () => {
    const { data, error } = await supabase.rpc('admin_give_coins', { em: adm.email, amt: Number(adm.amt) || 0 });
    flash(error ? error.message : data === 'ok' ? '✅ কয়েন দেওয়া হয়েছে' : data);
    loadAll();
  };
  const giveGift = async () => {
    if (!adm.gid) return flash('গিফট বাছুন');
    const { data, error } = await supabase.rpc('admin_give_gift', { em: adm.email, gid: Number(adm.gid) });
    flash(error ? error.message : data === 'ok' ? '✅ গিফট দেওয়া হয়েছে' : data);
    loadAll();
  };

  if (!ready) return <div className="gp"><style>{CSS}</style>লোড হচ্ছে...</div>;
  if (!user) return <div className="gp"><style>{CSS}</style><p>আগে লগইন করুন। <a href="/">হোমে যান</a></p></div>;
  if (!adult) return <div className="gp"><style>{CSS}</style><p>প্রথমে হোমে ১৮+ কনফার্ম করুন। <a href="/">হোমে যান</a></p></div>;

  const received = items.filter((i) => i.to_user === user.id);
  const sent = items.filter((i) => i.from_user === user.id);
  const shop = gifts.filter((g) => (shopLv >= 3 ? g.level >= 3 : g.level < 3));

  const TABS = [['mine', '🎁 আমার গিফট'], ['shop', '🛍️ শপ'], ['sent', '📤 পাঠানো']];
  if (admin) TABS.push(['adm', '⚙️ অ্যাডমিন']);

  return (
    <div className="gp">
      <style>{CSS}</style>
      <a href="/">← হোম</a>
      <h1>🎁 গিফট শপ</h1>
      <div className="coin">🪙 {coins} কয়েন</div>
      <p className="muted">রুমে খেলায় দুজনেই ✅ হ্যাঁ দিলে দুজনেই একটি করে গিফট কার্ড ও কয়েন পাবেন। কয়েন দিয়ে পার্টনারকে গিফট দিন।</p>
      {msg && <div className="msg">{msg}</div>}

      <div className="tb">
        {TABS.map(([k, l]) => <button key={k} className={'pill' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'mine' && (
        <>
          {received.length === 0 && <p className="muted">এখনো কোনো গিফট নেই। খেলুন, দুজনে হ্যাঁ দিন! 💞</p>}
          <div className="grid">
            {received.map((it) => {
              const closed = !it.opened;
              const g = it.reveal || it.gift;
              if (!g) return null;
              return (
                <Card key={it.id} g={it.gift || g} mystery={closed}>
                  {!closed && it.reveal && <div className="muted">ভেতরে ছিল: <b>{it.reveal.name}</b> {it.reveal.emoji}</div>}
                  {closed
                    ? <button className="btn sm" onClick={() => open(it)}>📦 খুলুন</button>
                    : <div className="muted">{it.source === 'reward' ? '🏆 খেলার পুরস্কার' : it.source === 'admin' ? '👑 অ্যাডমিনের উপহার' : '💝 পার্টনারের উপহার'}</div>}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {tab === 'shop' && (
        <>
          <div className="tb">
            <button className={'pill' + (shopLv === 1 ? ' on' : '')} onClick={() => setShopLv(1)}>🌸 লেভেল ১ · হালকা</button>
            <button className={'pill' + (shopLv === 3 ? ' on' : '')} onClick={() => setShopLv(3)}>🔥 লেভেল ৩ · ইন্টিমেট</button>
          </div>
          {!room?.partner2_id && <p className="muted">⏳ পার্টনার রুমে এলে গিফট পাঠাতে পারবেন</p>}
          <div className="grid">
            {shop.map((g) => (
              <Card key={g.id} g={g} mystery={false}>
                {g.is_mystery && <div className="muted">কী আছে জানা যায় না, খুললে পার্টনার জানবে</div>}
                <div className="pr">🪙 {g.price}</div>
                <button className="btn sm" disabled={busy || coins < g.price || !room?.partner2_id} onClick={() => buy(g)}>
                  {coins < g.price ? 'কয়েন কম' : '🎁 পার্টনারকে দিন'}
                </button>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'sent' && (
        <>
          {sent.length === 0 && <p className="muted">এখনো কিছু পাঠাননি</p>}
          {sent.map((it) => (
            <div className="row" key={it.id}>
              <div className="th">{it.gift?.image_url ? <img src={it.gift.image_url} alt="" /> : it.gift?.emoji}</div>
              <div>
                <div>{it.gift?.name}</div>
                <small className="muted">{new Date(it.created_at).toLocaleString('bn-BD')} · {it.opened ? 'খোলা হয়েছে' : 'এখনো খোলেনি'}</small>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'adm' && admin && (
        <>
          <div className="box">
            <div className="sec" style={{ marginTop: 0 }}>🪙 কয়েন / 🎁 গিফট দিন (ইমেইল দিয়ে)</div>
            <input className="inp" placeholder="ইউজারের ইমেইল" value={adm.email} onChange={(e) => setAdm({ ...adm, email: e.target.value })} />
            <input className="inp" type="number" placeholder="কয়েন (বিয়োগ করতে মাইনাস)" value={adm.amt} onChange={(e) => setAdm({ ...adm, amt: e.target.value })} />
            <button className="btn" onClick={giveCoins}>🪙 কয়েন দিন</button>
            <select className="inp" value={adm.gid} onChange={(e) => setAdm({ ...adm, gid: e.target.value })}>
              <option value="">গিফট বাছুন</option>
              {gifts.map((g) => <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>)}
            </select>
            <button className="btn" onClick={giveGift}>🎁 গিফট দিন</button>
          </div>
          <div className="sec">🖼️ গিফটের ছবি ও দাম</div>
          {gifts.map((g) => (
            <div className="row" key={g.id}>
              <div className="th">{g.image_url ? <img src={g.image_url} alt="" /> : g.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14 }}>{g.name}</div>
                <input className="inp" style={{ width: 90, display: 'inline-block', padding: 6 }} type="number" defaultValue={g.price}
                  onBlur={(e) => Number(e.target.value) !== g.price && setPrice(g, e.target.value)} /> 🪙
                <input type="file" accept="image/*" style={{ fontSize: 12, marginTop: 4, maxWidth: '100%' }} onChange={(e) => uploadImg(g, e.target.files?.[0])} />
              </div>
            </div>
          ))}
        </>
      )}

      {reveal && (
        <div className="pop" onClick={() => setReveal(null)}>
          <div style={{ animation: 'bump .5s ease-out', width: 220 }}>
            <Card g={reveal} mystery={false}><div className="muted">🎉 বক্স থেকে বেরোল!</div></Card>
            <p className="muted">যেকোনো জায়গায় চাপুন</p>
          </div>
        </div>
      )}
    </div>
  );
}

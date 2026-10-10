'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const MOODS = { any: '🎲 যেকোনো', romantic: '💕 রোমান্টিক', naughty: '😏 দুষ্টু', tired: '😴 ক্লান্ত' };
const LEVELS = { 1: 'লেভেল ১ · হালকা', 2: 'লেভেল ২ · রোমান্টিক', 3: 'লেভেল ৩ · ইন্টিমেট' };

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
  const [rollCard, setRollCard] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab, setTab] = useState('dice');
  const [mode, setMode] = useState('dice');
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
  const seenRoll = useRef(null);
  const actsRef = useRef([]);
  actsRef.current = acts;

  const isP1 = room && room.partner1_id === user?.id;
  const eff = room ? Math.min(room.p1_level, room.p2_level) : 1;
  const myLevel = room ? (isP1 ? room.p1_level : room.p2_level) : 1;
  const isCardTab = tab === 'card';
  const isGameTab = tab === 'dice' || tab === 'card';

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
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
    loadFavs();
  }, [user]);

  const loadFavs = async () => {
    const { data } = await supabase.from('favorites').select('activity_id, activities(title)');
    setFavs(data || []);
  };

  // নতুন রোল দেখানো: রিয়েলটাইম আর পোলিং দুই জায়গা থেকেই এটা ডাকা হয়, একই রোল দুইবার দেখাবে না
  const showRoll = (r) => {
    if (seenRoll.current !== null && r.id <= seenRoll.current) return;
    seenRoll.current = r.id;
    setMyVote(null); setResult(null); setRunning(false);
    if (r.stopped) { setCur({ id: r.id, stopped: true }); return; }
    const list = actsRef.current;
    const a = list.find((x) => x.id === r.activity_id) || null;
    const b = list.find((x) => x.id === r.activity2_id) || null;
    setRollCard(a?.kind === 'card');
    setRolling(true);
    setTimeout(() => {
      setCur({ id: r.id, a, b });
      setSecs(a?.seconds || 0);
      setRolling(false);
    }, 1200);
  };

  // রুমে ঢোকার সময় আগের রোলগুলো "দেখা হয়ে গেছে" ধরা হয়
  useEffect(() => {
    seenRoll.current = null;
    if (!room) return;
    (async () => {
      const { data } = await supabase.from('rolls').select('id')
        .eq('room_id', room.id).order('id', { ascending: false }).limit(1);
      if (seenRoll.current === null) seenRoll.current = data?.[0]?.id ?? 0;
    })();
  }, [room?.id]);

  useEffect(() => {
    if (!room) return;
    const channel = supabase.channel('room-' + room.id)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rolls', filter: `room_id=eq.${room.id}` },
        (p) => showRoll(p.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  useEffect(() => {
    if (!room) return;
    const t = setInterval(async () => {
      const { data } = await supabase.from('rooms').select('*').eq('id', room.id).single();
      if (data) setRoom(data);
      // রিয়েলটাইম কাজ না করলেও পার্টনারের রোল ধরার জন্য
      const { data: lr } = await supabase.from('rolls').select('*')
        .eq('room_id', room.id).order('id', { ascending: false }).limit(1);
      if (lr?.[0] && seenRoll.current !== null) showRoll(lr[0]);
      if (cur?.id && !cur.stopped) {
        const { data: r } = await supabase.rpc('vote_result', { rid: cur.id });
        if (r) setResult(r);
      }
      if (tab === 'wish') loadWishes();
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
  useEffect(() => {
    if (!room) return;
    if (tab === 'wish') loadWishes();
    if (tab === 'history') { loadHistory(); loadFavs(); }
  }, [tab, room?.id]);

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? error.message : 'সাইন আপ হয়েছে');
  };
  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
  };
  const signOut = () => { supabase.auth.signOut(); setRoom(null); setCur(null); setAdult(null); };
  const leaveRoom = () => { setRoom(null); setCur(null); };
  const confirmAdult = async () => {
    if (!tick) return setMsg('বয়স ১৮+ কনফার্ম করতে টিক দিন');
    await supabase.rpc('confirm_adult');
    setAdult(true); setMsg('');
  };

  const createRoom = async () => {
    const c = Math.random().toString(36).slice(2, 7).toUpperCase();
    const { data, error } = await supabase.from('rooms')
      .insert({ code: c, partner1_id: user.id }).select().single();
    if (error) return setMsg(error.message);
    setRoom(data);
  };
  const joinRoom = async () => {
    const { data, error } = await supabase.from('rooms')
      .update({ partner2_id: user.id })
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

  const pick = (kind) => {
    const pool = acts.filter((a) => a.kind === kind && a.level <= eff &&
      (mood === 'any' || a.mood === 'any' || a.mood === mood));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  };
  const roll = async () => {
    if (!room?.partner2_id) return setMsg('পার্টনার এখনো জয়েন করেনি');
    const m = isCardTab ? 'card' : mode;
    let a, b = null;
    if (m === 'dice') { a = pick('action'); b = pick('modifier'); } else a = pick(m);
    if (!a) return setMsg('এই লেভেল/মুডে কোনো অ্যাক্টিভিটি নেই');
    setMsg('');
    const { error } = await supabase.from('rolls')
      .insert({ room_id: room.id, activity_id: a.id, activity2_id: b?.id ?? null, rolled_by: user.id });
    if (error) setMsg(error.message);
  };
  const stop = async () => {
    await supabase.from('rolls').insert({ room_id: room.id, rolled_by: user.id, stopped: true });
  };
  const castVote = async (v) => {
    setMyVote(v);
    await supabase.from('votes').insert({ roll_id: cur.id, user_id: user.id, vote: v });
    const { data } = await supabase.rpc('vote_result', { rid: cur.id });
    if (data) setResult(data);
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

  const box = { maxWidth: 440, margin: '0 auto', padding: 16, textAlign: 'center' };
  const inp = { width: '100%', padding: 12, margin: '6px 0', borderRadius: 8, border: 'none', boxSizing: 'border-box', fontSize: 16 };
  const btn = { padding: '10px 16px', margin: 4, borderRadius: 8, border: 'none', background: '#e94560', color: '#fff', fontSize: 15 };
  const grey = { ...btn, background: '#444' };
  const card = { background: '#16213e', padding: 16, borderRadius: 12, margin: '10px 0', fontSize: 20 };
  const chip = (on) => ({ ...btn, padding: '7px 12px', fontSize: 13, background: on ? '#e94560' : '#333' });

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  const bothVoted = result && result.total >= 2;
  const verdict = !bothVoted ? null
    : result.no > 0 ? '😌 আজ না, অন্য কিছু বেছে নিন'
    : result.yes === 2 ? '💖 দুজনেই হ্যাঁ!' : '🤔 দুজনেই রাজি, তবে ধীরে';

  const showCur = cur && (cur.stopped || (cur.a?.kind === 'card') === isCardTab);
  const showRolling = rolling && rollCard === isCardTab;

  return (
    <div style={box}>
      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(720deg)}}
@keyframes shuf{0%{transform:translateX(0) rotate(0)}25%{transform:translateX(-40px) rotate(-12deg)}50%{transform:translateX(40px) rotate(12deg)}75%{transform:translateX(-25px) rotate(-6deg)}100%{transform:translateX(0) rotate(0)}}
@keyframes flip{from{transform:rotateY(90deg)}to{transform:rotateY(0)}}`}</style>
      <h1>🎲 Dice App</h1>

      {!user && (
        <>
          <input style={inp} placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={inp} type="password" placeholder="পাসওয়ার্ড (৬+ অক্ষর)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button style={btn} onClick={signIn}>লগইন</button>
          <button style={btn} onClick={signUp}>সাইন আপ</button>
        </>
      )}

      {user && adult === false && (
        <div style={card}>
          <p style={{ fontSize: 16 }}>এই অ্যাপ শুধু প্রাপ্তবয়স্ক দম্পতির জন্য। সব কিছু পারস্পরিক সম্মতিতে, যেকোনো সময় থামানো যাবে।</p>
          <label style={{ fontSize: 16 }}>
            <input type="checkbox" checked={tick} onChange={(e) => setTick(e.target.checked)} /> আমার বয়স ১৮+ এবং আমি রাজি
          </label>
          <div><button style={btn} onClick={confirmAdult}>চালিয়ে যান</button></div>
        </div>
      )}

      {user && adult && !room && (
        <>
          <button style={btn} onClick={createRoom}>নতুন রুম বানান</button>
          <p>অথবা রুম কোড দিয়ে জয়েন করুন</p>
          <input style={inp} placeholder="রুম কোড" value={code} onChange={(e) => setCode(e.target.value)} />
          <button style={btn} onClick={joinRoom}>জয়েন</button>
        </>
      )}

      {user && adult && room && (
        <>
        <button style={{ ...grey, fontSize: 12 }} onClick={leaveRoom}>← রুম বদলান</button>
          <p>রুম কোড: <b style={{ fontSize: 22, letterSpacing: 3 }}>{room.code}</b>
            {!room.partner2_id && <><br /><small>পার্টনারের জন্য অপেক্ষা...</small></>}</p>

          <div>
            {[['dice', '🎲 ডাইস'], ['card', '🃏 কার্ড'], ['wish', '💭 উইশ'], ['history', '⭐ হিস্ট্রি']].map(([k, l]) =>
              <button key={k} style={chip(tab === k)} onClick={() => setTab(k)}>{l}</button>)}
          </div>

          {isGameTab && (
            <>
              <div style={{ fontSize: 13, margin: '8px 0' }}>
                আমি রাজি: {[1, 2, 3].map((n) =>
                  <button key={n} style={chip(myLevel === n)} onClick={() => setLevel(n)}>{n}</button>)}
                <br />দুজনের মিল: <b>{LEVELS[eff]}</b>
              </div>
              <div>
                {Object.entries(MOODS).map(([k, l]) =>
                  <button key={k} style={chip(mood === k)} onClick={() => setMood(k)}>{l}</button>)}
              </div>

              {tab === 'dice' && (
                <div>
                  {[['dice', 'দুই ডাইস'], ['truth', 'ট্রুথ'], ['dare', 'ডেয়ার']].map(([k, l]) =>
                    <button key={k} style={chip(mode === k)} onClick={() => setMode(k)}>{l}</button>)}
                </div>
              )}

              {isCardTab ? (
                <div style={{ height: 150, margin: '10px 0' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      display: 'inline-block', width: 90, height: 130, margin: '0 -20px',
                      borderRadius: 10, background: '#111', border: '2px solid #e94560',
                      fontSize: 36, lineHeight: '130px',
                      transform: `rotate(${(i - 1) * 10}deg)`,
                      animation: showRolling ? `shuf 0.5s ${i * 0.1}s infinite` : 'none'
                    }}>🃏</div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 80, animation: showRolling ? 'spin 1.2s ease-out' : 'none' }}>
                  {mode === 'dice' ? '🎲🎲' : mode === 'truth' ? '💬' : '🔥'}
                </div>
              )}

              {cur?.stopped && !rolling && <div style={{ ...card, background: '#5a1a1a' }}>⛔ থামানো হয়েছে। কোনো সমস্যা নেই।</div>}

              {showCur && !cur.stopped && !rolling && (
                <>
                  <div style={{ ...card, animation: isCardTab ? 'flip .6s ease-out' : 'none', border: isCardTab ? '2px solid #e94560' : 'none' }}>
                    {cur.a?.image_url && (
                      <img src={cur.a.image_url} alt="" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />
                    )}
                    {cur.a?.title}
                    {cur.b &&<div style={{ color: '#ffd369', marginTop: 8 }}>{cur.b.title}</div>}
                    <div style={{ marginTop: 8 }}>
                      <button style={grey} onClick={() => toggleFav(cur.a)}>
                        {favs.some((f) => f.activity_id === cur.a?.id) ? '⭐ সেভ করা' : '☆ সেভ'}
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 14 }}>গোপন ভোট (শুধু ফলাফল দেখা যাবে)</div>
                  {!myVote ? (
                    <div>
                      <button style={btn} onClick={() => castVote('yes')}>✅ হ্যাঁ</button>
                      <button style={grey} onClick={() => castVote('maybe')}>🤔 হয়তো</button>
                      <button style={grey} onClick={() => castVote('no')}>❌ না</button>
                    </div>
                  ) : (
                    <p>{verdict || 'ভোট দিয়েছেন, পার্টনারের অপেক্ষা...'}</p>
                  )}

                  <div style={{ margin: '10px 0' }}>
                    <div style={{ fontSize: 40 }}>{mm}:{ss}</div>
                    {[60, 180, 300].map((s) =>
                      <button key={s} style={chip(false)} onClick={() => { setSecs(s); setRunning(true); }}>{s / 60} মিনিট</button>)}
                    {secs > 0 && <button style={chip(false)} onClick={() => setRunning(!running)}>{running ? 'পজ' : 'শুরু'}</button>}
                  </div>
                </>
              )}

              <div>
                <button style={btn} onClick={roll} disabled={rolling}>{isCardTab ? '🃏 কার্ড তুলুন' : 'রোল করুন'}</button>
                {showCur && !cur.stopped && !rolling && <button style={grey} onClick={roll}>পাস করুন</button>}
                <button style={{ ...btn, background: '#b00020' }} onClick={stop}>⛔ থামুন</button>
              </div>
            </>
          )}

          {tab === 'wish' && (
            <>
              <p style={{ fontSize: 14 }}>নিজের ইচ্ছা লিখুন। এগুলো পার্টনার দেখবে না। দুজনের একই ইচ্ছা মিললে শুধু তখনই নিচে দেখাবে।</p>
              <input style={inp} placeholder="যেমন: একসাথে সিনেমা দেখা" value={wish} onChange={(e) => setWish(e.target.value)} />
              <button style={btn} onClick={addWish}>যোগ করুন</button>
              <h3>💞 দুজনের মিল</h3>
              {matches.length === 0 ? <p style={{ fontSize: 14 }}>এখনো কিছু মেলেনি</p> :
                matches.map((m) => <div key={m} style={card}>{m}</div>)}
              <h3>আমার তালিকা</h3>
              {wishes.filter((w) => w.user_id === user.id).map((w) => (
                <div key={w.id} style={{ ...card, fontSize: 16 }}>
                  {w.body} <button style={grey} onClick={() => delWish(w.id)}>মুছুন</button>
                </div>))}
            </>
          )}

          {tab === 'history' && (
            <>
              <h3>⭐ পছন্দের তালিকা</h3>
              {favs.length === 0 && <p style={{ fontSize: 14 }}>এখনো কিছু সেভ করা নেই</p>}
              {favs.map((f) => <div key={f.activity_id} style={{ ...card, fontSize: 16 }}>{f.activities?.title}</div>)}
              <h3>🕘 সাম্প্রতিক রোল</h3>
              {history.map((h) => (
                <div key={h.id} style={{ ...card, fontSize: 15 }}>
                  {h.a?.title}{h.b ? ' · ' + h.b.title : ''}
                  <br /><small>{new Date(h.created_at).toLocaleString('bn-BD')}</small>
                </div>))}
            </>
          )}
        </>
      )}

      {msg && <p style={{ color: '#ffd369' }}>{msg}</p>}
      {user && <button style={{ ...grey, fontSize: 13, background: '#333' }} onClick={signOut}>লগআউট</button>}
    </div>
  );
}

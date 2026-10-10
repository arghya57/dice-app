'use client';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!room || acts.length === 0) return;
    const channel = supabase.channel('room-' + room.id)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rolls', filter: `room_id=eq.${room.id}` },
        (p) => {
          const r = p.new;
          setMyVote(null); setResult(null); setRunning(false);
          if (r.stopped) { setCur({ id: r.id, stopped: true }); return; }
          const a = acts.find((x) => x.id === r.activity_id) || null;
          const b = acts.find((x) => x.id === r.activity2_id) || null;
          setRollCard(a?.kind === 'card');
          setRolling(true);
          setTimeout(() => {
            setCur({ id: r.id, a, b });
            setSecs(a?.seconds || 0);
            setRolling(false);
          }, 1200);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id, acts]);

  useEffect(() => {
    if (!room) return;
    const t = setInterval(async () => {
      const { data } = await supabase.from('rooms').select('*').eq('id', room.id).single();
      if (data) setRoom(data);
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
  const chip = (on) => ({ ...btn, padding: '7px 12px', fontSize: 13, backgroun

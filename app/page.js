'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [room, setRoom] = useState(null);
  const [code, setCode] = useState('');
  const [activities, setActivities] = useState([]);
  const [current, setCurrent] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('activities').select('*').eq('is_active', true)
      .then(({ data }) => setActivities(data || []));
    supabase.from('rooms').select('*')
      .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
      .order('id', { ascending: false }).limit(1)
      .then(({ data }) => setRoom(data?.[0] ?? null));
  }, [user]);

  useEffect(() => {
    if (!room || activities.length === 0) return;
    const show = (activityId) => {
      setRolling(true);
      setTimeout(() => {
        setCurrent(activities.find((a) => a.id === activityId) || null);
        setRolling(false);
      }, 1200);
    };
    const channel = supabase.channel('room-' + room.id)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rolls', filter: `room_id=eq.${room.id}` },
        (p) => show(p.new.activity_id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room, activities]);

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    setMsg(error ? error.message : 'সাইন আপ হয়েছে');
  };
  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
  };
  const signOut = () => { supabase.auth.signOut(); setRoom(null); setCurrent(null); };

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

  const roll = async () => {
    if (activities.length === 0) return setMsg('কোনো অ্যাক্টিভিটি নেই');
    const a = activities[Math.floor(Math.random() * activities.length)];
    const { error } = await supabase.from('rolls')
      .insert({ room_id: room.id, activity_id: a.id, rolled_by: user.id });
    if (error) setMsg(error.message);
  };

  const box = { maxWidth: 420, margin: '0 auto', padding: 20, textAlign: 'center' };
  const inp = { width: '100%', padding: 12, margin: '6px 0', borderRadius: 8, border: 'none', boxSizing: 'border-box', fontSize: 16 };
  const btn = { padding: '12px 20px', margin: 6, borderRadius: 8, border: 'none', background: '#e94560', color: '#fff', fontSize: 16 };

  return (
    <div style={box}>
      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(720deg)}}`}</style>
      <h1>🎲 Dice App</h1>

      {!user && (
        <>
          <input style={inp} placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={inp} type="password" placeholder="পাসওয়ার্ড (৬+ অক্ষর)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button style={btn} onClick={signIn}>লগইন</button>
          <button style={btn} onClick={signUp}>সাইন আপ</button>
        </>
      )}

      {user && !room && (
        <>
          <button style={btn} onClick={createRoom}>নতুন রুম বানান</button>
          <p>অথবা রুম কোড দিয়ে জয়েন করুন</p>
          <input style={inp} placeholder="রুম কোড" value={code} onChange={(e) => setCode(e.target.value)} />
          <button style={btn} onClick={joinRoom}>জয়েন</button>
        </>
      )}

      {user && room && (
        <>
          <p>রুম কোড: <b style={{ fontSize: 24, letterSpacing: 3 }}>{room.code}</b></p>
          <div style={{ fontSize: 90, animation: rolling ? 'spin 1.2s ease-out' : 'none' }}>🎲</div>
          {current && !rolling && (
            <div style={{ background: '#16213e', padding: 20, borderRadius: 12, fontSize: 22, margin: '10px 0' }}>
              {current.title}
            </div>
          )}
          <button style={btn} onClick={roll} disabled={rolling}>ডাইস রোল করুন</button>
          {current && !rolling && <button style={{ ...btn, background: '#555' }} onClick={roll}>পাস করুন</button>}
        </>
      )}

      {msg && <p style={{ color: '#ffd369' }}>{msg}</p>}
      {user && <button style={{ ...btn, background: '#333', fontSize: 13 }} onClick={signOut}>লগআউট</button>}
    </div>
  );
}

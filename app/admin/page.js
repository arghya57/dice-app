'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const KINDS = { action: 'অ্যাকশন', modifier: 'মডিফায়ার (কোথায়/কীভাবে)', truth: 'ট্রুথ', dare: 'ডেয়ার', card: 'কার্ড' };
const LEVELS = { 1: 'লেভেল ১ · হালকা', 2: 'লেভেল ২ · রোমান্টিক', 3: 'লেভেল ৩ · ইন্টিমেট' };
const MOODS = { any: 'যেকোনো', romantic: 'রোমান্টিক', naughty: 'দুষ্টু', tired: 'ক্লান্ত' };
const EMPTY = { title: '', kind: 'action', level: 1, mood: 'any', seconds: 0 };

export default function Admin() {
  const [ok, setOk] = useState(null);
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await supabase.from('activities').select('*').order('id');
    setList(data || []);
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

  const save = async () => {
    if (!form.title.trim()) return setMsg('নাম লিখুন');
    const row = {
      title: form.title.trim(),
      kind: form.kind,
      level: Number(form.level),
      mood: form.mood,
      seconds: Number(form.seconds) || 0,
    };
    const { error } = editId
      ? await supabase.from('activities').update(row).eq('id', editId)
      : await supabase.from('activities').insert(row);
    if (error) return setMsg(error.message);
    setMsg(editId ? 'আপডেট হয়েছে' : 'যোগ হয়েছে');
    setForm(EMPTY); setEditId(null); load();
  };

  const edit = (a) => {
    setEditId(a.id);
    setForm({ title: a.title, kind: a.kind, level: a.level, mood: a.mood, seconds: a.seconds });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => { setEditId(null); setForm(EMPTY); setMsg(''); };

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

  const box = { maxWidth: 480, margin: '0 auto', padding: 20 };
  const inp = { width: '100%', padding: 12, margin: '6px 0', borderRadius: 8, border: 'none', boxSizing: 'border-box', fontSize: 16 };
  const btn = { padding: '10px 16px', margin: 4, borderRadius: 8, border: 'none', background: '#e94560', color: '#fff', fontSize: 15 };
  const chip = (on) => ({ ...btn, padding: '6px 12px', fontSize: 13, background: on ? '#e94560' : '#333' });
  const lbl = { fontSize: 13, color: '#aaa', marginTop: 8, display: 'block' };

  if (ok === null) return <div style={box}>লোড হচ্ছে...</div>;
  if (!ok) return <div style={box}>শুধু অ্যাডমিন ঢুকতে পারবে। <a href="/" style={{ color: '#ffd369' }}>হোমে যান</a></div>;

  const shown = list.filter((a) => filter === 'all' || a.kind === filter);

  return (
    <div style={box}>
      <h2>⚙️ অ্যাডমিন প্যানেল</h2>
      <a href="/" style={{ color: '#ffd369' }}>← হোম</a>

      <h3>{editId ? '✏️ এডিট করুন' : 'নতুন অ্যাক্টিভিটি'}</h3>
      <input style={inp} placeholder="লেখা, যেমন: পিঠে ম্যাসাজ" value={form.title} onChange={(e) => set('title', e.target.value)} />

      <label style={lbl}>ধরন</label>
      <select style={inp} value={form.kind} onChange={(e) => set('kind', e.target.value)}>
        {Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>

      <label style={lbl}>লেভেল</label>
      <select style={inp} value={form.level} onChange={(e) => set('level', e.target.value)}>
        {Object.entries(LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>

      <label style={lbl}>মুড</label>
      <select style={inp} value={form.mood} onChange={(e) => set('mood', e.target.value)}>
        {Object.entries(MOODS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>

      <label style={lbl}>টাইমার সেকেন্ড (০ = টাইমার নেই)</label>
      <input style={inp} type="number" min="0" value={form.seconds} onChange={(e) => set('seconds', e.target.value)} />

      <button style={btn} onClick={save}>{editId ? 'সেভ করুন' : 'যোগ করুন'}</button>
      {editId && <button style={{ ...btn, background: '#555' }} onClick={cancel}>বাতিল</button>}
      {msg && <p style={{ color: '#ffd369' }}>{msg}</p>}

      <h3>সব অ্যাক্টিভিটি ({shown.length})</h3>
      <div>
        <button style={chip(filter === 'all')} onClick={() => setFilter('all')}>সব</button>
        {Object.entries(KINDS).map(([k, l]) =>
          <button key={k} style={chip(filter === k)} onClick={() => setFilter(k)}>{l.split(' ')[0]}</button>)}
      </div>

      {shown.map((a) => (
        <div key={a.id} style={{ background: '#16213e', padding: 12, borderRadius: 10, margin: '8px 0', opacity: a.is_active ? 1 : 0.5 }}>
          <div style={{ fontSize: 18 }}>{a.title}</div>
          <small>
            {KINDS[a.kind]?.split(' ')[0]} · লেভেল {a.level} · {MOODS[a.mood]}
            {a.seconds > 0 ? ` · ${a.seconds}সে` : ''} · {a.is_active ? 'চালু' : 'বন্ধ'}
          </small>
          <div>
            <button style={{ ...btn, background: '#2a6f97' }} onClick={() => edit(a)}>এডিট</button>
            <button style={{ ...btn, background: '#555' }} onClick={() => toggle(a)}>{a.is_active ? 'বন্ধ' : 'চালু'}</button>
            <button style={{ ...btn, background: '#8b1e2d' }} onClick={() => del(a)}>মুছুন</button>
          </div>
        </div>
      ))}
    </div>
  );
}

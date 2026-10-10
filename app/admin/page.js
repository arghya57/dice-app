'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Admin() {
  const [ok, setOk] = useState(null);
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('romantic');
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

  const add = async () => {
    if (!title.trim()) return;
    const { error } = await supabase.from('activities').insert({ title: title.trim(), category });
    if (error) return setMsg(error.message);
    setTitle(''); setMsg('যোগ হয়েছে'); load();
  };

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

  if (ok === null) return <div style={box}>লোড হচ্ছে...</div>;
  if (!ok) return <div style={box}>শুধু অ্যাডমিন ঢুকতে পারবে। <a href="/" style={{ color: '#ffd369' }}>হোমে যান</a></div>;

  return (
    <div style={box}>
      <h2>⚙️ অ্যাডমিন প্যানেল</h2>
      <a href="/" style={{ color: '#ffd369' }}>← হোম</a>

      <h3>নতুন অ্যাক্টিভিটি</h3>
      <input style={inp} placeholder="যেমন: হাগ করুন" value={title} onChange={(e) => setTitle(e.target.value)} />
      <select style={inp} value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="romantic">রোমান্টিক</option>
        <option value="fun">মজার</option>
        <option value="deep">গভীর</option>
      </select>
      <button style={btn} onClick={add}>যোগ করুন</button>
      {msg && <p style={{ color: '#ffd369' }}>{msg}</p>}

      <h3>সব অ্যাক্টিভিটি ({list.length})</h3>
      {list.map((a) => (
        <div key={a.id} style={{ background: '#16213e', padding: 12, borderRadius: 10, margin: '8px 0', opacity: a.is_active ? 1 : 0.5 }}>
          <div style={{ fontSize: 18 }}>{a.title}</div>
          <small>{a.category} · {a.is_active ? 'চালু' : 'বন্ধ'}</small>
          <div>
            <button style={{ ...btn, background: '#555' }} onClick={() => toggle(a)}>{a.is_active ? 'বন্ধ করুন' : 'চালু করুন'}</button>
            <button style={{ ...btn, background: '#8b1e2d' }} onClick={() => del(a)}>মুছুন</button>
          </div>
        </div>
      ))}
    </div>
  );
}

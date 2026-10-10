import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// লক স্ক্রিনে কিছু ফাঁস না হওয়ার জন্য নোটিফিকেশনের লেখা ইচ্ছে করে নিরপেক্ষ রাখা হয়েছে।
const TEXT = {
  roll: '💞 আপনার পালা, পার্টনার অপেক্ষা করছে',
  msg: '💌 নতুন বার্তা এসেছে',
  stop: '💗 পার্টনার একটু বিরতি চেয়েছে',
};

const json = (obj, status = 200) => Response.json(obj, { status });

export async function POST(req) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
    if (!url || !serviceKey || !pub || !priv) return json({ error: 'push not configured' }, 500);

    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'unauthorized' }, 401);

    const { room_id, kind } = await req.json();
    const body = TEXT[kind];
    if (!body || room_id === undefined || room_id === null) return json({ error: 'bad request' }, 400);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u?.user) return json({ error: 'unauthorized' }, 401);
    const me = u.user.id;

    const { data: room } = await admin.from('rooms')
      .select('partner1_id, partner2_id').eq('id', room_id).single();
    if (!room || (room.partner1_id !== me && room.partner2_id !== me)) return json({ error: 'forbidden' }, 403);

    const partner = room.partner1_id === me ? room.partner2_id : room.partner1_id;
    if (!partner) return json({ sent: 0 });

    const { data: subs } = await admin.from('push_subscriptions')
      .select('id, sub').eq('user_id', partner);
    if (!subs?.length) return json({ sent: 0 });

    webpush.setVapidDetails(subject, pub, priv);
    const payload = JSON.stringify({ title: 'Dice App', body, tag: 'room-' + kind, url: '/' });

    let sent = 0;
    const dead = [];
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(s.sub, payload, { TTL: 3600 });
        sent += 1;
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) dead.push(s.id);
      }
    }));
    if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead);

    return json({ sent });
  } catch (e) {
    return json({ error: 'server error' }, 500);
  }
}

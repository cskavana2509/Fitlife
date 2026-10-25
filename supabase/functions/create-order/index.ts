import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Please log in first' }, 401);

    const admin = createClient(url, service);
    const { kind, item_id } = await req.json();

    // Price is always read from the database, never trusted from the client
    let amount = 0;
    let description = '';

    if (kind === 'membership') {
      const { data: plan } = await admin
        .from('membership_plans')
        .select('name, price_paise, fitness_centres(name)')
        .eq('id', item_id).single();
      if (!plan) return json({ error: 'Plan not found' }, 404);
      amount = plan.price_paise;
      description = `${plan.name} – ${plan.fitness_centres?.name ?? 'FitLife'}`;
    } else if (kind === 'session') {
      const { data: slot } = await admin
        .from('training_slots')
        .select('is_booked, trainer_id, trainers(display_name, hourly_rate_paise, is_approved)')
        .eq('id', item_id).single();
      if (!slot || slot.is_booked || !slot.trainers?.is_approved)
        return json({ error: 'This slot is no longer available' }, 400);
      amount = slot.trainers.hourly_rate_paise;
      description = `Training with ${slot.trainers.display_name}`;
    } else {
      return json({ error: 'Invalid kind' }, 400);
    }

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
      }),
    });
    const order = await rzpRes.json();
    if (!rzpRes.ok) return json({ error: order.error?.description ?? 'Razorpay error' }, 502);

    await admin.from('orders').insert({
      user_id: user.id,
      kind,
      item_id,
      amount_paise: amount,
      razorpay_order_id: order.id,
    });

    return json({ order_id: order.id, amount, key_id: keyId, description });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
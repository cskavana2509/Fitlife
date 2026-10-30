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
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // 0. Only logged-in users can verify a payment
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // 1. Recreate the Razorpay signature and compare it (HMAC-SHA256 of "order_id|payment_id")
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(keySecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${razorpay_order_id}|${razorpay_payment_id}`));
    const expected = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
    if (expected !== razorpay_signature) return json({ error: 'Invalid payment signature' }, 400);

    const admin = createClient(url, service);

    // 2. Load the order and make sure it belongs to this user
    const { data: order } = await admin
      .from('orders').select('*')
      .eq('razorpay_order_id', razorpay_order_id).eq('user_id', user.id).single();
    if (!order) return json({ error: 'Order not found' }, 404);
    if (order.status === 'paid') return json({ ok: true, already: true });

    // 3. Give the customer what they paid for
    if (order.kind === 'membership') {
      const { data: plan } = await admin.from('membership_plans').select('*').eq('id', order.item_id).single();
      const ends = new Date();
      ends.setDate(ends.getDate() + plan!.duration_days);
      await admin.from('memberships').insert({
        user_id: user.id,
        plan_id: plan!.id,
        centre_id: plan!.centre_id,
        ends_on: ends.toISOString().slice(0, 10),
      });
    } else {
      // Only succeeds if the slot is still free
      const { data: slot, error } = await admin
        .from('training_slots').update({ is_booked: true })
        .eq('id', order.item_id).eq('is_booked', false)
        .select().single();
      if (error || !slot) return json({ error: 'Slot was taken. Contact support for a refund.' }, 409);
      await admin.from('bookings').insert({
        user_id: user.id,
        slot_id: slot.id,
        trainer_id: slot.trainer_id,
      });
    }

    // 4. Mark the order as paid
    await admin.from('orders')
      .update({ status: 'paid', razorpay_payment_id })
      .eq('id', order.id);

    // 5. Send confirmations (email, SMS, WhatsApp).
    //    A notification failure must never undo the payment.
    try {
      const notifyRes = await fetch(`${url}/functions/v1/notify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${service}`,
          apikey: service,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: order.id }),
      });
      const notifyBody = await notifyRes.text();
      console.log(`notify called: status=${notifyRes.status} body=${notifyBody}`);
    } catch (e) {
      console.error('notify call failed:', String(e));
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
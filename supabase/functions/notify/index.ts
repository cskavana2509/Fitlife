import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Called only by verify-payment, with the service role key as the bearer token
Deno.serve(async (req) => {
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { order_id } = await req.json();

    const admin = createClient(url, service);

    const { data: order } = await admin.from('orders').select('*').eq('id', order_id).single();
    if (!order) return json({ error: 'Order not found' }, 404);

    const { data: { user } } = await admin.auth.admin.getUserById(order.user_id);
    const { data: profile } = await admin.from('profiles').select('full_name, phone').eq('id', order.user_id).single();

    const amount = `₹${(order.amount_paise / 100).toFixed(0)}`;
    const name = profile?.full_name ?? 'there';
    const message = order.kind === 'membership'
      ? `Hi ${name}, your FitLife membership (${amount}) is active. Enjoy your workouts! 💪`
      : `Hi ${name}, your FitLife training session (${amount}) is booked. See you at the gym! 💪`;

    const headers = { Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' };
    const body = JSON.stringify({
      to_email: user?.email,
      to_phone: profile?.phone,
      subject: 'FitLife payment confirmed',
      message,
    });

    // Fire all three channels. One failing does not block the others.
    const results = await Promise.allSettled([
      fetch(`${url}/functions/v1/send-email`, { method: 'POST', headers, body }),
      fetch(`${url}/functions/v1/send-sms`, { method: 'POST', headers, body }),
      fetch(`${url}/functions/v1/send-whatsapp`, { method: 'POST', headers, body }),
    ]);

    return json({
      ok: true,
      email: results[0].status,
      sms: results[1].status,
      whatsapp: results[2].status,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
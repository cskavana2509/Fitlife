import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Called only by verify-payment, with the service role key as the bearer token
Deno.serve(async (req) => {
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { order_id } = await req.json();
    if (!order_id || typeof order_id !== 'string') {
      return json({ error: 'A valid order_id is required' }, 400);
    }

    const admin = createClient(url, service);

    const { data: order, error: orderError } = await admin
      .from('orders').select('*').eq('id', order_id).single();
    if (orderError) throw orderError;
    if (!order) return json({ error: 'Order not found' }, 404);

    const { data: { user }, error: userError } = await admin.auth.admin.getUserById(order.user_id);
    if (userError) throw userError;
    const { data: profile, error: profileError } = await admin
      .from('profiles').select('full_name, phone').eq('id', order.user_id).single();
    if (profileError) throw profileError;

    const amount = `₹${(order.amount_paise / 100).toFixed(0)}`;
    const name = profile?.full_name ?? 'there';
    const message = order.kind === 'membership'
      ? `Hi ${name}, your FitLife membership (${amount}) is active. Enjoy your workouts! 💪`
      : `Hi ${name}, your FitLife training session (${amount}) is booked. See you at the gym! 💪`;

    const headers = {
      Authorization: `Bearer ${service}`,
      apikey: service,
      'Content-Type': 'application/json',
    };
    const body = JSON.stringify({
      to_email: user?.email,
      to_phone: profile?.phone,
      subject: 'FitLife payment confirmed',
      message,
    });

    // Fire all three channels. One failing does not block the others.
    const responses = await Promise.allSettled([
      fetch(`${url}/functions/v1/send-email`, { method: 'POST', headers, body }),
      fetch(`${url}/functions/v1/send-sms`, { method: 'POST', headers, body }),
      fetch(`${url}/functions/v1/send-whatsapp`, { method: 'POST', headers, body }),
    ]);
    const channels = await Promise.all(responses.map(async (result) => {
      if (result.status === 'rejected') return { ok: false, error: String(result.reason) };

      const response = result.value;
      const payload = await response.json().catch(() => null);
      if (!payload || typeof payload !== 'object') {
        return { ok: false, status: response.status, error: 'Notification function returned an invalid response' };
      }
      return {
        ...payload,
        status: response.status,
        ok: response.ok && payload.ok !== false,
      };
    }));
    const [email, sms, whatsapp] = channels;
    const ok = channels.every((channel) => channel.ok);

    return json({ ok, email, sms, whatsapp }, ok ? 200 : 502);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
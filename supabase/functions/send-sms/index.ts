const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Indian numbers without a country code get +91
const e164 = (p: string) => (p.startsWith('+') ? p : '+91' + p.replace(/\D/g, ''));

// Uses Twilio SMS. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM.
Deno.serve(async (req) => {
  try {
    const { to_phone, message } = await req.json();
    if (!to_phone) return json({ skipped: 'no phone' });

    const sid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const token = Deno.env.get('TWILIO_AUTH_TOKEN')!;

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${sid}:${token}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: e164(to_phone),
        From: Deno.env.get('TWILIO_SMS_FROM')!,
        Body: message,
      }),
    });

    return json({ ok: res.ok }, res.ok ? 200 : 502);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
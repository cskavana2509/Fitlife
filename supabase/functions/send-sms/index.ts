const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const e164 = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  let normalized = '';
  if (phone.trim().startsWith('+')) normalized = `+${digits}`;
  else if (/^91\d{10}$/.test(digits)) normalized = `+${digits}`;
  else if (/^0\d{10}$/.test(digits)) normalized = `+91${digits.slice(1)}`;
  else if (/^\d{10}$/.test(digits)) normalized = `+91${digits}`;

  if (/^\+[1-9]\d{7,14}$/.test(normalized)) return normalized;
  throw new Error('Phone number must be a valid E.164 number or a 10-digit Indian number');
};

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

// Uses Twilio SMS. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM.
Deno.serve(async (req) => {
  try {
    const { to_phone, message } = await req.json();
    if (!to_phone) return json({ skipped: 'no phone' });
    if (typeof to_phone !== 'string' || typeof message !== 'string' || !message.trim()) {
      return json({ error: 'A valid phone number and message are required' }, 400);
    }

    const sid = requiredEnv('TWILIO_ACCOUNT_SID');
    const token = requiredEnv('TWILIO_AUTH_TOKEN');
    const from = requiredEnv('TWILIO_SMS_FROM');

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${sid}:${token}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: e164(to_phone),
        From: from,
        Body: message,
      }),
    });

    return json(
      { ok: res.ok, ...(!res.ok ? { error: `Twilio SMS returned HTTP ${res.status}` } : {}) },
      res.ok ? 200 : 502,
    );
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
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

const twilioFailure = async (res: Response, channel: string) => {
  const body: unknown = await res.json().catch(() => null);
  const details = typeof body === 'object' && body !== null ? body : {};

  return json({
    ok: false,
    error: `Twilio ${channel} returned HTTP ${res.status}`,
    ...(typeof details === 'object' && 'code' in details ? { code: details.code } : {}),
    ...(typeof details === 'object' && 'message' in details ? { details: details.message } : {}),
  }, 502);
};

// Uses Twilio's WhatsApp API. Set TWILIO_WHATSAPP_FROM to your sender number, for example +14155238886 in sandbox.
// Note: the recipient must join your sandbox first, or you need an approved WhatsApp Business template.
Deno.serve(async (req) => {
  try {
    const { to_phone, message } = await req.json();
    if (!to_phone) return json({ skipped: 'no phone' });
    if (typeof to_phone !== 'string' || typeof message !== 'string' || !message.trim()) {
      return json({ error: 'A valid phone number and message are required' }, 400);
    }

    const sid = requiredEnv('TWILIO_ACCOUNT_SID');
    const token = requiredEnv('TWILIO_AUTH_TOKEN');
    const sender = requiredEnv('TWILIO_WHATSAPP_FROM').replace(/^whatsapp:/, '');
    const contentSid = requiredEnv('TWILIO_WHATSAPP_CONTENT_SID');

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${sid}:${token}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `whatsapp:${e164(to_phone)}`,
        From: `whatsapp:${sender}`,
        ContentSid: contentSid,
        ContentVariables: JSON.stringify({ '1': message }),
      }),
    });

    if (!res.ok) return await twilioFailure(res, 'WhatsApp');
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
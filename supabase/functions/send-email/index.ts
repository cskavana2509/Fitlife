const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Uses Resend (https://resend.com). Set RESEND_API_KEY with supabase secrets.
Deno.serve(async (req) => {
  try {
    const { to_email, subject, message } = await req.json();
    if (!to_email) return json({ skipped: 'no email' });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FitLife <onboarding@resend.dev>',
        to: [to_email],
        subject,
        html: `<div style="font-family:Inter,sans-serif;background:#0c0e16;color:#f2f4fa;padding:32px;border-radius:16px">
                 <h2 style="color:#c6ff3d;margin:0 0 12px">FitLife</h2>
                 <p style="font-size:16px;line-height:1.6">${message}</p>
               </div>`,
      }),
    });

    return json({ ok: res.ok }, res.ok ? 200 : 502);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
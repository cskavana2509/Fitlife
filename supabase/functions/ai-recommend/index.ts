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

// Free-tier model. If Google retires it, check the current name in AI Studio.
const GEMINI_MODEL = 'gemini-flash-latest';

type Profile = {
  goal: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: string | null;
};
type Centre = { id: string; name: string; city: string; amenities: string[]; rating: number };
type Plan = { id: string; centre_id: string; name: string; price_paise: number };
type Diet = { id: string; title: string; goal: string; calories: number; protein_g: number };
type Result = {
  centres: { id: string; reason: string }[];
  diet_plans: { id: string; reason: string }[];
  workout_tips: string[];
};

const goalText = (goal: string) => goal.replace(/_/g, ' ');

// Used when the AI call fails or returns nothing usable
function ruleBasedPicks(profile: Profile, centres: Centre[], diets: Diet[]): Result {
  const goal = profile.goal ?? 'maintenance';
  const level = profile.activity_level ?? 'moderate';

  const dietPicks = diets
    .filter((d) => d.goal === goal)
    .slice(0, 2)
    .map((d) => ({ id: d.id, reason: `Built for a ${goalText(goal)} goal with ${d.protein_g}g protein per day.` }));

  // Studios (yoga, pilates) suit maintenance and endurance; gyms suit the rest
  const wantsStudio = goal === 'maintenance' || goal === 'endurance';
  const centrePicks = centres
    .map((c) => {
      const isStudio = (c.amenities ?? []).some((a) => /yoga|pilates/i.test(a));
      return { ...c, score: c.rating + (isStudio === wantsStudio ? 1 : 0) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((c) => ({ id: c.id, reason: `Rated ${c.rating} and a good match for ${goalText(goal)}.` }));

  const tips: Record<string, string[]> = {
    sedentary: ['Start with a 20-minute walk every day.', 'Add two short strength sessions each week.', 'Stretch for 5 minutes each morning.'],
    light: ['Build up to three workouts a week.', 'Track your protein intake daily.', 'Aim for 7 to 8 hours of sleep.'],
    moderate: ['Mix strength and cardio across the week.', 'Increase weights gradually, about 5% a week.', 'Take at least one full rest day.'],
    active: ['Schedule a deload week every 6 weeks.', 'Include mobility work after each session.', 'Eat a carb-rich meal around training.'],
  };

  return {
    centres: centrePicks,
    diet_plans: dietPicks,
    workout_tips: tips[level] ?? tips.moderate,
  };
}

async function askGemini(prompt: string, apiKey: string): Promise<Result> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 800,
          temperature: 0.4,
        },
      }),
    },
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `Gemini HTTP ${res.status}`);

  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';

    // 1. Only logged-in users
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Please log in first' }, 401);

    const admin = createClient(url, service);

    // 2. Load the user's profile and the real catalogue
    const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single();
    const { data: centresData } = await admin.from('fitness_centres').select('id, name, city, amenities, rating');
    const { data: plansData } = await admin.from('membership_plans').select('id, centre_id, name, price_paise');
    const { data: dietsData } = await admin.from('diet_plans').select('id, title, goal, calories, protein_g');

    const centres = (centresData ?? []) as Centre[];
    const plans = (plansData ?? []) as Plan[];
    const diets = (dietsData ?? []) as Diet[];
    const p = (profile ?? {}) as Profile;

    // 3. Try Gemini first
    let result: Result | null = null;
    let source = 'ai';

    if (geminiKey) {
      try {
        const prompt = `You are a fitness advisor for the FitLife platform.

User profile:
${JSON.stringify({
  goal: p.goal,
  age: p.age,
  weight_kg: p.weight_kg,
  height_cm: p.height_cm,
  activity_level: p.activity_level,
})}

Catalogue (ONLY use ids that appear here):
${JSON.stringify({ centres, membership_plans: plans, diet_plans: diets })}

Return JSON only, in exactly this shape:
{
  "centres": [{ "id": "...", "reason": "one short sentence" }],
  "diet_plans": [{ "id": "...", "reason": "one short sentence" }],
  "workout_tips": ["tip", "tip", "tip"]
}
Pick at most 2 centres and at most 2 diet plans. Match the user's goal and activity level.`;

        const ai = await askGemini(prompt, geminiKey);

        // Keep only ids that really exist in the catalogue
        const centreIds = new Set(centres.map((c) => c.id));
        const dietIds = new Set(diets.map((d) => d.id));
        result = {
          centres: (ai.centres ?? []).filter((r) => centreIds.has(r.id)).slice(0, 2),
          diet_plans: (ai.diet_plans ?? []).filter((r) => dietIds.has(r.id)).slice(0, 2),
          workout_tips: (ai.workout_tips ?? []).slice(0, 3),
        };
        if (result.centres.length === 0 && result.diet_plans.length === 0) result = null;
      } catch (aiErr) {
        console.error('Gemini failed, using rules:', aiErr);
        result = null;
      }
    }

    // 4. Fallback: rule-based picks (no API needed)
    if (!result) {
      result = ruleBasedPicks(p, centres, diets);
      source = 'rules';
    }

    // 5. Save and return
    await admin.from('recommendations').insert({
      user_id: user.id,
      kind: 'centre',
      payload: result,
    });

    return json({ ...result, source });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
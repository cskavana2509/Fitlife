import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sparkles, Target, Activity, Dumbbell, Salad, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth';
import Reveal from '../components/Reveal';

export default function Recommendations() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    goal: profile?.goal || 'weight_loss',
    age: profile?.age || '',
    weight_kg: profile?.weight_kg || '',
    height_cm: profile?.height_cm || '',
    activity_level: profile?.activity_level || 'moderate',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const getRecommendations = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const { error: saveErr } = await supabase.from('profiles').update({
      goal: form.goal,
      age: Number(form.age) || null,
      weight_kg: Number(form.weight_kg) || null,
      height_cm: Number(form.height_cm) || null,
      activity_level: form.activity_level,
    }).eq('id', user.id);
    if (saveErr) { setLoading(false); return toast.error(saveErr.message); }

    const { data, error } = await supabase.functions.invoke('ai-recommend');
    setLoading(false);
    if (error || data?.error) return toast.error(data?.error || error.message);
    setResult(data);
    refreshProfile();
  };

  return (
    <div className="container section" style={{ paddingTop: 20 }}>
      <div className="page-head">
        <span className="eyebrow"><Sparkles size={14} style={{ verticalAlign: '-2px' }} /> AI powered</span>
        <h1>Your <span className="gradient-text">AI picks</span></h1>
        <p className="muted">Tell us about you and we will match you with centres, diets and training tips.</p>
      </div>

      <div className="dash" style={{ gridTemplateColumns: 'minmax(300px, 420px) 1fr', alignItems: 'start' }}>
        <form className="card card-lg" onSubmit={getRecommendations}>
          <h3 className="card-title"><Target size={20} color="var(--lime)" /> Your profile</h3>
          <div className="field"><label>Main goal</label>
            <select value={form.goal} onChange={update('goal')}>
              <option value="weight_loss">Weight loss</option>
              <option value="muscle_gain">Muscle gain</option>
              <option value="maintenance">Maintenance</option>
              <option value="endurance">Endurance</option>
            </select></div>
          <div className="row" style={{ gap: 14 }}>
            <div className="field"><label>Age</label>
              <input type="number" min="10" value={form.age} onChange={update('age')} /></div>
            <div className="field"><label>Weight (kg)</label>
              <input type="number" step="0.1" value={form.weight_kg} onChange={update('weight_kg')} /></div>
          </div>
          <div className="field"><label>Height (cm)</label>
            <input type="number" value={form.height_cm} onChange={update('height_cm')} /></div>
          <div className="field"><label>Activity level</label>
            <select value={form.activity_level} onChange={update('activity_level')}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Very active</option>
            </select></div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            <Sparkles size={16} /> {loading ? 'Thinking…' : 'Get recommendations'}
          </button>
        </form>

        <div>
          {!result && !loading && (
            <div className="card card-lg" style={{ textAlign: 'center', padding: 60 }}>
              <div className="icon-tile" style={{ margin: '0 auto 18px' }}><Activity size={24} /></div>
              <h3>Your plan starts here</h3>
              <p className="muted" style={{ marginTop: 8 }}>Fill in your details and we will suggest the best fit.</p>
            </div>
          )}
          {loading && <div className="skeleton" style={{ height: 380 }} />}

          {result && (
            <div style={{ display: 'grid', gap: 24 }}>
              <Reveal>
                <div className="card">
                  <h3 className="card-title"><MapPin size={20} color="var(--lime)" /> Centres for you</h3>
                  {result.centres?.length === 0 && <div className="empty">No matches found.</div>}
                  {result.centres?.map((r) => (
                    <Link key={r.id} to={`/centres/${r.id}`} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--lime)', fontWeight: 600 }}>View centre →</span>
                      <span className="muted">{r.reason}</span>
                    </Link>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div className="card">
                  <h3 className="card-title"><Salad size={20} color="var(--lime)" /> Diet plans for you</h3>
                  {result.diet_plans?.map((r) => (
                    <Link key={r.id} to="/diet" className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>View plan →</span>
                      <span className="muted">{r.reason}</span>
                    </Link>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={240}>
                <div className="card">
                  <h3 className="card-title"><Dumbbell size={20} color="var(--lime)" /> Workout tips</h3>
                  <ul className="feature-list">
                    {result.workout_tips?.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              </Reveal>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
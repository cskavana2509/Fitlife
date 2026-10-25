import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { goalLabel } from '../lib/format';
import Reveal from '../components/Reveal';

const GOALS = [
  { value: 'all', label: 'All' },
  { value: 'weight_loss', label: 'Weight loss' },
  { value: 'muscle_gain', label: 'Muscle gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'endurance', label: 'Endurance' },
];

export default function Diet() {
  const [plans, setPlans] = useState([]);
  const [goal, setGoal] = useState('all');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    supabase.from('diet_plans').select('*').order('title')
      .then(({ data }) => setPlans(data ?? []));
  }, []);

  const filtered = useMemo(
    () => plans.filter((p) => goal === 'all' || p.goal === goal),
    [plans, goal],
  );

  // Macro split by calories: protein and carbs = 4 kcal/g, fat = 9 kcal/g
  const split = (p) => {
    const kP = p.protein_g * 4, kC = p.carbs_g * 4, kF = p.fat_g * 9;
    const total = kP + kC + kF || 1;
    return { p: (kP / total) * 100, c: (kC / total) * 100, f: (kF / total) * 100 };
  };

  return (
    <div className="container section" style={{ paddingTop: 20 }}>
      <div className="page-head">
        <span className="eyebrow">Nutrition</span>
        <h1>Diet & <span className="gradient-text">Plans</span></h1>
        <p className="muted">Macro-balanced plans built around your goal.</p>
      </div>

      <div className="toolbar">
        {GOALS.map((g) => (
          <button key={g.value} className={`chip ${goal === g.value ? 'active' : ''}`} onClick={() => setGoal(g.value)}>
            {g.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? <div className="empty">No plans for this goal yet.</div> : (
        <div className="grid">
          {filtered.map((p, i) => {
            const s = split(p);
            return (
              <Reveal key={p.id} delay={(i % 3) * 90}>
                <div className="card" style={{ height: '100%' }}>
                  <span className="badge lime">{goalLabel(p.goal)}</span>
                  <h3 style={{ marginTop: 12 }}>{p.title}</h3>
                  <p className="muted">{p.description}</p>

                  <div className="macros">
                    <div className="macro"><strong>{p.calories}</strong><span className="muted" style={{ fontSize: '.75rem' }}>kcal</span></div>
                    <div className="macro"><strong>{p.protein_g}g</strong><span className="muted" style={{ fontSize: '.75rem' }}>protein</span></div>
                    <div className="macro"><strong>{p.carbs_g}g</strong><span className="muted" style={{ fontSize: '.75rem' }}>carbs</span></div>
                    <div className="macro"><strong>{p.fat_g}g</strong><span className="muted" style={{ fontSize: '.75rem' }}>fat</span></div>
                  </div>

                  <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 18 }}>
                    <span style={{ width: `${s.p}%`, background: '#c6ff3d' }} />
                    <span style={{ width: `${s.c}%`, background: '#22d3ee' }} />
                    <span style={{ width: `${s.f}%`, background: '#ff4d9d' }} />
                  </div>

                  <button className="btn btn-sm" onClick={() => setOpenId(openId === p.id ? null : p.id)}>
                    {openId === p.id ? 'Hide meals' : 'View meals'}
                  </button>

                  {openId === p.id && (
                    <div style={{ marginTop: 18 }} className="fade-up">
                      {p.meals?.map((m) => (
                        <div key={m.meal} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                          <strong style={{ color: 'var(--lime)' }}>{m.meal}</strong>
                          <span className="muted">{m.items.join(' • ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
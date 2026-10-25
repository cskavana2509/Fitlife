import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { inr, initials } from '../lib/format';
import Reveal from '../components/Reveal';

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('trainers')
      .select('*, fitness_centres(name)')
      .eq('is_approved', true)
      .order('experience_years', { ascending: false })
      .then(({ data }) => { setTrainers(data ?? []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => trainers.filter((t) =>
    `${t.display_name} ${t.specialization?.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  ), [trainers, query]);

  return (
    <div className="container section" style={{ paddingTop: 20 }}>
      <div className="page-head">
        <span className="eyebrow">Coaches</span>
        <h1>Certified <span className="gradient-text">Trainers</span></h1>
        <p className="muted">Find the coach who matches your goals and book a session.</p>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <SearchIcon size={18} />
          <input placeholder="Search by name or specialisation…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="grid">{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty">No trainers found yet.</div>
      ) : (
        <div className="grid">
          {filtered.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 90}>
              <Link to={`/trainers/${t.id}`} className="card" style={{ height: '100%' }}>
                <div className="avatar">{initials(t.display_name)}</div>
                <h3>{t.display_name}</h3>
                <p className="muted">{t.fitness_centres?.name ?? 'Independent'} · {t.experience_years} yrs experience</p>
                <div style={{ margin: '14px 0' }}>
                  {t.specialization?.map((s) => <span key={s} className="badge">{s}</span>)}
                </div>
                <div className="price" style={{ fontSize: '1.5rem' }}>
                  {inr(t.hourly_rate_paise)} <small>/ session</small>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
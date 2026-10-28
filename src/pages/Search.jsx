import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, MapPin, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { inr, initials } from '../lib/format';
import Reveal from '../components/Reveal';

// Strip characters with special meaning inside PostgREST .or() filters
const clean = (s) => s.replace(/[,()%*]/g, ' ').trim();
const suggestions = ['Koramangala', 'Yoga', 'Strength', 'Bandra', 'Pilates', 'HIIT'];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [results, setResults] = useState({ query: '', centres: [], trainers: [] });
  const term = clean(q);
  const resultsAreCurrent = results.query === term;
  const centres = resultsAreCurrent ? results.centres : [];
  const trainers = resultsAreCurrent ? results.trainers : [];
  const loading = Boolean(term) && !resultsAreCurrent;

  useEffect(() => {
    const searchTerm = clean(q);
    if (!searchTerm) return;

    let active = true;
    Promise.all([
      supabase.from('fitness_centres').select('*')
        .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
        .limit(12),
      supabase.from('trainers').select('*, fitness_centres(name)')
        .eq('is_approved', true)
        .or(`display_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
        .limit(12),
    ]).then(([c, t]) => {
      if (active) {
        setResults({
          query: searchTerm,
          centres: c.data ?? [],
          trainers: t.data ?? [],
        });
      }
    });
    return () => { active = false; };
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get('q')?.toString().trim() ?? '';
    setParams(value ? { q: value } : {});
  };

  const hasQuery = Boolean(clean(q));
  const none = !loading && hasQuery && centres.length === 0 && trainers.length === 0;

  return (
    <div className="container section" style={{ paddingTop: 20 }}>
      <div className="page-head">
        <span className="eyebrow">Search</span>
        <h1>Find your <span className="gradient-text">perfect match</span></h1>
        <p className="muted">Search centres by name, city or area, and trainers by name or specialty.</p>
      </div>

      <form key={q} onSubmit={submit} className="toolbar" style={{ gap: 8 }}>
        <button className="btn btn-primary" style={{ height: 56 }}>Search <ArrowRight size={16} /></button>
        <div className="search-wrap">
          <SearchIcon size={18} />
          <input name="q" defaultValue={q} placeholder="Try “Koramangala”, “yoga” or a trainer’s name" />
        </div>
      </form>

      {!hasQuery && (
        <div className="row" style={{ marginBottom: 30 }}>
          <span className="muted">Popular:</span>
          {suggestions.map((s) => (
            <button key={s} className="chip" onClick={() => setParams({ q: s })}>{s}</button>
          ))}
        </div>
      )}

      {loading && <div className="grid">{[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}</div>}
      {none && <div className="empty">No results for “{q}”. Try a different word.</div>}

      {!loading && centres.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.6rem', margin: '10px 0 20px' }}>Centres <span className="badge">{centres.length}</span></h2>
          <div className="grid" style={{ marginBottom: 50 }}>
            {centres.map((c, i) => (
              <Reveal key={c.id} delay={(i % 3) * 80}>
                <Link to={`/centres/${c.id}`} className="card">
                  <div className="icon-tile"><MapPin size={22} /></div>
                  <h3>{c.name}</h3>
                  <p className="muted">{c.address}, {c.city}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </>
      )}

      {!loading && trainers.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.6rem', margin: '10px 0 20px' }}>Trainers <span className="badge">{trainers.length}</span></h2>
          <div className="grid" style={{ marginBottom: 50 }}>
            {trainers.map((t, i) => (
              <Reveal key={t.id} delay={(i % 3) * 80}>
                <Link to={`/trainers/${t.id}`} className="card">
                  <div className="avatar">{initials(t.display_name)}</div>
                  <h3>{t.display_name}</h3>
                  <p className="muted">{t.fitness_centres?.name ?? 'Independent'}</p>
                  <div className="price" style={{ fontSize: '1.3rem' }}>
                    {inr(t.hourly_rate_paise)} <small>/ session</small>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
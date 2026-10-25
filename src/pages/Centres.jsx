import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Search as SearchIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Reveal from '../components/Reveal';
import { getCentreImage } from '../lib/centreImages';

export default function Centres() {
  const [centres, setCentres] = useState([]);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('fitness_centres').select('*').order('rating', { ascending: false })
      .then(({ data }) => { setCentres(data ?? []); setLoading(false); });
  }, []);

  const cities = useMemo(() => ['All', ...new Set(centres.map((c) => c.city))], [centres]);

  const filtered = useMemo(() => centres.filter((c) =>
    (city === 'All' || c.city === city) &&
    `${c.name} ${c.city} ${c.amenities?.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  ), [centres, query, city]);

  return (
    <div className="container section" style={{ paddingTop: 20 }}>
      <div className="page-head">
        <span className="eyebrow">Explore</span>
        <h1>Fitness <span className="gradient-text">Centres</span></h1>
        <p className="muted">Discover gyms and studios, then buy a membership in minutes.</p>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <SearchIcon size={18} />
          <input placeholder="Search by name, city or amenity…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="row">
          {cities.map((c) => (
            <button key={c} className={`chip ${city === c ? 'active' : ''}`} onClick={() => setCity(c)}>{c}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid">{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty">No centres match your search.</div>
      ) : (
        <div className="grid">
          {filtered.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 90}>
              <Link to={`/centres/${c.id}`} className="card">
                <span className="badge lime featured-tag"><Star size={12} fill="currentColor" /> {c.rating}</span>
                <img className="cover" src={getCentreImage(c)} alt={c.name} loading="lazy" />
                <h3>{c.name}</h3>
                <p className="muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <MapPin size={16} /> {c.address}, {c.city}
                </p>
                <div style={{ marginTop: 14 }}>
                  {c.amenities?.slice(0, 3).map((a) => <span key={a} className="badge">{a}</span>)}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
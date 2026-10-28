import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Star, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth';
import { startCheckout } from '../lib/payments';
import { inr } from '../lib/format';
import Reveal from '../components/Reveal';
import { getCentreImage } from '../lib/centreImages';

export default function CentreDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [centre, setCentre] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    supabase.from('fitness_centres').select('*').eq('id', id).maybeSingle().then(({ data }) => setCentre(data));
    supabase.from('membership_plans').select('*').eq('centre_id', id).order('price_paise')
      .then(({ data }) => setPlans(data ?? []));
  }, [id]);

  const buy = (plan) => {
    if (!user) return navigate('/login', { state: { from: { pathname: `/centres/${id}` } } });
    setPayingId(plan.id);
    startCheckout({
      kind: 'membership',
      itemId: plan.id,
      user,
      onSuccess: () => { toast.success('Membership activated! 🎉'); navigate('/dashboard'); },
      onError: (msg) => { toast.error(msg); setPayingId(null); },
    });
  };

  if (!centre) return <div className="container section"><div className="skeleton" style={{ height: 420 }} /></div>;

  const bestIndex = plans.length > 2 ? 1 : -1;

  return (
    <div className="container section" style={{ paddingTop: 20 }}>
      <Reveal>
        <div className="card card-lg" style={{ marginBottom: 50, padding: 0 }}>
          <img className="cover" src={getCentreImage(centre)} alt={centre.name} loading="lazy"
            style={{ height: 300, margin: 0, borderRadius: 'var(--radius) var(--radius) 0 0' }} />
          <div style={{ padding: 40 }}>
            <span className="eyebrow">Fitness centre</span>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>{centre.name}</h1>
            <div className="row" style={{ margin: '14px 0 22px', color: 'var(--muted)' }}>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><MapPin size={18} /> {centre.address}, {centre.city}</span>
              <span className="badge lime" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Star size={14} fill="currentColor" /> {centre.rating}
              </span>
            </div>
            <p style={{ maxWidth: 720, marginBottom: 20, color: 'var(--muted)' }}>{centre.description}</p>
            <div>{centre.amenities?.map((a) => <span key={a} className="badge">{a}</span>)}</div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <span className="eyebrow">Pricing</span>
        <h2 className="h2">Membership <span className="gradient-text">plans</span></h2>
      </Reveal>

      {plans.length === 0 ? <div className="empty">No plans published yet.</div> : (
        <div className="grid">
          {plans.map((p, i) => (
            <Reveal key={p.id} delay={i * 100}>
              <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column',
                borderColor: i === bestIndex ? 'rgba(198,255,61,.4)' : undefined }}>
                {i === bestIndex && <span className="badge lime featured-tag">Most popular</span>}
                <span className="badge">{p.duration_days} days</span>
                <h3 style={{ marginTop: 14 }}>{p.name}</h3>
                <div className="price">{inr(p.price_paise)}</div>
                <ul className="feature-list">
                  {p.features?.map((f) => <li key={f}><Check size={14} style={{ display: 'none' }} />{f}</li>)}
                </ul>
                <button className="btn btn-primary btn-block" style={{ marginTop: 'auto' }}
                  disabled={payingId === p.id} onClick={() => buy(p)}>
                  {payingId === p.id ? 'Opening checkout…' : 'Buy membership'}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
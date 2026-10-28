import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDays, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth';
import { startCheckout } from '../lib/payments';
import { inr, initials, fmtDateTime } from '../lib/format';
import Reveal from '../components/Reveal';

export default function TrainerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [slots, setSlots] = useState([]);
  const [payingId, setPayingId] = useState(null);

  const loadSlots = useCallback(() => {
    supabase.from('training_slots').select('*')
      .eq('trainer_id', id).eq('is_booked', false)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .then(({ data }) => setSlots(data ?? []));
  }, [id]);

  useEffect(() => {
    supabase.from('trainers').select('*, fitness_centres(name)').eq('id', id).maybeSingle()
      .then(({ data }) => setTrainer(data));
    loadSlots();
  }, [id, loadSlots]);

  const book = (slot) => {
    if (!user) return navigate('/login', { state: { from: { pathname: `/trainers/${id}` } } });
    setPayingId(slot.id);
    startCheckout({
      kind: 'session',
      itemId: slot.id,
      user,
      onSuccess: () => { toast.success('Session booked! 💪'); navigate('/dashboard'); },
      onError: (msg) => { toast.error(msg); setPayingId(null); loadSlots(); },
    });
  };

  if (!trainer) return <div className="container section"><div className="skeleton" style={{ height: 380 }} /></div>;

  return (
    <div className="container section" style={{ paddingTop: 20 }}>
      <Reveal>
        <div className="card card-lg" style={{ marginBottom: 50, display: 'grid', gap: 12,
          gridTemplateColumns: 'auto 1fr', alignItems: 'center' }}>
          <div className="avatar lg">{initials(trainer.display_name)}</div>
          <div>
            <span className="eyebrow">Personal trainer</span>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>{trainer.display_name}</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              {trainer.fitness_centres?.name ?? 'Independent trainer'} · {trainer.experience_years} years experience
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            {trainer.specialization?.map((s) => <span key={s} className="badge lime">{s}</span>)}
            <p style={{ maxWidth: 680, marginTop: 16, color: 'var(--muted)' }}>{trainer.bio}</p>
            <div className="price">{inr(trainer.hourly_rate_paise)} <small>/ session</small></div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <span className="eyebrow">Availability</span>
        <h2 className="h2" style={{ marginBottom: 24 }}>Open <span className="gradient-text">slots</span></h2>
      </Reveal>

      {slots.length === 0 ? (
        <div className="empty">No open slots right now. Check back soon!</div>
      ) : (
        <div className="slot-grid">
          {slots.map((s, i) => (
            <Reveal key={s.id} delay={(i % 4) * 70}>
              <div className="slot" style={{ height: '100%' }}>
                <strong style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <CalendarDays size={18} color="var(--lime)" /> {fmtDateTime(s.starts_at)}
                </strong>
                <p className="muted" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Clock size={15} /> Ends {fmtDateTime(s.ends_at)}
                </p>
                <button className="btn btn-primary btn-sm btn-block" disabled={payingId === s.id} onClick={() => book(s)}>
                  {payingId === s.id ? 'Opening checkout…' : `Book · ${inr(trainer.hourly_rate_paise)}`}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
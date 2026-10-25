import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarPlus, Trash2, Users, ShieldCheck, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fmtDateTime } from '../lib/format';

export default function TrainerDashboard() {
  const { user } = useAuth();
  const [trainer, setTrainer] = useState(undefined); // undefined = loading
  const [centres, setCentres] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profileForm, setProfileForm] = useState({
    display_name: '', centre_id: '', specialization: '', bio: '', experience_years: 1, rate: 500,
  });
  const [slotForm, setSlotForm] = useState({ starts_at: '', ends_at: '' });

  const loadTrainer = useCallback(async () => {
    const { data } = await supabase.from('trainers').select('*').eq('profile_id', user.id).maybeSingle();
    setTrainer(data ?? null);
  }, [user.id]);

  const loadSlots = useCallback(async (trainerId) => {
    const { data } = await supabase.from('training_slots').select('*')
      .eq('trainer_id', trainerId).order('starts_at');
    setSlots(data ?? []);
  }, []);

  const loadBookings = useCallback(async (trainerId) => {
    const { data } = await supabase.from('bookings')
      .select('*, training_slots(starts_at, ends_at)')
      .eq('trainer_id', trainerId).order('created_at', { ascending: false });
    setBookings(data ?? []);
  }, []);

  useEffect(() => {
    loadTrainer();
    supabase.from('fitness_centres').select('id, name').then(({ data }) => setCentres(data ?? []));
  }, [loadTrainer]);

  useEffect(() => {
    if (!trainer) return;
    loadSlots(trainer.id);
    loadBookings(trainer.id);
  }, [trainer, loadSlots, loadBookings]);

  const createProfile = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('trainers').insert({
      profile_id: user.id,
      display_name: profileForm.display_name,
      centre_id: profileForm.centre_id || null,
      specialization: profileForm.specialization.split(',').map((s) => s.trim()).filter(Boolean),
      bio: profileForm.bio,
      experience_years: Number(profileForm.experience_years),
      hourly_rate_paise: Math.round(Number(profileForm.rate) * 100),
    });
    if (error) return toast.error(error.message);
    toast.success('Profile submitted! An admin will approve it shortly.');
    loadTrainer();
  };

  const addSlot = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('training_slots').insert({
      trainer_id: trainer.id,
      starts_at: new Date(slotForm.starts_at).toISOString(),
      ends_at: new Date(slotForm.ends_at).toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success('Slot published');
    setSlotForm({ starts_at: '', ends_at: '' });
    loadSlots(trainer.id);
  };

  const removeSlot = async (id) => {
    const { error } = await supabase.from('training_slots').delete().eq('id', id);
    if (error) return toast.error(error.message);
    loadSlots(trainer.id);
  };

  if (trainer === undefined) return <div className="center-screen"><div className="spinner" /></div>;

  // Step 1: create trainer profile
  if (trainer === null) {
    return (
      <div className="container" style={{ paddingTop: 20 }}>
        <div className="page-head">
          <span className="eyebrow">Get started</span>
          <h1>Set up your <span className="gradient-text">trainer profile</span></h1>
          <p className="muted">Tell customers who you are and what you offer.</p>
        </div>
        <form className="card card-lg fade-up" style={{ maxWidth: 680, marginBottom: 80 }} onSubmit={createProfile}>
          <div className="field"><label>Display name</label>
            <input required value={profileForm.display_name} onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })} /></div>
          <div className="field"><label>Fitness centre</label>
            <select value={profileForm.centre_id} onChange={(e) => setProfileForm({ ...profileForm, centre_id: e.target.value })}>
              <option value="">Independent</option>
              {centres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="field"><label>Specialisations (comma separated)</label>
            <input placeholder="Strength, HIIT, Yoga" value={profileForm.specialization} onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })} /></div>
          <div className="field"><label>Bio</label>
            <textarea rows={4} value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} /></div>
          <div className="row" style={{ gap: 16 }}>
            <div className="field"><label>Years of experience</label>
              <input type="number" min="0" value={profileForm.experience_years} onChange={(e) => setProfileForm({ ...profileForm, experience_years: e.target.value })} /></div>
            <div className="field"><label>Rate per session (₹)</label>
              <input type="number" min="0" value={profileForm.rate} onChange={(e) => setProfileForm({ ...profileForm, rate: e.target.value })} /></div>
          </div>
          <button className="btn btn-primary">Submit profile</button>
        </form>
      </div>
    );
  }

  // Step 2: manage slots and bookings
  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="page-head">
        <span className="eyebrow">Trainer panel</span>
        <h1>Welcome, <span className="gradient-text">{trainer.display_name}</span></h1>
        <span className={`badge ${trainer.is_approved ? 'ok' : 'warn'}`} style={{ marginTop: 12 }}>
          <ShieldCheck size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
          {trainer.is_approved ? 'Approved · visible to customers' : 'Pending admin approval'}
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', margin: '30px 0' }}>
        <div className="card stat-card"><CalendarPlus size={20} color="#c6ff3d" /><div className="num">{slots.length}</div><span className="muted">Slots published</span></div>
        <div className="card stat-card"><Users size={20} color="#22d3ee" /><div className="num">{bookings.length}</div><span className="muted">Bookings</span></div>
        <div className="card stat-card"><Clock size={20} color="#ff4d9d" /><div className="num">{slots.filter((s) => !s.is_booked).length}</div><span className="muted">Open slots</span></div>
      </div>

      <div className="dash">
        <form className="card" onSubmit={addSlot}>
          <h3 className="card-title"><CalendarPlus size={20} color="#c6ff3d" /> Publish a session slot</h3>
          <div className="field"><label>Starts</label>
            <input type="datetime-local" required value={slotForm.starts_at} onChange={(e) => setSlotForm({ ...slotForm, starts_at: e.target.value })} /></div>
          <div className="field"><label>Ends</label>
            <input type="datetime-local" required value={slotForm.ends_at} onChange={(e) => setSlotForm({ ...slotForm, ends_at: e.target.value })} /></div>
          <button className="btn btn-primary">Add slot</button>
        </form>

        <div className="card">
          <h3 className="card-title">My slots</h3>
          {slots.length === 0 && <div className="empty">No slots yet.</div>}
          {slots.map((s) => (
            <div key={s.id} className="list-item">
              <div>
                <strong>{fmtDateTime(s.starts_at)}</strong>
                <div className="muted">{s.is_booked ? 'Booked' : 'Open'}</div>
              </div>
              {!s.is_booked && (
                <button className="icon-btn" onClick={() => removeSlot(s.id)} aria-label="Remove slot">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="card-title">Bookings</h3>
          {bookings.length === 0 && <div className="empty">No bookings yet.</div>}
          {bookings.map((b) => (
            <div key={b.id} className="list-item">
              <span>{fmtDateTime(b.training_slots?.starts_at)}</span>
              <span className="badge ok">{b.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
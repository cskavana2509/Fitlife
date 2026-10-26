import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, Dumbbell, Phone, UserRound, Receipt } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { inr, fmtDateTime, fmtDate } from '../lib/format';

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contact, setContact] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  // Staff get their own dashboards
  useEffect(() => {
    if (profile?.role === 'admin') navigate('/admin', { replace: true });
    else if (profile?.role === 'coordinator') navigate('/coordinator', { replace: true });
    else if (profile?.role === 'trainer') navigate('/trainer', { replace: true });
  }, [profile, navigate]);

  useEffect(() => {
    if (profile) setContact({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' });
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from('memberships')
      .select('*, membership_plans(name), fitness_centres(name)')
      .eq('user_id', user.id).order('ends_on', { ascending: false })
      .then(({ data }) => setMemberships(data ?? []));

    supabase.from('bookings')
      .select('*, training_slots(starts_at, ends_at, trainers(display_name))')
      .eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setBookings(data ?? []));

    supabase.from('orders').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [user]);

  const saveContact = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: contact.full_name,
      phone: contact.phone,
    }).eq('id', user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Contact details saved');
    refreshProfile();
  };

  const totalSpent = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.amount_paise, 0);
  const activeMemberships = memberships.filter((m) => new Date(m.ends_on) >= new Date()).length;

  if (['admin', 'coordinator', 'trainer'].includes(profile?.role)) return null;

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="page-head">
        <span className="eyebrow">Your space</span>
        <h1>Hi, <span className="gradient-text">{profile?.full_name || 'Athlete'}</span> 👋</h1>
        <p className="muted">Memberships, sessions and payments in one place.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 30 }}>
        <div className="card stat-card"><Dumbbell size={20} color="var(--lime)" /><div className="num">{activeMemberships}</div><span className="muted">Active memberships</span></div>
        <div className="card stat-card"><UserRound size={20} color="var(--lime)" /><div className="num">{bookings.length}</div><span className="muted">Training sessions</span></div>
        <div className="card stat-card"><Receipt size={20} color="var(--lime)" /><div className="num">{inr(totalSpent)}</div><span className="muted">Total paid</span></div>
      </div>

      <div className="dash">
        <div className="card">
          <h3 className="card-title"><Dumbbell size={20} color="var(--lime)" /> Memberships</h3>
          {memberships.length === 0 ? (
            <div className="empty">No memberships yet. <Link to="/centres" style={{ color: 'var(--lime)' }}>Find a centre</Link></div>
          ) : memberships.map((m) => (
            <div key={m.id} className="list-item">
              <div>
                <strong>{m.membership_plans?.name}</strong>
                <div className="muted">{m.fitness_centres?.name}</div>
              </div>
              <span className="badge lime">Until {fmtDate(m.ends_on)}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="card-title"><UserRound size={20} color="var(--lime)" /> Training sessions</h3>
          {bookings.length === 0 ? (
            <div className="empty">No sessions yet. <Link to="/trainers" style={{ color: 'var(--lime)' }}>Book a trainer</Link></div>
          ) : bookings.map((b) => (
            <div key={b.id} className="list-item">
              <div>
                <strong>{b.training_slots?.trainers?.display_name}</strong>
                <div className="muted">{fmtDateTime(b.training_slots?.starts_at)}</div>
              </div>
              <span className="badge ok">{b.status}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="card-title"><CreditCard size={20} color="var(--lime)" /> Payment history</h3>
          {orders.length === 0 ? <div className="empty">No payments yet.</div> : orders.map((o) => (
            <div key={o.id} className="list-item">
              <div>
                <strong style={{ textTransform: 'capitalize' }}>{o.kind}</strong>
                <div className="muted">{fmtDateTime(o.created_at)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>{inr(o.amount_paise)}</strong>
                <div><span className={`badge ${o.status === 'paid' ? 'ok' : 'warn'}`}>{o.status}</span></div>
              </div>
            </div>
          ))}
        </div>

        <form className="card" onSubmit={saveContact}>
          <h3 className="card-title"><Phone size={20} color="var(--lime)" /> Contact details</h3>
          <p className="muted" style={{ marginBottom: 18 }}>Used for booking confirmations by email, SMS and WhatsApp.</p>
          <div className="field"><label>Full name</label>
            <input value={contact.full_name} onChange={(e) => setContact({ ...contact, full_name: e.target.value })} /></div>
          <div className="field"><label>Mobile number</label>
            <input type="tel" placeholder="+919876543210" value={contact.phone}
              onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button>
        </form>
      </div>
    </div>
  );
}
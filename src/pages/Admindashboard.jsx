import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Building2, ListChecks, Users, Wallet, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { inr, fmtDate } from '../lib/format';

const TABS = [
  { key: 'overview', label: 'Overview', icon: Wallet },
  { key: 'trainers', label: 'Trainers', icon: CheckCircle2 },
  { key: 'centres', label: 'Centres', icon: Building2 },
  { key: 'plans', label: 'Plans', icon: ListChecks },
  { key: 'users', label: 'Users', icon: Users },
];

const emptyCentre = { name: '', city: '', address: '', description: '', amenities: '' };
const emptyPlan = { centre_id: '', name: '', duration_days: 30, price_rupees: 1999, features: '' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({ revenue: 0, members: 0, bookings: 0, trainers: 0 });
  const [trainers, setTrainers] = useState([]);
  const [centres, setCentres] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [centreForm, setCentreForm] = useState(emptyCentre);
  const [planForm, setPlanForm] = useState(emptyPlan);

  const loadAll = useCallback(async () => {
    const [t, c, p, u, o, m, b] = await Promise.all([
      supabase.from('trainers').select('*, fitness_centres(name)').order('created_at', { ascending: false }),
      supabase.from('fitness_centres').select('*').order('name'),
      supabase.from('membership_plans').select('*, fitness_centres(name)').order('name'),
      supabase.from('profiles').select('id, full_name, role, phone, created_at').order('created_at', { ascending: false }),
      supabase.from('orders').select('amount_paise, status'),
      supabase.from('memberships').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
    ]);
    setTrainers(t.data ?? []);
    setCentres(c.data ?? []);
    setPlans(p.data ?? []);
    setUsers(u.data ?? []);
    setStats({
      revenue: (o.data ?? []).filter((x) => x.status === 'paid').reduce((s, x) => s + x.amount_paise, 0),
      members: m.count ?? 0,
      bookings: b.count ?? 0,
      trainers: (t.data ?? []).filter((x) => x.is_approved).length,
    });
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const approve = async (id) => {
    const { error } = await supabase.from('trainers').update({ is_approved: true }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Trainer approved');
    loadAll();
  };

  const addCentre = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('fitness_centres').insert({
      name: centreForm.name,
      city: centreForm.city,
      address: centreForm.address,
      description: centreForm.description,
      amenities: centreForm.amenities.split(',').map((s) => s.trim()).filter(Boolean),
    });
    if (error) return toast.error(error.message);
    toast.success('Centre added');
    setCentreForm(emptyCentre);
    loadAll();
  };

  const addPlan = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('membership_plans').insert({
      centre_id: planForm.centre_id,
      name: planForm.name,
      duration_days: Number(planForm.duration_days),
      price_paise: Math.round(Number(planForm.price_rupees) * 100),
      features: planForm.features.split(',').map((s) => s.trim()).filter(Boolean),
    });
    if (error) return toast.error(error.message);
    toast.success('Plan added');
    setPlanForm(emptyPlan);
    loadAll();
  };

  const pending = trainers.filter((t) => !t.is_approved);

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="page-head">
        <span className="eyebrow">Admin</span>
        <h1>Control <span className="gradient-text">room</span></h1>
      </div>

      <div className="tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`chip ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            <Icon size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            {label}
            {key === 'trainers' && pending.length > 0 && <span className="badge warn" style={{ margin: '0 0 0 8px', padding: '1px 8px' }}>{pending.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="card stat-card"><span className="muted">Revenue collected</span><div className="num">{inr(stats.revenue)}</div></div>
          <div className="card stat-card"><span className="muted">Memberships sold</span><div className="num">{stats.members}</div></div>
          <div className="card stat-card"><span className="muted">Sessions booked</span><div className="num">{stats.bookings}</div></div>
          <div className="card stat-card"><span className="muted">Approved trainers</span><div className="num">{stats.trainers}</div></div>
        </div>
      )}

      {tab === 'trainers' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Centre</th><th>Rate</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {trainers.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.display_name}</strong></td>
                  <td className="muted">{t.fitness_centres?.name ?? 'Independent'}</td>
                  <td>{inr(t.hourly_rate_paise)}</td>
                  <td><span className={`badge ${t.is_approved ? 'ok' : 'warn'}`}>{t.is_approved ? 'Approved' : 'Pending'}</span></td>
                  <td>{!t.is_approved && <button className="btn btn-primary btn-sm" onClick={() => approve(t.id)}>Approve</button>}</td>
                </tr>
              ))}
              {trainers.length === 0 && <tr><td colSpan={5} className="muted">No trainer applications yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'centres' && (
        <div className="dash">
          <form className="card" onSubmit={addCentre}>
            <h3 className="card-title"><Plus size={18} color="var(--lime)" /> Add a centre</h3>
            <div className="field"><label>Name</label>
              <input required value={centreForm.name} onChange={(e) => setCentreForm({ ...centreForm, name: e.target.value })} /></div>
            <div className="field"><label>City</label>
              <input required value={centreForm.city} onChange={(e) => setCentreForm({ ...centreForm, city: e.target.value })} /></div>
            <div className="field"><label>Address</label>
              <input value={centreForm.address} onChange={(e) => setCentreForm({ ...centreForm, address: e.target.value })} /></div>
            <div className="field"><label>Description</label>
              <textarea rows={3} value={centreForm.description} onChange={(e) => setCentreForm({ ...centreForm, description: e.target.value })} /></div>
            <div className="field"><label>Amenities (comma separated)</label>
              <input value={centreForm.amenities} onChange={(e) => setCentreForm({ ...centreForm, amenities: e.target.value })} /></div>
            <button className="btn btn-primary">Save centre</button>
          </form>
          <div className="card">
            <h3 className="card-title">All centres</h3>
            {centres.map((c) => (
              <div key={c.id} className="list-item">
                <div><strong>{c.name}</strong><div className="muted">{c.city} · ★ {c.rating}</div></div>
                <span className="badge">{c.amenities?.length ?? 0} amenities</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div className="dash">
          <form className="card" onSubmit={addPlan}>
            <h3 className="card-title"><Plus size={18} color="var(--lime)" /> Add a membership plan</h3>
            <div className="field"><label>Centre</label>
              <select required value={planForm.centre_id} onChange={(e) => setPlanForm({ ...planForm, centre_id: e.target.value })}>
                <option value="">Select a centre</option>
                {centres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div className="field"><label>Plan name</label>
              <input required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} /></div>
            <div className="row" style={{ gap: 14 }}>
              <div className="field"><label>Duration (days)</label>
                <input type="number" min="1" value={planForm.duration_days} onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })} /></div>
              <div className="field"><label>Price (₹)</label>
                <input type="number" min="1" value={planForm.price_rupees} onChange={(e) => setPlanForm({ ...planForm, price_rupees: e.target.value })} /></div>
            </div>
            <div className="field"><label>Features (comma separated)</label>
              <input value={planForm.features} onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })} /></div>
            <button className="btn btn-primary">Save plan</button>
          </form>
          <div className="card">
            <h3 className="card-title">All plans</h3>
            {plans.map((p) => (
              <div key={p.id} className="list-item">
                <div><strong>{p.name}</strong><div className="muted">{p.fitness_centres?.name} · {p.duration_days} days</div></div>
                <strong>{inr(p.price_paise)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Joined</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.full_name || '—'}</strong></td>
                  <td><span className="badge">{u.role}</span></td>
                  <td className="muted">{u.phone || '—'}</td>
                  <td className="muted">{fmtDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
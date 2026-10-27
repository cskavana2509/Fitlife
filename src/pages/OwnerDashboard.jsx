import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Plus, CheckCircle2, Clock, Dumbbell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { inr } from '../lib/format';

const emptyCentre = { name: '', city: '', address: '', description: '', amenities: '', image_url: '' };
const emptyPlan = { name: '', duration_days: 30, price_rupees: 1999, features: '' };

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [centres, setCentres] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [centreForm, setCentreForm] = useState(emptyCentre);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [loading, setLoading] = useState(true);

  const loadCentres = useCallback(async () => {
    const { data } = await supabase
      .from('fitness_centres')
      .select('*')
      .eq('owner_id', user.id)
      .order('name');
    setCentres(data ?? []);
    setLoading(false);
    return data ?? [];
  }, [user.id]);

  const loadPlans = useCallback(async (centreId) => {
    const { data } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('centre_id', centreId)
      .order('price_paise');
    setPlans(data ?? []);
  }, []);

  useEffect(() => {
    loadCentres().then((list) => {
      if (list.length) setSelected(list[0].id);
    });
  }, [loadCentres]);

  useEffect(() => {
    if (selected) loadPlans(selected);
    else setPlans([]);
  }, [selected, loadPlans]);

  const addCentre = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from('fitness_centres').insert({
      owner_id: user.id,
      name: centreForm.name,
      city: centreForm.city,
      address: centreForm.address,
      description: centreForm.description,
      amenities: centreForm.amenities.split(',').map((s) => s.trim()).filter(Boolean),
      image_url: centreForm.image_url || null,
      rating: 4.5,
    }).select().single();

    if (error) return toast.error(error.message);
    toast.success('Centre submitted. It will appear once an admin approves it.');
    setCentreForm(emptyCentre);
    await loadCentres();
    setSelected(data.id);
  };

  const addPlan = async (e) => {
    e.preventDefault();
    if (!selected) return toast.error('Add a centre first');
    const { error } = await supabase.from('membership_plans').insert({
      centre_id: selected,
      name: planForm.name,
      duration_days: Number(planForm.duration_days),
      price_paise: Math.round(Number(planForm.price_rupees) * 100),
      features: planForm.features.split(',').map((s) => s.trim()).filter(Boolean),
    });
    if (error) return toast.error(error.message);
    toast.success('Plan added');
    setPlanForm(emptyPlan);
    loadPlans(selected);
  };

  const current = centres.find((c) => c.id === selected);

  if (loading) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="page-head">
        <span className="eyebrow">Centre owner</span>
        <h1>Your <span className="gradient-text">centres</span></h1>
        <p className="muted">Add your gym or studio, then publish membership plans once an admin approves it.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 30 }}>
        <div className="card stat-card"><Building2 size={20} color="#c6ff3d" /><div className="num">{centres.length}</div><span className="muted">Your centres</span></div>
        <div className="card stat-card"><CheckCircle2 size={20} color="#22d3ee" /><div className="num">{centres.filter((c) => c.is_approved).length}</div><span className="muted">Live</span></div>
        <div className="card stat-card"><Clock size={20} color="#ff4d9d" /><div className="num">{centres.filter((c) => !c.is_approved).length}</div><span className="muted">Pending approval</span></div>
      </div>

      <div className="dash">
        <form className="card" onSubmit={addCentre}>
          <h3 className="card-title"><Plus size={18} color="#c6ff3d" /> Add a centre</h3>
          <div className="field"><label>Centre name</label>
            <input required value={centreForm.name} onChange={(e) => setCentreForm({ ...centreForm, name: e.target.value })} /></div>
          <div className="field"><label>City</label>
            <input required value={centreForm.city} onChange={(e) => setCentreForm({ ...centreForm, city: e.target.value })} /></div>
          <div className="field"><label>Address</label>
            <input value={centreForm.address} onChange={(e) => setCentreForm({ ...centreForm, address: e.target.value })} /></div>
          <div className="field"><label>Description</label>
            <textarea rows={3} value={centreForm.description} onChange={(e) => setCentreForm({ ...centreForm, description: e.target.value })} /></div>
          <div className="field"><label>Amenities (comma separated)</label>
            <input placeholder="Free weights, Sauna, Cardio deck" value={centreForm.amenities} onChange={(e) => setCentreForm({ ...centreForm, amenities: e.target.value })} /></div>
          <div className="field"><label>Image URL (optional)</label>
            <input value={centreForm.image_url} onChange={(e) => setCentreForm({ ...centreForm, image_url: e.target.value })} /></div>
          <button className="btn btn-primary btn-block">Submit for approval</button>
        </form>

        <div className="card">
          <h3 className="card-title"><Building2 size={18} color="#22d3ee" /> My centres</h3>
          {centres.length === 0 && <div className="empty">You have not added a centre yet.</div>}
          {centres.map((c) => (
            <button
              key={c.id}
              className="list-item"
              onClick={() => setSelected(c.id)}
              style={{ width: '100%', background: 'none', border: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer',
                outline: selected === c.id ? '1px solid var(--lime)' : 'none', borderRadius: 14, padding: '14px 12px' }}
            >
              <div>
                <strong>{c.name}</strong>
                <div className="muted">{c.city}</div>
              </div>
              <span className={`badge ${c.is_approved ? 'ok' : 'warn'}`}>
                {c.is_approved ? 'Live' : 'Pending'}
              </span>
            </button>
          ))}
        </div>

        <div className="card">
          <h3 className="card-title"><Dumbbell size={18} color="#ff4d9d" /> Plans for {current?.name ?? 'your centre'}</h3>
          {!current && <div className="empty">Select or add a centre first.</div>}

          {current && (
            <>
              {plans.length === 0 && <div className="empty" style={{ marginBottom: 16 }}>No plans yet.</div>}
              {plans.map((p) => (
                <div key={p.id} className="list-item">
                  <div>
                    <strong>{p.name}</strong>
                    <div className="muted">{p.duration_days} days</div>
                  </div>
                  <strong>{inr(p.price_paise)}</strong>
                </div>
              ))}

              <form onSubmit={addPlan} style={{ marginTop: 20 }}>
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
                <button className="btn btn-primary btn-block">Add plan</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, Dumbbell, CalendarCheck, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { inr, fmtDateTime, fmtDate } from '../lib/format';

export default function CoordinatorDashboard() {
  const [tab, setTab] = useState('memberships');
  const [memberships, setMemberships] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    supabase.from('memberships')
      .select('*, membership_plans(name), fitness_centres(name), profiles(full_name, phone)')
      .order('starts_on', { ascending: false })
      .then(({ data }) => setMemberships(data ?? []));

    supabase.from('bookings')
      .select('*, training_slots(starts_at, trainers(display_name)), profiles(full_name, phone)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setBookings(data ?? []));

    supabase.from('orders').select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, []);

  const q = query.toLowerCase();
  const matches = useCallback((text) => (text ?? '').toLowerCase().includes(q), [q]);

  const rows = useMemo(() => ({
    memberships: memberships.filter((m) => matches(m.profiles?.full_name) || matches(m.fitness_centres?.name)),
    bookings: bookings.filter((b) => matches(b.profiles?.full_name) || matches(b.training_slots?.trainers?.display_name)),
    orders: orders.filter((o) => matches(o.profiles?.full_name) || matches(o.kind)),
  }), [memberships, bookings, orders, matches]);

  const revenue = orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.amount_paise, 0);

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="page-head">
        <span className="eyebrow">Coordinator</span>
        <h1>Daily <span className="gradient-text">operations</span></h1>
        <p className="muted">Track memberships, sessions and payments across all centres.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 30 }}>
        <div className="card stat-card"><Dumbbell size={20} color="var(--lime)" /><div className="num">{memberships.length}</div><span className="muted">Memberships</span></div>
        <div className="card stat-card"><CalendarCheck size={20} color="var(--lime)" /><div className="num">{bookings.length}</div><span className="muted">Session bookings</span></div>
        <div className="card stat-card"><Wallet size={20} color="var(--lime)" /><div className="num">{inr(revenue)}</div><span className="muted">Revenue collected</span></div>
      </div>

      <div className="toolbar">
        <div className="tabs" style={{ marginBottom: 0 }}>
          {['memberships', 'bookings', 'orders'].map((t) => (
            <button key={t} className={`chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>
        <div className="search-wrap">
          <SearchIcon size={18} />
          <input placeholder="Filter by customer, centre or trainer…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {tab === 'memberships' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Plan</th><th>Centre</th><th>Starts</th><th>Ends</th></tr></thead>
            <tbody>
              {rows.memberships.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.profiles?.full_name || '—'}</strong><div className="muted">{m.profiles?.phone}</div></td>
                  <td>{m.membership_plans?.name}</td>
                  <td className="muted">{m.fitness_centres?.name}</td>
                  <td>{fmtDate(m.starts_on)}</td>
                  <td><span className="badge lime">{fmtDate(m.ends_on)}</span></td>
                </tr>
              ))}
              {rows.memberships.length === 0 && <tr><td colSpan={5} className="muted">No memberships found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Trainer</th><th>Session</th><th>Status</th></tr></thead>
            <tbody>
              {rows.bookings.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.profiles?.full_name || '—'}</strong><div className="muted">{b.profiles?.phone}</div></td>
                  <td>{b.training_slots?.trainers?.display_name}</td>
                  <td>{fmtDateTime(b.training_slots?.starts_at)}</td>
                  <td><span className="badge ok">{b.status}</span></td>
                </tr>
              ))}
              {rows.bookings.length === 0 && <tr><td colSpan={4} className="muted">No bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {rows.orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.profiles?.full_name || '—'}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{o.kind}</td>
                  <td>{inr(o.amount_paise)}</td>
                  <td className="muted">{fmtDateTime(o.created_at)}</td>
                  <td><span className={`badge ${o.status === 'paid' ? 'ok' : 'warn'}`}>{o.status}</span></td>
                </tr>
              ))}
              {rows.orders.length === 0 && <tr><td colSpan={5} className="muted">No payments found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
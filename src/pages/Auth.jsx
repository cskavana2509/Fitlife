import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Dumbbell, UserRound, Building2, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Auth({ mode }) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'customer' });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = isSignup
      ? await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.full_name, role: form.role } },
        })
      : await supabase.auth.signInWithPassword({ email: form.email, password: form.password });

    setLoading(false);
    if (error) return toast.error(error.message);

    // With "Confirm email" enabled, signUp returns no session until the link is clicked
    if (isSignup && !data.session) {
      setSentTo(form.email);
      return;
    }

    toast.success(isSignup ? 'Account created! Welcome to FitLife.' : 'Welcome back!');
    navigate(location.state?.from?.pathname || '/dashboard');
  };

  if (sentTo) {
    return (
      <div className="container auth-split">
        <div className="card auth-card fade-up" style={{ textAlign: 'center' }}>
          <div className="icon-tile" style={{ margin: '0 auto 18px' }}><Mail size={24} /></div>
          <h2>Check your inbox</h2>
          <p className="muted" style={{ margin: '12px 0 26px' }}>
            We sent a verification link to <strong style={{ color: 'var(--text)' }}>{sentTo}</strong>. Click it to activate your account.
          </p>
          <Link to="/login" className="btn btn-primary btn-block">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container auth-split">
      <div className="auth-brand fade-up">
        <span className="pill"><span className="dot" /> {isSignup ? 'Join FitLife' : 'Welcome back'}</span>
        <h2>
          {isSignup
            ? <>Start your <span className="gradient-text">transformation</span>.</>
            : <>Pick up where you <span className="gradient-text">left off</span>.</>}
        </h2>
        <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 14, maxWidth: 420 }}>
          <div className="card" style={{ padding: 20 }}>
            <Building2 size={20} color="#c6ff3d" /> <strong>Centres near you</strong>
            <p className="muted">Compare memberships and amenities.</p>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <UserRound size={20} color="#22d3ee" /> <strong>Book a trainer</strong>
            <p className="muted">Pick a slot and pay securely.</p>
          </div>
        </div>
      </div>

      <form className="card auth-card fade-up" onSubmit={submit}>
        <div className="icon-tile" style={{ marginBottom: 16 }}><Dumbbell size={24} /></div>
        <h2>{isSignup ? 'Create account' : 'Log in'}</h2>
        <p className="muted" style={{ marginBottom: 24 }}>
          {isSignup ? 'Join as a customer, trainer or centre owner.' : 'Log in to manage your bookings.'}
        </p>

        {isSignup && (
          <>
            <div className="toggle">
              <button type="button" className={`chip ${form.role === 'customer' ? 'active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, role: 'customer' }))}>Customer</button>
              <button type="button" className={`chip ${form.role === 'trainer' ? 'active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, role: 'trainer' }))}>Trainer</button>
              <button type="button" className={`chip ${form.role === 'centre_owner' ? 'active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, role: 'centre_owner' }))}>Centre owner</button>
            </div>
            <div className="field">
              <label>Full name</label>
              <input required value={form.full_name} onChange={update('full_name')} placeholder="Aarav Sharma" />
            </div>
          </>
        )}

        <div className="field">
          <label>Email</label>
          <input type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
        </div>

        <div className="field">
          <label>Password</label>
          <input type="password" required minLength={6} value={form.password} onChange={update('password')} placeholder="••••••••" />
        </div>

        {!isSignup && (
          <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 14 }}>
            <Link to="/forgot-password" style={{ color: 'var(--lime)', fontSize: '.85rem', fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>
        )}

        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </button>

        <p className="muted" style={{ textAlign: 'center', marginTop: 22 }}>
          {isSignup ? 'Already have an account? ' : 'New to FitLife? '}
          <Link to={isSignup ? '/login' : '/signup'} style={{ color: 'var(--lime)', fontWeight: 600 }}>
            {isSignup ? 'Log in' : 'Sign up'}
          </Link>
        </p>
      </form>
    </div>
  );
}
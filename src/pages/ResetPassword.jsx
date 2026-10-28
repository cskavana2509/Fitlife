import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase reads the recovery token from the link and signs the user in for this page
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setInvalid(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Use at least 6 characters');

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) return toast.error(error.message);

    toast.success('Password updated. Please log in with your new password.');
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (invalid) {
    return (
      <div className="container auth-split">
        <div className="card auth-card fade-up" style={{ textAlign: 'center' }}>
          <h2>Link expired</h2>
          <p className="muted" style={{ margin: '12px 0 26px' }}>
            This reset link is no longer valid. Request a new one.
          </p>
          <button className="btn btn-primary btn-block" onClick={() => navigate('/forgot-password')}>
            Request a new link
          </button>
        </div>
      </div>
    );
  }

  if (!ready) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div className="container auth-split">
      <div className="auth-brand fade-up">
        <span className="pill"><span className="dot" /> Secure reset</span>
        <h2>Choose a <span className="gradient-text">new password</span>.</h2>
      </div>

      <form className="card auth-card fade-up" onSubmit={submit}>
        <div className="icon-tile" style={{ marginBottom: 16 }}><ShieldCheck size={24} /></div>
        <h2>New password</h2>
        <p className="muted" style={{ marginBottom: 24 }}>Use at least 6 characters.</p>

        <div className="field">
          <label>New password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="field">
          <label>Confirm password</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
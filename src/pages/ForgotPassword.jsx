import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) return toast.error(error.message);

    // Same message whether or not the account exists, so emails can't be checked
    setSentTo(email);
  };

  if (sentTo) {
    return (
      <div className="container auth-split">
        <div className="card auth-card fade-up" style={{ textAlign: 'center' }}>
          <div className="icon-tile" style={{ margin: '0 auto 18px' }}><Mail size={24} /></div>
          <h2>Check your inbox</h2>
          <p className="muted" style={{ margin: '12px 0 26px' }}>
            If an account exists for <strong style={{ color: 'var(--text)' }}>{sentTo}</strong>, we have sent a link to reset your password.
          </p>
          <Link to="/login" className="btn btn-primary btn-block">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container auth-split">
      <div className="auth-brand fade-up">
        <span className="pill"><span className="dot" /> Account recovery</span>
        <h2>Forgot your <span className="gradient-text">password</span>?</h2>
        <p className="muted" style={{ maxWidth: 420 }}>
          Enter the email you signed up with, and we will send you a link to choose a new password.
        </p>
      </div>

      <form className="card auth-card fade-up" onSubmit={submit}>
        <div className="icon-tile" style={{ marginBottom: 16 }}><KeyRound size={24} /></div>
        <h2>Reset password</h2>
        <p className="muted" style={{ marginBottom: 24 }}>We will email you a reset link.</p>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>

        <p className="muted" style={{ textAlign: 'center', marginTop: 22 }}>
          Remembered it?{' '}
          <Link to="/login" style={{ color: 'var(--lime)', fontWeight: 600 }}>Log in</Link>
        </p>
      </form>
    </div>
  );
}
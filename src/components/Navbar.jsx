import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Utensils,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/auth';

const publicLinks = [
  { to: '/centres', label: 'Centres', icon: Building2 },
  { to: '/trainers', label: 'Trainers', icon: Users },
  { to: '/diet', label: 'Diet', icon: Utensils },
  { to: '/search', label: 'Search', icon: Search },
];

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const role = profile?.role ?? 'customer';

  const roleLinks = !user ? [] : [
    ...(role === 'customer' ? [{ to: '/recommendations', label: 'AI Picks', icon: Sparkles }] : []),
    ...(role === 'trainer' ? [{ to: '/trainer', label: 'Trainer Panel', icon: Users }] : []),
    ...(role === 'centre_owner' ? [{ to: '/owner', label: 'My Centres', icon: Building2 }] : []),
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
    ...(role === 'coordinator' ? [{ to: '/coordinator', label: 'Coordinator', icon: CalendarDays }] : []),
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const links = [...publicLinks, ...roleLinks];

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    toast.success('Signed out');
    navigate('/');
  };

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        aria-controls="main-navigation"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <button
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={`nav-sidebar ${open ? 'open' : ''}`} id="main-navigation">
        <Link to="/" className="logo" onClick={() => setOpen(false)}>
          <span className="icon-tile" style={{ width: 36, height: 36, borderRadius: 12, margin: 0 }}>
            <Dumbbell size={18} />
          </span>
          Fit<span>Life</span>
        </Link>

        <nav className="sidebar-links" aria-label="Main navigation">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <l.icon size={18} aria-hidden="true" />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-account">
          {user ? (
            <button className="sidebar-link" onClick={handleSignOut}>
              <LogOut size={18} aria-hidden="true" /> Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="sidebar-link sidebar-signin"
              onClick={() => setOpen(false)}
            >
              <LogOut size={18} aria-hidden="true" /> Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
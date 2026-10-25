import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, Menu, X, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const publicLinks = [
  { to: '/centres', label: 'Centres' },
  { to: '/trainers', label: 'Trainers' },
  { to: '/diet', label: 'Diet' },
  { to: '/search', label: 'Search' },
];

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  // Close the mobile menu when the page changes
  useEffect(() => setOpen(false), [pathname]);

  const role = profile?.role ?? 'customer';

  // Links shown only to logged-in users, based on their role
  const roleLinks = !user ? [] : [
    ...(role === 'customer' ? [{ to: '/recommendations', label: 'AI Picks' }] : []),
    ...(role === 'trainer' ? [{ to: '/trainer', label: 'Trainer Panel' }] : []),
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
    ...(role === 'coordinator' ? [{ to: '/coordinator', label: 'Coordinator' }] : []),
    { to: '/dashboard', label: 'Dashboard' },
  ];

  const links = [...publicLinks, ...roleLinks];

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="logo">
          <span className="icon-tile" style={{ width: 36, height: 36, borderRadius: 12, margin: 0 }}>
            <Dumbbell size={18} />
          </span>
          Fit<span>Life</span>
        </Link>

        <nav className="nav-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}

          {user ? (
            <button className="btn btn-sm" onClick={handleSignOut} style={{ marginLeft: 6 }}>
              <LogOut size={15} /> Sign out
            </button>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm" style={{ marginLeft: 6 }}>
              Get started
            </Link>
          )}
        </nav>

        <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div className={`nav-mobile ${open ? 'open' : ''}`}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {l.label}
          </NavLink>
        ))}

        {user ? (
          <button className="btn btn-sm" onClick={handleSignOut}>Sign out</button>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">Get started</Link>
        )}
      </div>
    </header>
  );
}
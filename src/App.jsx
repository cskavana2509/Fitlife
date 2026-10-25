import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Centres from './pages/Centres';
import CentreDetail from './pages/CentreDetail';
import Trainers from './pages/Trainers';
import TrainerDetail from './pages/TrainerDetail';
import Diet from './pages/Diet';
import Search from './pages/Search';
import Recommendations from './pages/Recommendations';
import Dashboard from './pages/Dashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';

export default function App() {
  const { pathname } = useLocation();
  const activeCard = useRef(null);

  useEffect(() => {
    activeCard.current = null;
  }, [pathname]);

  const handleCardPointerMove = (event) => {
    if (event.pointerType === 'touch' || !(event.target instanceof Element)) return;

    const card = event.target.closest('.card');
    if (!card) return;

    if (activeCard.current && activeCard.current !== card) {
      activeCard.current.style.removeProperty('--tilt-x');
      activeCard.current.style.removeProperty('--tilt-y');
      activeCard.current.classList.remove('is-tilting');
    }

    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    card.style.setProperty('--tilt-x', `${(x - 0.5) * 7}deg`);
    card.style.setProperty('--tilt-y', `${(0.5 - y) * 7}deg`);
    card.style.setProperty('--mx', `${x * bounds.width}px`);
    card.style.setProperty('--my', `${y * bounds.height}px`);
    card.classList.add('is-tilting');
    activeCard.current = card;
  };

  const handleCardPointerOut = (event) => {
    if (!(event.target instanceof Element)) return;

    const card = event.target.closest('.card');
    const nextCard = event.relatedTarget instanceof Element
      ? event.relatedTarget.closest('.card')
      : null;

    if (!card || card === nextCard) return;

    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
    card.classList.remove('is-tilting');
    if (activeCard.current === card) activeCard.current = null;
  };

  return (
    <>
      <div className="aurora" />
      <div className="grain" />
      <Navbar />
      {/* key=pathname replays the enter animation on every route change */}
      <main
        key={pathname}
        className="page-enter"
        onPointerMove={handleCardPointerMove}
        onPointerOut={handleCardPointerOut}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/centres" element={<Centres />} />
          <Route path="/centres/:id" element={<CentreDetail />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/trainers/:id" element={<TrainerDetail />} />
          <Route path="/diet" element={<Diet />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />

          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/trainer" element={<RoleRoute roles={['trainer']}><TrainerDashboard /></RoleRoute>} />
          <Route path="/admin" element={<RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>} />
          <Route path="/coordinator" element={<RoleRoute roles={['coordinator', 'admin']}><CoordinatorDashboard /></RoleRoute>} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span className="logo">Fit<span>Life</span></span>
          <span className="muted">© {new Date().getFullYear()} · Find centres, book trainers, eat smarter.</span>
        </div>
      </footer>
    </>
  );
}
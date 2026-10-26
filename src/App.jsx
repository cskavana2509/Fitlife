import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import ChatBot from './components/ChatBot';
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

  return (
    <>
      <div className="aurora" />
      <div className="grain" />
      <Navbar />

      <div className="app-content">
        {/* key=pathname replays the page animation on every route change */}
        <main key={pathname} className="page-enter">
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<Home />} />
            <Route path="/centres" element={<Centres />} />
            <Route path="/centres/:id" element={<CentreDetail />} />
            <Route path="/trainers" element={<Trainers />} />
            <Route path="/trainers/:id" element={<TrainerDetail />} />
            <Route path="/diet" element={<Diet />} />
            <Route path="/search" element={<Search />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/signup" element={<Auth mode="signup" />} />

            {/* Logged-in customers */}
            <Route
              path="/recommendations"
              element={<ProtectedRoute><Recommendations /></ProtectedRoute>}
            />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />

            {/* Role-restricted pages */}
            <Route
              path="/trainer"
              element={<RoleRoute roles={['trainer']}><TrainerDashboard /></RoleRoute>}
            />
            <Route
              path="/admin"
              element={<RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>}
            />
            <Route
              path="/coordinator"
              element={<RoleRoute roles={['coordinator', 'admin']}><CoordinatorDashboard /></RoleRoute>}
            />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container footer-inner">
            <span className="logo">Fit<span>Life</span></span>
            <span className="muted">© {new Date().getFullYear()} · Find centres, book trainers, eat smarter.</span>
          </div>
        </footer>
      </div>

      {/* FitBot chat button and panel, shown on every page */}
      <ChatBot />
    </>
  );
}
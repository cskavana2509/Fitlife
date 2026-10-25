import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, UserRound, Salad, Sparkles, MapPin, Star, Zap, ShieldCheck, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Reveal from '../components/Reveal';

const features = [
  { icon: Building2, title: 'Find fitness centres', text: 'Compare gyms by location, amenities and membership plans.', to: '/centres', span: 'wide' },
  { icon: UserRound, title: 'Book certified trainers', text: 'Pick a coach and reserve a session slot in seconds.', to: '/trainers' },
  { icon: Salad, title: 'Diet & nutrition', text: 'Macro-balanced plans for every goal.', to: '/diet' },
  { icon: Sparkles, title: 'AI recommendations', text: 'Personalised centres and diets from your profile.', to: '/recommendations', span: 'wide' },
];

const tags = ['Gyms', 'Personal trainers', 'Diet plans', 'AI picks', 'Instant booking', 'Secure payments', 'WhatsApp alerts'];

export default function Home() {
  const [centres, setCentres] = useState([]);

  useEffect(() => {
    supabase.from('fitness_centres').select('*').order('rating', { ascending: false }).limit(3)
      .then(({ data }) => setCentres(data ?? []));
  }, []);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <>
      <section className="hero">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="container hero-inner">
          <Reveal><span className="pill"><span className="dot" /> Fitness, booked in one place</span></Reveal>
          <Reveal delay={120}>
            <h1>Train smarter. <span className="gradient-text">Book faster.</span> Live stronger.</h1>
          </Reveal>
          <Reveal delay={240}>
            <p>FitLife connects you with the right fitness centre, a trainer you trust and a diet plan that fits your goals, all in one place.</p>
          </Reveal>
          <Reveal delay={360}>
            <div className="hero-actions">
              <Link to="/centres" className="btn btn-primary">Explore centres <ArrowRight size={18} /></Link>
              <Link to="/trainers" className="btn">Find a trainer</Link>
            </div>
          </Reveal>
          <Reveal delay={480}>
            <div className="stats">
              <div><strong>3+</strong><span className="muted">Partner centres</span></div>
              <div><strong>24/7</strong><span className="muted">Online booking</span></div>
              <div><strong>Secure</strong><span className="muted">Razorpay payments</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="marquee">
        <div className="marquee-track">
          {[...tags, ...tags].map((t, i) => <span key={i}>✦ {t}</span>)}
        </div>
      </div>

      <section className="section container">
        <Reveal><span className="eyebrow">Everything you need</span></Reveal>
        <Reveal delay={80}><h2 className="h2">Built for <span className="gradient-text">getting fit</span></h2></Reveal>
        <div className="grid">
          {features.map(({ icon: Icon, title, text, to, span }, i) => (
            <Reveal key={title} delay={i * 90} style={span === 'wide' ? { gridColumn: 'span 2' } : undefined}>
              <Link to={to} className="card card-lg" onMouseMove={onMove} style={{ height: '100%' }}>
                <div className="icon-tile"><Icon size={24} /></div>
                <h3>{title}</h3>
                <p className="muted">{text}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <Reveal><span className="eyebrow">Top rated</span></Reveal>
        <Reveal delay={80}><h2 className="h2">Featured <span className="gradient-text">centres</span></h2></Reveal>
        <div className="grid">
          {centres.map((c, i) => (
            <Reveal key={c.id} delay={i * 100}>
              <Link to={`/centres/${c.id}`} className="card" onMouseMove={onMove}>
                <span className="badge lime featured-tag">★ {c.rating}</span>
                <div className="cover" />
                <h3>{c.name}</h3>
                <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={16} /> {c.city}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <Reveal>
          <div className="card card-lg" style={{ textAlign: 'center', padding: '70px 40px' }} onMouseMove={onMove}>
            <span className="eyebrow">For coaches</span>
            <h2 className="h2" style={{ marginBottom: 14 }}>Are you a <span className="gradient-text">trainer</span>?</h2>
            <p className="muted" style={{ maxWidth: 520, margin: '0 auto 30px' }}>
              Create your profile, publish your sessions and get bookings from FitLife customers.
            </p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to="/signup" className="btn btn-primary">Join as a trainer</Link>
              <span className="badge ok"><Zap size={13} /> Fast approval</span>
              <span className="badge"><ShieldCheck size={13} /> Secure payouts</span>
              <span className="badge lime"><Bell size={13} /> WhatsApp alerts</span>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
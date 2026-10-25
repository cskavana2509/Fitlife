export const inr = (paise = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(paise / 100);

export const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'FL';

export const goalLabel = (g) =>
  ({ weight_loss: 'Weight loss', muscle_gain: 'Muscle gain', maintenance: 'Maintenance', endurance: 'Endurance' })[g] ?? g;
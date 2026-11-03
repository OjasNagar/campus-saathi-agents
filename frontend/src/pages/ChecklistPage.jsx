import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon';
import pack from '../data/documents.json';
import { buildChecklist, defaultProfile } from '../utils/checklist';

const states = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Haryana', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
];

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable
  }
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function Segmented({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ChecklistPage() {
  const [profile, setProfile] = useState(() => ({ ...defaultProfile, home_state: 'Madhya Pradesh', ...read('saathi-profile', {}) }));
  const [ticked, setTicked] = useState(() => new Set(read('saathi-ticked', [])));

  useEffect(() => write('saathi-profile', profile), [profile]);
  useEffect(() => write('saathi-ticked', [...ticked]), [ticked]);

  const set = (key) => (value) => setProfile((p) => ({ ...p, [key]: value }));
  const list = useMemo(() => buildChecklist(profile, pack), [profile]);
  const doneCount = list.filter((d) => ticked.has(d.id)).length;
  const percent = list.length ? Math.round((doneCount / list.length) * 100) : 0;

  const toggle = (id) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const groups = [];
  list.forEach((d) => {
    let g = groups.find((x) => x.name === d.group);
    if (!g) groups.push((g = { name: d.group, items: [] }));
    g.items.push(d);
  });

  return (
    <>
      <div className="page-head no-print">
        <div className="eyebrow">My file</div>
        <h1>Arrange your file before you travel</h1>
        <p>Answer four quick questions and get the exact papers to carry, in the order to stack them.</p>
      </div>
      <div className="print-only" style={{ padding: '0 0 12px' }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Campus Saathi: my reporting file</h1>
        <p>{profile.category} · {profile.admission_route} · {profile.home_state || 'State not set'} · {profile.hostel_required ? 'Hostel' : 'Day scholar'}</p>
      </div>

      <div className="layout">
        <section className="stack">
          <div className="card progress">
            <strong>{doneCount} of {list.length} ready</strong>
            <div className="track" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
              <div className="fill" style={{ width: `${percent}%` }} />
            </div>
            <strong>{percent}%</strong>
            <button type="button" className="btn no-print" onClick={() => window.print()}>
              <Icon name="print" /><span className="label-long">Print</span>
            </button>
          </div>

          {groups.map((g) => (
            <div key={g.name}>
              <div className="group-title">{g.name}</div>
              <div className="card">
                {g.items.map((d) => {
                  const done = ticked.has(d.id);
                  return (
                    <article key={d.id} className={`doc ${done ? 'done' : ''}`}>
                      <button type="button" className="check" role="checkbox" aria-checked={done}
                        aria-label={`Mark ${d.title} as ready`} onClick={() => toggle(d.id)}>
                        <Icon name="check" size={15} />
                      </button>
                      <div>
                        <div className="doc-top">
                          <span className="doc-num">{String(d.number).padStart(2, '0')}</span>
                          <h3>{d.title}</h3>
                        </div>
                        <div className="doc-tags">
                          {d.original && <span className="chip accent">Original</span>}
                          <span className="chip">{d.copies} {d.copy_unit || (d.copies === 1 ? 'photocopy set' : 'photocopy sets')}</span>
                          {d.valid_note && <span className="chip warn">{d.valid_note}</span>}
                        </div>
                        <p>{d.where_to_get}</p>
                        <div className="doc-meta">
                          <a href={d.source_url} target="_blank" rel="noreferrer">Official source</a>
                          {d.format_url && <a href={d.format_url} target="_blank" rel="noreferrer">Download format</a>}
                          <span>Checked {formatDate(d.last_verified)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
          {pack.status === 'draft' && (
            <p className="no-print" style={{ color: 'var(--ink-3)', fontSize: 13 }}>
              This list is a draft. Confirm it against the institute's official notice before you pack.
            </p>
          )}
        </section>

        <aside className="stack no-print form-first">
          <div className="card card-pad form-grid">
            <div className="card-title" style={{ marginBottom: 0 }}>About you</div>
            <div className="field">
              <span className="label">Category</span>
              <Segmented label="Category" value={profile.category} onChange={set('category')}
                options={pack.options.categories.map((c) => ({ value: c, label: c }))} />
            </div>
            <div className="field">
              <span className="label">Admission route</span>
              <Segmented label="Admission route" value={profile.admission_route} onChange={set('admission_route')}
                options={pack.options.admission_routes.map((c) => ({ value: c, label: c }))} />
            </div>
            <div className="field">
              <label htmlFor="state">Home state</label>
              <select id="state" className="select" value={profile.home_state} onChange={(e) => set('home_state')(e.target.value)}>
                {states.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="label">Accommodation</span>
              <Segmented label="Accommodation" value={profile.hostel_required} onChange={set('hostel_required')}
                options={[{ value: true, label: 'Hostel' }, { value: false, label: 'Day scholar' }]} />
            </div>
            <div className="field">
              <span className="label">Disability certificate</span>
              <Segmented label="Disability certificate" value={profile.pwd} onChange={set('pwd')}
                options={[{ value: false, label: 'Not needed' }, { value: true, label: 'I have one' }]} />
            </div>
            <div className="privacy">
              <Icon name="shield" size={18} />
              <span>Your answers stay in this browser. We never ask for ID numbers such as Aadhaar.</span>
            </div>
            <button type="button" className="btn" onClick={() => setTicked(new Set())}>Clear ticks</button>
          </div>
        </aside>
      </div>
    </>
  );
}

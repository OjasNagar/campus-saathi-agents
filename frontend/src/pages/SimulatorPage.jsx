import { useEffect, useMemo, useState } from 'react';
import CampusMap from '../components/CampusMap';
import MetricsPanel from '../components/MetricsPanel';
import Icon from '../components/Icon';
import { API, agentGroups, stationName } from '../utils/stations';

const qOptions = [10, 25, 50, 100, 500];
const speeds = [0.5, 1, 2, 4];

export default function SimulatorPage() {
  const [algo, setAlgo] = useState('a_star');
  const [iters, setIters] = useState(100);
  const [congestion, setCongestion] = useState(true);
  const [result, setResult] = useState(null);
  const [mapData, setMapData] = useState({ nodes: {}, edges: [] });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    fetch(`${API}/api/map`).then((r) => r.json()).then(setMapData).catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    let live = true;
    setLoading(true);
    fetch(`${API}/api/simulate/${algo}?congestion=${congestion}&iterations=${iters}`)
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        setFailed(Boolean(data.error));
        if (!data.error) {
          setResult(data);
          setIndex(0);
          setPlaying(true);
        }
      })
      .catch(() => live && setFailed(true))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [algo, congestion, iters]);

  const trace = result?.trace || [];
  const last = Math.max(trace.length - 1, 0);

  useEffect(() => {
    if (!playing || trace.length === 0) return undefined;
    if (index >= last) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), 650 / speed);
    return () => clearTimeout(t);
  }, [playing, index, last, speed, trace.length]);

  const route = useMemo(() => {
    const order = [];
    trace.forEach((s, i) => {
      (s.completed_steps || []).forEach((id) => {
        if (!order.some((o) => o.id === id)) order.push({ id, at: i });
      });
    });
    return order;
  }, [trace]);

  const finished = trace.length > 0 && index >= last;
  const nowAt = trace[index]?.current_room;

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Simulator</div>
        <h1>Watch each agent find the quickest way through check-in</h1>
        <p>Pick an agent, press play, and follow the student from the main gate to the last step.</p>
      </div>

      {failed && (
        <div className="notice" role="alert">
          Can't reach the simulator. Start the backend, then reload this page.
        </div>
      )}

      <div className="layout">
        <div className="stack">
          <section className="card" style={{ overflow: 'hidden' }}>
            <div className="map-head">
              <h2>Campus map</h2>
              <span className={`chip ${finished ? 'good' : 'accent'}`}>
                <span className="dot" />{finished ? 'Finished' : trace.length ? 'Walking' : 'Loading'}
              </span>
              {congestion && <span className="chip warn">Other students in queues</span>}
              <div className="spacer" />
              {loading && <span className="chip"><span className="spin" /> Running</span>}
            </div>
            <div className="map-stage">
              <CampusMap mapData={mapData} trace={trace} showBackground={congestion}
                backgroundSteps={result?.background_steps || []} stepIndex={index} />
            </div>
            <div className="player">
              <button type="button" className="btn icon" aria-label={playing ? 'Pause' : 'Play'}
                disabled={trace.length === 0}
                onClick={() => { if (finished) setIndex(0); setPlaying(!playing || finished); }}>
                <Icon name={finished ? 'restart' : playing ? 'pause' : 'play'} />
              </button>
              <input type="range" min="0" max={last} value={index} aria-label="Step"
                disabled={trace.length === 0}
                onChange={(e) => { setPlaying(false); setIndex(Number(e.target.value)); }} />
              <span className="count">{trace.length ? `${index + 1} / ${trace.length}` : '0 / 0'}</span>
              <div className="speed" role="group" aria-label="Speed">
                {speeds.map((s) => (
                  <button key={s} type="button" aria-pressed={speed === s} onClick={() => setSpeed(s)}>{s}x</button>
                ))}
              </div>
            </div>
            <div className="map-legend">
              <span><i className="swatch" style={{ background: 'var(--accent)' }} />Student</span>
              <span><i className="swatch" style={{ background: 'var(--good)' }} />Step finished</span>
              <span><i className="swatch" style={{ background: 'var(--ink-3)' }} />Other students</span>
              <span><i className="swatch" style={{ background: '#6366f1' }} />Academic block</span>
              <span><i className="swatch" style={{ background: '#f59e0b' }} />Hostel area</span>
            </div>
          </section>

          <section className="card card-pad">
            <div className="card-title">Route taken</div>
            {route.length === 0 ? (
              <div className="skeleton" style={{ height: 120 }} />
            ) : (
              <ol className="timeline">
                {route.map((r, i) => (
                  <li key={r.id} className={r.at <= index ? (r.id === nowAt ? 'done now' : 'done') : ''}>
                    <span className="n">{r.at <= index ? <Icon name="check" size={13} /> : i + 1}</span>
                    {stationName(r.id)}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="stack">
          <section className="card card-pad">
            <div className="card-title">Agent</div>
            {agentGroups.map((g) => (
              <div key={g.title}>
                <div className="agent-group">{g.title}</div>
                {g.items.map((a) => (
                  <div key={a.id}>
                    <button type="button" className="agent" aria-pressed={algo === a.id}
                      disabled={loading && algo !== a.id} onClick={() => setAlgo(a.id)}>
                      {a.label}
                    </button>
                    {a.id === 'q_learning' && algo === a.id && (
                      <div className="pills" role="group" aria-label="Training rounds">
                        {qOptions.map((q) => (
                          <button key={q} type="button" className="pill" aria-pressed={iters === q}
                            onClick={() => setIters(q)}>{q} rounds</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </section>

          <section className="card card-pad">
            <div className="switch-row">
              <div>
                <strong>Crowded queues</strong>
                <small>Add other students waiting at each room</small>
              </div>
              <button type="button" className="switch" role="switch" aria-checked={congestion}
                aria-label="Crowded queues" onClick={() => setCongestion(!congestion)} />
            </div>
          </section>

          <MetricsPanel metrics={result?.metrics} loading={loading} />
        </aside>
      </div>
    </>
  );
}

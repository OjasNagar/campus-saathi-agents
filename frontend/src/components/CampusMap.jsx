import { shortName, stationName } from '../utils/stations';

const clusterTint = { academic: '#6366f1', hostel: '#f59e0b', neutral: '#64748b' };

export default function CampusMap({ mapData, trace, backgroundSteps, showBackground, stepIndex }) {
  const nodes = mapData.nodes || {};
  const ids = Object.keys(nodes);
  if (ids.length === 0) {
    return <div className="skeleton" style={{ height: 380, margin: 20 }} />;
  }

  const xs = ids.map((id) => nodes[id].x);
  const ys = ids.map((id) => nodes[id].y);
  const pad = 70;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) - Math.min(...xs) + pad * 2;
  const h = Math.max(...ys) - Math.min(...ys) + pad * 2;

  const step = trace[stepIndex];
  const here = step ? step.current_room : 'gate';
  const done = new Set(step?.completed_steps || []);
  const workers = showBackground ? backgroundSteps[stepIndex] || [] : [];

  const walked = new Set();
  for (let i = 1; i <= stepIndex && i < trace.length; i++) {
    const a = trace[i - 1].current_room;
    const b = trace[i].current_room;
    if (a !== b) {
      walked.add(`${a}|${b}`);
      walked.add(`${b}|${a}`);
    }
  }

  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} role="img"
      aria-label={`Campus map. Student is at ${stationName(here)}. ${done.size} steps finished.`}>
      {(mapData.edges || []).map((e, i) => {
        const a = nodes[e.from];
        const b = nodes[e.to];
        if (!a || !b) return null;
        const on = walked.has(`${e.from}|${e.to}`);
        return (
          <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={on ? 'var(--accent)' : 'var(--map-edge)'}
            strokeWidth={on ? 4 : 2.5} strokeLinecap="round" />
        );
      })}

      {ids.map((id) => {
        const n = nodes[id];
        const isHere = id === here;
        const isDone = done.has(id);
        const fill = isDone ? 'var(--good)' : 'var(--surface)';
        const stroke = isDone ? 'var(--good)' : clusterTint[n.cluster] || 'var(--map-node)';
        return (
          <g key={id}>
            <circle cx={n.x} cy={n.y} r={isHere ? 11 : 8} fill={fill} stroke={stroke} strokeWidth="3" />
            {isDone && !isHere && (
              <path d={`M${n.x - 3.5} ${n.y} l2.5 2.6 l4.5 -5`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            )}
            <text x={n.x} y={n.y + 26} textAnchor="middle" fontSize="11.5" fontWeight="600"
              fill={isHere ? 'var(--ink)' : 'var(--ink-2)'}
              stroke="var(--map-bg)" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round">
              {shortName(id)}
            </text>
          </g>
        );
      })}

      {workers.map((wk, i) => {
        const n = nodes[wk.current_room];
        if (!n) return null;
        return (
          <circle key={wk.id ?? i} cx={n.x + ((i % 4) - 1.5) * 7} cy={n.y - 20 - Math.floor(i / 4) * 6}
            r="3" fill="var(--ink-3)" opacity="0.7" />
        );
      })}

      {nodes[here] && (
        <g>
          <circle cx={nodes[here].x} cy={nodes[here].y} r="20" fill="var(--accent)" opacity="0.18">
            <animate attributeName="r" values="14;24;14" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={nodes[here].x} cy={nodes[here].y} r="8" fill="var(--accent)" stroke="var(--surface)" strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}

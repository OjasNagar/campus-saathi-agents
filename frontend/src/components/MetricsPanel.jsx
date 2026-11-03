const fmt = (v) => (typeof v === 'number' ? v.toFixed(1) : '0.0');

export default function MetricsPanel({ metrics, loading }) {
  if (!metrics) {
    return (
      <div className="card card-pad">
        <div className="card-title">Result</div>
        <div className="skeleton" style={{ height: 150 }} />
      </div>
    );
  }
  const total = metrics.total_cost || 1;
  const parts = [
    ['Travel', metrics.travel_time, 'var(--accent)'],
    ['Waiting', metrics.wait_time, 'var(--warn)'],
    ['Service', metrics.service_time, 'var(--good)'],
  ];
  return (
    <div className="card card-pad" style={{ opacity: loading ? 0.6 : 1 }}>
      <div className="card-title">Result</div>
      <div className="metrics">
        <div className="metric total">
          <small>Total time to finish</small>
          <strong>{fmt(metrics.total_cost)}<span className="unit">min</span></strong>
        </div>
        {parts.map(([label, value, color]) => (
          <div className="metric" key={label}>
            <small><span className="swatch" style={{ background: color, display: 'inline-block', marginRight: 6 }} />{label}</small>
            <strong>{fmt(value)}<span className="unit">min</span></strong>
          </div>
        ))}
      </div>
      <div className="bar" aria-hidden="true">
        {parts.map(([label, value, color]) => (
          <i key={label} style={{ width: `${((value || 0) / total) * 100}%`, background: color }} />
        ))}
      </div>
    </div>
  );
}

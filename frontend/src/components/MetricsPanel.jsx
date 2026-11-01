import React from 'react';

export default function MetricsPanel({ metrics }) {
    if (!metrics) {
        return (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-slate-400">
                Run a simulation to view performance metrics.
            </div>
        );
    }

    return (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl text-white">
            <h3 className="text-lg font-bold mb-4">Simulation Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-slate-400 text-sm">Travel Time</p>
                    <p className="text-2xl font-bold text-sky-400">{metrics.travel_time?.toFixed(2) || 0}s</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-slate-400 text-sm">Wait Time (Congestion)</p>
                    <p className="text-2xl font-bold text-amber-400">{metrics.wait_time?.toFixed(2) || 0}s</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-slate-400 text-sm">Service Time</p>
                    <p className="text-2xl font-bold text-emerald-400">{metrics.service_time?.toFixed(2) || 0}s</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-slate-400 text-sm">Total Cost</p>
                    <p className="text-2xl font-bold text-rose-400">{metrics.total_cost?.toFixed(2) || 0}s</p>
                </div>
            </div>
        </div>
    );
}
import React, { useEffect, useState } from 'react';

export default function CampusMap({ simulationResult, showBackground }) {
    const [mapData, setMapData] = useState({ nodes: {}, edges: [] });
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/map')
            .then(res => res.json())
            .then(data => setMapData(data))
            .catch(err => console.error("Failed to load map data:", err));
    }, []);

    const trace = simulationResult?.trace || [];
    const backgroundAgentsSteps = simulationResult?.background_steps || [];

    useEffect(() => {
        if (!trace || trace.length === 0) return;
        setCurrentStepIndex(0);
        const interval = setInterval(() => {
            setCurrentStepIndex(prev => {
                if (prev < trace.length - 1) return prev + 1;
                clearInterval(interval);
                return prev;
            });
        }, 600);

        return () => clearInterval(interval);
    }, [simulationResult]);

    const currentStep = trace[currentStepIndex];
    const currentNodeName = currentStep ? currentStep.current_room : null;
    const currentNode = mapData.nodes[currentNodeName];
    const currentBgAgents = showBackground ? (backgroundAgentsSteps[currentStepIndex] || []) : [];

    return (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-white text-lg font-bold">Campus Navigation Simulation</h2>
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Main Agent</span>
                    {showBackground && (
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-white/80 inline-block"></span> Background Workers</span>
                    )}
                </div>
            </div>

            <svg width="800" height="600" className="bg-slate-950 rounded-lg border border-slate-800">
                {/* Render Edges */}
                {mapData.edges && mapData.edges.map((edge, idx) => {
                    const nodeU = mapData.nodes[edge.from];
                    const nodeV = mapData.nodes[edge.to];
                    if (!nodeU || !nodeV) return null;
                    return (
                        <line
                            key={idx}
                            x1={nodeU.x}
                            y1={nodeU.y}
                            x2={nodeV.x}
                            y2={nodeV.y}
                            stroke="#334155"
                            strokeWidth="3"
                        />
                    );
                })}

                {/* Render Nodes */}
                {mapData.nodes && Object.entries(mapData.nodes).map(([id, pos]) => (
                    <g key={id}>
                        <circle cx={pos.x} cy={pos.y} r="7" fill="#64748b" />
                        <text x={pos.x} y={pos.y - 12} fill="#94a3b8" fontSize="11" textAnchor="middle">{id}</text>
                    </g>
                ))}

                {/* Render Background Workers Only if Toggle is ON */}
                {showBackground && currentBgAgents.map((bgAgent, idx) => {
                    const bgNode = mapData.nodes[bgAgent.current_room];
                    if (!bgNode) return null;
                    return (
                        <circle
                            key={`bg-${idx}`}
                            cx={bgNode.x + (idx % 3 - 1) * 6}
                            cy={bgNode.y + (Math.floor(idx / 3) - 1) * 6}
                            r="6"
                            fill="#ffffff"
                            opacity="0.8"
                        />
                    );
                })}

                {/* Main Agent Marker (Red) */}
                {currentNode && (
                    <circle cx={currentNode.x} cy={currentNode.y} r="11" fill="#f43f5e" className="animate-pulse shadow-lg" />
                )}
            </svg>
        </div>
    );
}
export const stations = {
  gate: 'Main gate',
  lhtc_gate: 'Allotment verification',
  'L-103': 'Document verification',
  'L-104': 'Fee clearance',
  'L-105': 'Department registration',
  'L-106': 'ID card biometrics',
  'L-206': 'Library membership',
  panini_gate: 'Hostel allotment letter',
  room: 'Room inspection',
  office: 'Warden clearance',
  shop: 'Necessities shopping',
};

export const shortNames = {
  gate: 'Main gate', lhtc_gate: 'Allotment', 'L-103': 'Documents', 'L-104': 'Fees', 'L-105': 'Department',
  'L-106': 'ID card', 'L-206': 'Library', panini_gate: 'Hostel letter', room: 'Room', office: 'Warden', shop: 'Shop',
};

export const shortName = (id) => shortNames[id] || id;

export const stationName = (id) => stations[id] || id;

export const API = 'http://127.0.0.1:8000';

export const agentGroups = [
  { title: 'Search', items: [
    { id: 'a_star', label: 'A* search' },
    { id: 'ucs', label: 'Uniform cost' },
    { id: 'bfs', label: 'Breadth-first' },
    { id: 'dfs', label: 'Depth-first' },
    { id: 'ids', label: 'Iterative deepening' },
    { id: 'greedy_nearest', label: 'Greedy nearest' },
  ] },
  { title: 'Optimisation', items: [
    { id: 'simulated_annealing', label: 'Simulated annealing' },
    { id: 'value_iteration', label: 'Value iteration' },
  ] },
  { title: 'Learning', items: [
    { id: 'q_learning', label: 'Q-learning' },
  ] },
];

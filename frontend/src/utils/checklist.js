const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v);

export const defaultProfile = {
  category: 'OPEN',
  home_state: '',
  admission_route: 'JoSAA',
  pwd: false,
  hostel_required: true,
};

export function matches(when, profile, homeState) {
  return Object.entries(when || {}).every(([key, wanted]) => {
    if (key === 'not_home_state') {
      const away = norm(profile.home_state) !== norm(homeState);
      return wanted ? away : !away;
    }
    return wanted.map(norm).includes(norm(profile[key]));
  });
}

export function buildChecklist(profile, pack) {
  const home = pack.options.home_state;
  return pack.documents
    .filter((doc) => matches(doc.when, profile, home))
    .map((doc, i) => ({ ...doc, number: i + 1 }));
}

export function isValidSource(url) {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

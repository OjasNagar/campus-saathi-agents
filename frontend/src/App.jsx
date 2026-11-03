import { useEffect, useState } from 'react';
import Icon from './components/Icon';
import ChatModal from './components/ChatModal';
import SimulatorPage from './pages/SimulatorPage';
import ChecklistPage from './pages/ChecklistPage';

const pages = [
  { id: 'simulator', label: 'Simulator' },
  { id: 'checklist', label: 'My file' },
];

const readHash = () => (window.location.hash === '#/checklist' ? 'checklist' : 'simulator');

const readTheme = () => {
  try {
    const saved = localStorage.getItem('saathi-theme');
    if (saved) return saved;
  } catch {
    // storage unavailable
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export default function App() {
  const [page, setPage] = useState(readHash);
  const [theme, setTheme] = useState(readTheme);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setPage(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('saathi-theme', theme);
    } catch {
      // storage unavailable
    }
  }, [theme]);

  const go = (id) => {
    window.location.hash = id === 'checklist' ? '#/checklist' : '#/';
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark"><Icon name="pin" size={18} /></div>
            <span className="word">Campus Saathi</span>
          </div>
          <nav className="nav" aria-label="Pages">
            {pages.map((p) => (
              <button key={p.id} type="button" onClick={() => go(p.id)}
                aria-current={page === p.id ? 'page' : undefined}>
                {p.label}
              </button>
            ))}
          </nav>
          <div className="spacer" />
          <button type="button" className="btn" onClick={() => setChatOpen(true)}>
            <Icon name="chat" />
            <span>Ask Saathi</span>
          </button>
          <button type="button" className="btn icon" aria-label="Toggle dark mode"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>
      <div className="shell">
        {page === 'checklist' ? <ChecklistPage /> : <SimulatorPage />}
      </div>
      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

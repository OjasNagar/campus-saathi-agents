import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { API } from '../utils/stations';

const first = {
  role: 'bot',
  text: "Hi, I'm Campus Saathi. Tell me where you are and which steps you've finished, and I'll work out the quickest route.",
};

const samples = [
  'I just arrived at the gate. What is the best route?',
  'I finished the hostel allotment letter and warden clearance. Where next?',
  'I am at the allotment verification desk. What is next?',
];

export default function ChatModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([first]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const end = useRef(null);

  useEffect(() => {
    if (isOpen) end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const send = async (e) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || loading) return;
    const next = [...messages, { role: 'me', text: query }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setMessages([...next, { role: 'bot', text: data.response || 'No reply came back.' }]);
    } catch {
      setMessages([...next, { role: 'bot', text: "I couldn't reach the server. Check that the backend is running." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-scrim" onClick={onClose}>
      <div className="chat" role="dialog" aria-label="Ask Campus Saathi" onClick={(e) => e.stopPropagation()}>
        <div className="chat-head">
          <div className="brand-mark"><Icon name="chat" size={17} /></div>
          <div>
            <h2>Ask Saathi</h2>
            <small>Your check-in guide</small>
          </div>
          <div className="spacer" />
          <button type="button" className="btn icon" aria-label="Close" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="chat-body">
          {messages.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
          {loading && <div className="msg bot"><span className="spin" /></div>}
          <div ref={end} />
        </div>
        {messages.length <= 1 && (
          <div className="suggest">
            {samples.map((s) => <button key={s} type="button" onClick={() => setInput(s)}>{s}</button>)}
          </div>
        )}
        <form className="chat-form" onSubmit={send}>
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question" aria-label="Message" disabled={loading} />
          <button type="submit" className="btn primary icon" aria-label="Send" disabled={loading || !input.trim()}>
            <Icon name="send" />
          </button>
        </form>
      </div>
    </div>
  );
}

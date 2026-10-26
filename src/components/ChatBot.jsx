import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const GREETING = {
  role: 'assistant',
  text: "Hi! I'm FitBot. Ask me about centres, trainers, plans, diets, or your bookings.",
};

const SUGGESTIONS = [
  'Which centres are in Bengaluru?',
  'Show diet plans for weight loss',
  'How do I book a trainer?',
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    const clean = text.trim();
    if (!clean || sending) return;

    const next = [...messages, { role: 'user', text: clean }];
    setMessages(next);
    setInput('');
    setSending(true);

    try {
      // Send the conversation without the local greeting, which the model doesn't need
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: next.slice(1) },
      });
      if (error) throw error;

      const reply = typeof data?.reply === 'string' && data.reply.trim()
        ? data.reply
        : typeof data?.error === 'string' && data.error.trim()
          ? data.error
          : 'Sorry, something went wrong.';
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (error) {
      console.error('FitBot request failed', error);
      setMessages((m) => [...m, {
        role: 'assistant',
        text: 'Sorry, I could not reach FitBot. Please try again.',
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label="Open FitBot">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="chat-panel fade-up">
          <div className="chat-head">
            <span className="icon-tile" style={{ width: 38, height: 38, borderRadius: 12, margin: 0 }}>
              <Sparkles size={18} />
            </span>
            <div>
              <strong>FitBot</strong>
              <div className="muted" style={{ fontSize: '.75rem' }}>Ask about FitLife</div>
            </div>
          </div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>{m.text}</div>
            ))}
            {sending && (
              <div className="chat-msg assistant typing"><span /><span /><span /></div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length === 1 && (
            <div className="chat-suggest">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a question…"
              maxLength={500}
            />
            <button className="icon-btn" disabled={sending || !input.trim()} aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
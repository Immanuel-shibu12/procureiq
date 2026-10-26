import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function Chatbot({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    return [
      {
        id: 'welcome',
        role: 'model',
        text: `### 🩺 Welcome to MediProcure AI!\nHello **${user?.name || 'Doctor'}**! I am your hospital procurement and supplier risk intelligence assistant.\n\nI am grounded in real-time with your live hospital requisitions, vendor performance scores, and GCP BigQuery analytics. What would you like to investigate?`,
        source: 'system',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customKey, setCustomKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [keySaved, setKeySaved] = useState(false);
  const [serverStatus, setServerStatus] = useState({ hasEnvKey: false });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Fetch server API key status
    api('/chat/status')
      .then(setServerStatus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  const handleSaveKey = (e) => {
    e.preventDefault();
    const trimmed = customKey.trim();
    if (trimmed) {
      localStorage.setItem('gemini_api_key', trimmed);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowSettings(false);
    }, 1200);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: `Chat cleared. Ready for your next clinical procurement or supplier risk inquiry!`,
        source: 'system',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Format previous messages for conversation history
    const history = messages
      .filter(m => m.source !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.text
      }));

    try {
      const activeKey = customKey.trim() || undefined;
      const res = await api('/chat', 'POST', {
        message: text,
        history,
        apiKey: activeKey
      });

      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.reply || 'No response received.',
        source: res.source,
        model: res.model,
        apiKeyNeeded: res.apiKeyNeeded,
        tip: res.tip,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `⚠️ **Error communicating with assistant:** ${err.message || 'Please verify your network or log in again.'}`,
        source: 'error',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format basic markdown to styled HTML elements
  const formatMarkdown = (content) => {
    if (!content) return '';

    // Split paragraphs
    const lines = content.split('\n');
    const elements = [];
    let currentList = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="mb-2 ps-3 chatbot-list">
            {currentList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Heading 3
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h6 key={`h-${index}`} className="text-warning fw-bold mt-2 mb-1 border-bottom border-secondary pb-1">
            {trimmed.replace('### ', '')}
          </h6>
        );
        return;
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h5 key={`h-${index}`} className="text-light fw-bold mt-2 mb-1">
            {trimmed.replace('## ', '')}
          </h5>
        );
        return;
      }

      // List item
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const itemText = parseInlineMarkdown(trimmed.replace(/^[*\-]\s+/, ''));
        currentList.push(itemText);
        return;
      }

      // Numbered item
      if (/^\d+\.\s+/.test(trimmed)) {
        flushList();
        const itemText = parseInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''));
        elements.push(
          <div key={`num-${index}`} className="ms-2 mb-1 small text-light-emphasis">
            <span className="badge bg-secondary-subtle text-light me-1">{trimmed.match(/^\d+/)[0]}</span>
            <span dangerouslySetInnerHTML={{ __html: itemText }} />
          </div>
        );
        return;
      }

      // Normal paragraph or empty line
      flushList();
      if (trimmed) {
        elements.push(
          <p
            key={`p-${index}`}
            className="mb-2 small lh-base"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed) }}
          />
        );
      }
    });

    flushList();
    return elements;
  };

  const parseInlineMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-light">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-dark px-1 rounded text-warning">$1</code>');
  };

  const quickPrompts = [
    { label: '📋 Pending Requisitions', query: 'Show pending requisition summary and approvals needed' },
    { label: '⚠️ High Risk Suppliers', query: 'Which suppliers have high delivery risk or quality issues?' },
    { label: '💰 Spend & Budgets', query: 'What is our current committed spend and department budget status?' },
    { label: '🚨 Emergency ICU Protocol', query: 'What is the hospital emergency ICU procurement protocol?' },
    { label: '☁️ Cloud ML Delay Prediction', query: 'How does BigQuery ML evaluate supplier delivery delay risk?' }
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        className={`chatbot-trigger-btn shadow-lg ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open MediProcure AI Assistant"
        title="MediProcure AI Chatbot"
      >
        <span className="chatbot-trigger-icon">🤖</span>
        <span className="chatbot-trigger-label d-none d-md-inline">MediProcure AI</span>
        <span className="chatbot-status-pulse" />
      </button>

      {/* Floating Chat Container */}
      {isOpen && (
        <div className="chatbot-window shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="chatbot-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <div className="chatbot-avatar-badge">🤖</div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-light small">MediProcure AI</span>
                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.65rem' }}>
                    ● ONLINE
                  </span>
                </div>
                <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                  GCP Cloud &amp; Live MongoDB Grounded
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className={`btn btn-sm btn-icon ${showSettings ? 'btn-warning' : 'btn-outline-secondary'}`}
                onClick={() => setShowSettings(!showSettings)}
                title="API Key Configuration"
                style={{ padding: '2px 8px', fontSize: '0.8rem' }}
              >
                ⚙️
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary btn-icon"
                onClick={handleClearChat}
                title="Clear Chat History"
                style={{ padding: '2px 8px', fontSize: '0.8rem' }}
              >
                🗑️
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary btn-icon"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
                style={{ padding: '2px 8px', fontSize: '0.85rem' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Collapsible API Key Settings Panel */}
          {showSettings && (
            <div className="chatbot-settings-panel p-3 border-bottom bg-dark-subtle animate-slide-down">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-semibold text-light small">🔑 AI API Key Configuration</span>
                <span className="badge bg-secondary text-uppercase" style={{ fontSize: '0.65rem' }}>
                  {customKey ? 'Custom Key Set' : serverStatus.hasEnvKey ? 'Server Key Active' : 'Fallback Heuristics'}
                </span>
              </div>
              <p className="text-secondary small mb-2" style={{ fontSize: '0.75rem', lineHeight: 1.35 }}>
                Connect your <strong>Google Gemini API Key</strong> for unrestricted real-time LLM intelligence.
                If empty, MediProcureIQ seamlessly runs with our built-in clinical procurement heuristics.
              </p>

              <form onSubmit={handleSaveKey}>
                <div className="input-group input-group-sm mb-2">
                  <input
                    type="password"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="Enter Gemini API key (AIzaSy...)"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                  />
                  <button type="submit" className="btn btn-warning px-3">
                    {keySaved ? 'Saved! ✓' : 'Save Key'}
                  </button>
                </div>
              </form>

              <div className="d-flex align-items-center justify-content-between small text-secondary" style={{ fontSize: '0.7rem' }}>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-info text-decoration-none"
                >
                  Get free key at Google AI Studio &rarr;
                </a>
                {customKey && (
                  <button
                    type="button"
                    className="btn btn-link text-danger p-0 small text-decoration-none"
                    style={{ fontSize: '0.7rem' }}
                    onClick={() => {
                      setCustomKey('');
                      localStorage.removeItem('gemini_api_key');
                    }}
                  >
                    Remove custom key
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="chatbot-messages p-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chatbot-msg-row mb-3 d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="chatbot-avatar-mini me-2 flex-shrink-0">
                    🤖
                  </div>
                )}

                <div className={`chatbot-bubble ${msg.role === 'user' ? 'chatbot-bubble-user' : 'chatbot-bubble-model'}`}>
                  <div className="chatbot-bubble-content">
                    {formatMarkdown(msg.text)}
                  </div>

                  {/* Metadata and source badge */}
                  <div className="d-flex align-items-center justify-content-between mt-1 pt-1 border-top border-secondary-subtle" style={{ fontSize: '0.65rem', opacity: 0.75 }}>
                    <span className="text-secondary">
                      {msg.source === 'gemini' && '✨ Gemini 1.5 Flash'}
                      {msg.source === 'domain_ai_engine' && '🛡️ Domain Procurement Heuristics'}
                      {msg.source === 'system' && '⚡ System'}
                      {msg.source === 'error' && '❌ Alert'}
                    </span>
                    <span className="text-secondary">{msg.timestamp}</span>
                  </div>

                  {msg.tip && (
                    <div className="mt-1 pt-1 text-warning small fst-italic" style={{ fontSize: '0.7rem' }}>
                      💡 {msg.tip}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-msg-row mb-3 d-flex justify-content-start align-items-center gap-2">
                <div className="chatbot-avatar-mini">🤖</div>
                <div className="chatbot-bubble chatbot-bubble-model d-flex align-items-center gap-2 py-2 px-3">
                  <div className="spinner-grow spinner-grow-sm text-warning" role="status" style={{ width: '0.6rem', height: '0.6rem' }} />
                  <span className="small text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>
                    Consulting procurement database &amp; Gemini…
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="chatbot-quick-prompts px-3 py-1 border-top border-secondary-subtle d-flex gap-1 overflow-x-auto">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-sm btn-outline-secondary text-nowrap rounded-pill py-0 px-2 quick-prompt-chip"
                style={{ fontSize: '0.7rem' }}
                onClick={() => handleSend(qp.query)}
                disabled={loading}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="chatbot-input-container p-2 border-top border-secondary-subtle">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="d-flex align-items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                className="form-control form-control-sm bg-dark text-light border-secondary"
                placeholder="Ask about requisitions, vendor risks, emergency ICU…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-sm btn-warning d-flex align-items-center justify-content-center px-3"
                disabled={loading || !input.trim()}
                title="Send Message"
              >
                <span style={{ fontSize: '0.9rem' }}>➤</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

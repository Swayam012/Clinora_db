import { useState } from 'react';

export default function AIChatWidget() {
  const [query, setQuery] = useState('');

  return (
    <div className="card ai-widget">
      <div className="card-header">
        <h3 className="card-title">Clinora AI</h3>
        <span className="ai-widget-dots">⋯</span>
      </div>

      <div className="ai-widget-body">
        <div className="ai-widget-welcome">
          <div className="ai-widget-sparkle">✦</div>
          <p className="ai-widget-msg">
            Clinora AI - Ready to analyze your clinical records
          </p>
        </div>

        <button className="ai-widget-cta">
          Ask Clinora AI
        </button>

        <div className="ai-widget-quick">
          <p className="ai-widget-quick-label">Quick queries to ask Clinora...</p>
          <div className="ai-widget-input-row">
            <span className="ai-widget-mic" title="Voice input">🎤</span>
            <input
              type="text"
              className="ai-widget-input"
              placeholder="Ask something..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="ai-widget-send" title="Send">
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

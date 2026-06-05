import { useState, useRef, useEffect } from "react";
import { getResponse } from "../mockResponses";

// ─── Helpers ────────────────────────────────────────────────────────────────

function Timestamp() {
  const now = new Date();
  return (
    <span className="chat-timestamp">
      {now.getHours().toString().padStart(2, "0")}:
      {now.getMinutes().toString().padStart(2, "0")}
    </span>
  );
}

function SourceBadge({ evidenceUsed }) {
  if (!evidenceUsed || evidenceUsed.length === 0) return null;
  return (
    <div className="source-badge" aria-label="Source documents available">
      <span className="source-icon">📄</span>
      <span>
        {evidenceUsed.length} source{evidenceUsed.length > 1 ? "s" : ""} referenced
      </span>
    </div>
  );
}

function SafetyBanner({ message }) {
  if (!message) return null;
  return (
    <div className="safety-banner" role="alert" aria-live="assertive">
      <span className="safety-icon">🚨</span>
      <span>{message}</span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message assistant-message typing-message" aria-label="Avatar is thinking">
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * ChatInterface
 */
export default function ChatInterface({ onAvatarStateChange, onNewMessage }) {
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: "assistant",
      text: "Hello! I'm your health coach. You can type a health-related question below, or use the microphone button to speak. How can I help you today?",
      evidenceUsed: [],
      guardrailTriggered: false,
      safetyMessage: null,
      emotionState: "supportive",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Show feedback nudge after 2 user exchanges
  useEffect(() => {
    const userMessages = messages.filter((m) => m.role === "user");
    if (userMessages.length >= 2 && !showFeedback) {
      setShowFeedback(true);
    }
  }, [messages]);

  // ── Core send logic ──────────────────────────────────────────────────────

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    // 1. Add user message
    const userMsg = { id: Date.now(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // 2. Avatar → thinking
    setIsThinking(true);
    onAvatarStateChange?.("thinking");

    // 3. Simulate backend latency (1.2 – 2s)
    const delay = 1200 + Math.random() * 800;
    setTimeout(() => {
      const response = getResponse(trimmed);

      // 4. Build assistant message
      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        text: response.answer,
        evidenceUsed: response.evidence_used,
        guardrailTriggered: response.guardrail_triggered,
        safetyMessage: response.safety_message,
        emotionState: response.emotion_state,
      };

      setIsThinking(false);
      setMessages((prev) => [...prev, assistantMsg]);

      // 5. Drive avatar state from response
      const avatarState = response.guardrail_triggered
        ? "warning"
        : response.emotion_state;
      onAvatarStateChange?.(avatarState);

      // 6. Tell TextToSpeech about the new message
      onNewMessage?.(response.answer);

      // 7. Fallback idle — TextToSpeech's utterance.onend handles this
      // normally, but this covers the case where TTS is not mounted
      setTimeout(() => {
        onAvatarStateChange?.("idle");
      }, 6000);
    }, delay);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // Exposed so PushToTalk can inject a transcribed message
  useEffect(() => {
    window.__injectVoiceMessage = (text) => sendMessage(text);
    return () => { delete window.__injectVoiceMessage; };
  }, [isThinking]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>

      <div className="chat-wrapper" role="region" aria-label="Health coach chat">

        {/* ── Message list ── */}
        <div className="messages-list" aria-live="polite" aria-relevant="additions">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.role === "user" ? "user-message" : "assistant-message"}`}
            >
              {msg.role === "assistant" && msg.guardrailTriggered && (
                <SafetyBanner message={msg.safetyMessage} />
              )}

              <div
                className={`bubble ${msg.role === "user" ? "bubble-user" : "bubble-assistant"} ${msg.guardrailTriggered ? "bubble-warning" : ""
                  }`}
              >
                <p className="bubble-text">{msg.text}</p>
                {msg.role === "assistant" && (
                  <SourceBadge evidenceUsed={msg.evidenceUsed} />
                )}
                <Timestamp />
              </div>
            </div>
          ))}

          {isThinking && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Feedback nudge ── */}
        {showFeedback && (
          <div className="feedback-nudge" role="note">
            <span>💬 After your session, scroll down to share feedback.</span>
          </div>
        )}

        {/* ── Input area ── */}
        <form className="input-area" onSubmit={handleSubmit} aria-label="Send a message">
          <label htmlFor="chat-input" className="sr-only">
            Type your health question
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a health question… (Enter to send, Shift+Enter for new line)"
            rows={2}
            disabled={isThinking}
            aria-disabled={isThinking}
            aria-multiline="true"
          />
          <button
            type="submit"
            className="send-btn"
            disabled={isThinking || !inputValue.trim()}
            aria-label="Send message"
          >
            {isThinking ? (
              <span className="btn-spinner" aria-hidden="true" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
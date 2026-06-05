import { useState } from "react";

// ─── Question definitions ────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: "ease_of_use",
    label: "Was the interface easy to use?",
    type: "stars",
  },
  {
    id: "avatar_clarity",
    label: "Did the avatar feel clear and helpful?",
    type: "stars",
  },
  {
    id: "response_clarity",
    label: "Was the response easy to understand?",
    type: "stars",
  },
  {
    id: "trust",
    label: "Did you trust the response?",
    type: "stars",
  },
  {
    id: "comments",
    label: "Any comments or suggestions?",
    type: "textarea",
    placeholder: "Tell us what worked well or what could be improved…",
  },
];

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

// ─── Star rating sub-component ───────────────────────────────────────────
function StarRating({ questionId, value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      className="star-group"
      role="radiogroup"
      aria-label={`Rating for ${questionId}`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= (hovered || value) ? "star-active" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${star} star${star > 1 ? "s" : ""} — ${STAR_LABELS[star]}`}
          aria-pressed={value === star}
        >
          ★
        </button>
      ))}
      {(hovered || value) > 0 && (
        <span className="star-label" aria-live="polite">
          {STAR_LABELS[hovered || value]}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────
/**
 * FeedbackForm
 *
 *   onSubmit(feedbackData) — called with the collected feedback object
 *                            (optional; form handles its own submit state)
 */
export default function FeedbackForm({ onClose, onSubmit }) {
  const initialAnswers = Object.fromEntries(
    QUESTIONS.map((q) => [q.id, q.type === "stars" ? 0 : ""])
  );

  const [answers, setAnswers] = useState(initialAnswers);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setError("");
  };

  const handleSubmit = () => {
    // Validate — all star questions must be answered
    const unanswered = QUESTIONS.filter(
      (q) => q.type === "stars" && answers[q.id] === 0
    );
    if (unanswered.length > 0) {
      setError("Please rate all questions before submitting.");
      return;
    }

    const feedbackData = {
      timestamp: new Date().toISOString(),
      session_id: `session_${Date.now()}`,
      ratings: {
        ease_of_use: answers.ease_of_use,
        avatar_clarity: answers.avatar_clarity,
        response_clarity: answers.response_clarity,
        trust: answers.trust,
      },
      comments: answers.comments.trim() || null,
    };

    // In production: POST feedbackData to your research API endpoint.
    // For this prototype: log to console and store in window object.
    console.log("📋 Feedback submitted:", feedbackData);
    window.__lastFeedback = feedbackData;

    onSubmit?.(feedbackData);
    setSubmitted(true);
  };

  // ── Thank you screen ─────────────────────────────────────────────────
  if (submitted) {
    return (
      <>
        <style>{styles}</style>
        <div className="fb-wrapper fb-thankyou" role="status" aria-live="polite">
          <div className="thankyou-icon" aria-hidden="true">✅</div>
          <h2 className="thankyou-title">Thank you for your feedback!</h2>
          <p className="thankyou-body">
            Your responses help us improve the health avatar experience.
            This information will be used for research purposes only.
          </p>
          <button className="fb-btn fb-btn--primary" onClick={onClose}>
            Close
          </button>
        </div>
      </>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="fb-wrapper"
        role="region"
        aria-label="Research feedback form"
      >
        {/* ── Header ── */}
        <div className="fb-header">
          <div className="fb-header-text">
            <h2 className="fb-title">Share Your Feedback</h2>
            <p className="fb-subtitle">
              Help us improve this health AI experience. Takes about 1 minute.
            </p>
          </div>
          <button
            className="fb-close"
            onClick={onClose}
            aria-label="Close feedback form"
          >
            ✕
          </button>
        </div>

        {/* ── Research notice ── */}
        <div className="fb-notice" role="note">
          <span aria-hidden="true">🔒</span>
          Your responses are anonymous and used for research purposes only.
        </div>

        {/* ── Questions ── */}
        <div className="fb-questions">
          {QUESTIONS.map((q, i) => (
            <div key={q.id} className="fb-question">
              <label
                className="fb-question-label"
                htmlFor={q.type === "textarea" ? q.id : undefined}
              >
                <span className="question-number">{i + 1}</span>
                {q.label}
              </label>

              {q.type === "stars" && (
                <StarRating
                  questionId={q.id}
                  value={answers[q.id]}
                  onChange={(val) => handleChange(q.id, val)}
                />
              )}

              {q.type === "textarea" && (
                <textarea
                  id={q.id}
                  className="fb-textarea"
                  value={answers[q.id]}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  rows={3}
                  aria-label={q.label}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="fb-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="fb-actions">
          <button
            className="fb-btn fb-btn--secondary"
            onClick={onClose}
            type="button"
          >
            Skip for now
          </button>
          <button
            className="fb-btn fb-btn--primary"
            onClick={handleSubmit}
            type="button"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </>
  );
}


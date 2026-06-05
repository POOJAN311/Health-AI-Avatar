import { useState, useRef, useEffect } from "react";

// ─── Simulated transcriptions ─────────────────────────────────────────────
// In production these would come from a Whisper / speech-to-text API.
const SIMULATED_TRANSCRIPTIONS = [
  "I have been having headaches lately, what could be causing them?",
  "Can you tell me more about managing high blood pressure?",
  "I have been feeling really tired and can't sleep well.",
  "What should I know about my diabetes medication?",
  "I have been feeling very stressed and anxious recently.",
  "Can you explain what blood sugar levels mean?",
];

function getSimulatedTranscription() {
  return SIMULATED_TRANSCRIPTIONS[
    Math.floor(Math.random() * SIMULATED_TRANSCRIPTIONS.length)
  ];
}

// ─── Recording states ─────────────────────────────────────────────────────
const STATE = {
  IDLE: "idle",
  REQUESTING: "requesting", // waiting for mic permission
  RECORDING: "recording",
  PROCESSING: "processing", // simulating transcription
  ERROR: "error",
};

// ─── UI labels & colors per state ────────────────────────────────────────
const STATE_UI = {
  [STATE.IDLE]: {
    label: "Hold to Speak",
    sublabel: "Push and hold the button while speaking",
    color: "#1A6B7C",
    pulse: false,
  },
  [STATE.REQUESTING]: {
    label: "Requesting Mic…",
    sublabel: "Please allow microphone access",
    color: "#7C6B1A",
    pulse: false,
  },
  [STATE.RECORDING]: {
    label: "Listening…",
    sublabel: "Release when you're done speaking",
    color: "#C0392B",
    pulse: true,
  },
  [STATE.PROCESSING]: {
    label: "Processing…",
    sublabel: "Transcribing your message",
    color: "#1A6B7C",
    pulse: false,
  },
  [STATE.ERROR]: {
    label: "Mic Unavailable",
    sublabel: "Check browser permissions and try again",
    color: "#555",
    pulse: false,
  },
};

// ─── Main Component ───────────────────────────────────────────────────────

/**
 * PushToTalk
 *   onAvatarStateChange(state: string) — drives avatar listening/thinking states
 *   disabled: bool — disables the button while chat is processing a response
 */
export default function PushToTalk({ onAvatarStateChange, disabled = false }) {
  const [recordState, setRecordState] = useState(STATE.IDLE);
  const [errorMsg, setErrorMsg] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribedText, setTranscribedText] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const isHoldingRef = useRef(false); // guards against release firing before start

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  // ── Timer while recording ──────────────────────────────────────────────
  const startTimer = () => {
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((s) => {
        // Auto-stop after 30 seconds
        if (s >= 29) {
          handleRecordingStop();
          return 30;
        }
        return s + 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // ── Clean up mic stream ────────────────────────────────────────────────
  const stopEverything = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  };

  // ── Start recording ───────────────────────────────────────────────────
  const handleRecordingStart = async () => {
    if (disabled || recordState !== STATE.IDLE) return;
    isHoldingRef.current = true;
    setErrorMsg("");
    setTranscribedText("");
    setRecordState(STATE.REQUESTING);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If user released button before permission granted, abort
      if (!isHoldingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        setRecordState(STATE.IDLE);
        return;
      }

      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // Audio blob is available here.
        // In production: POST chunksRef.current to your speech-to-text API.
        // For this prototype: simulate transcription after a short delay.
        handleTranscription();
      };

      mediaRecorder.start(100); // collect chunks every 100ms
      setRecordState(STATE.RECORDING);
      onAvatarStateChange?.("listening");
      startTimer();
    } catch (err) {
      isHoldingRef.current = false;
      setRecordState(STATE.ERROR);
      if (err.name === "NotAllowedError") {
        setErrorMsg("Microphone permission denied. Please allow access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setErrorMsg("No microphone found. Please connect a microphone and try again.");
      } else {
        setErrorMsg("Could not access microphone: " + err.message);
      }
    }
  };

  // ── Stop recording ────────────────────────────────────────────────────
  const handleRecordingStop = () => {
    isHoldingRef.current = false;
    if (recordState !== STATE.RECORDING) return;
    stopTimer();
    setRecordState(STATE.PROCESSING);
    onAvatarStateChange?.("thinking");

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop(); // triggers onstop → handleTranscription
    }

    // Stop mic track (releases browser mic indicator)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // ── Simulate transcription & inject into chat ──────────────────────────
  const handleTranscription = () => {
    // Simulate a 800ms transcription delay
    setTimeout(() => {
      const text = getSimulatedTranscription();
      setTranscribedText(text);
      setRecordState(STATE.IDLE);

      // Inject into ChatInterface
      if (typeof window.__injectVoiceMessage === "function") {
        window.__injectVoiceMessage(text);
      } else {
        console.warn("PushToTalk: window.__injectVoiceMessage not found. Is ChatInterface mounted?");
      }
    }, 800);
  };

  // ── Pointer / touch / keyboard events ────────────────────────────────
  // Using pointer events so it works on both mouse and touch devices.

  const handlePointerDown = (e) => {
    e.preventDefault(); // prevent text selection on long press
    handleRecordingStart();
  };

  const handlePointerUp = () => {
    if (recordState === STATE.RECORDING || recordState === STATE.REQUESTING) {
      handleRecordingStop();
    }
  };

  const handlePointerLeave = () => {
    // Stop if finger/cursor leaves the button
    if (recordState === STATE.RECORDING) {
      handleRecordingStop();
    }
  };

  // Keyboard: Space or Enter to toggle
  const handleKeyDown = (e) => {
    if ((e.key === " " || e.key === "Enter") && recordState === STATE.IDLE) {
      e.preventDefault();
      handleRecordingStart();
    }
  };

  const handleKeyUp = (e) => {
    if ((e.key === " " || e.key === "Enter") && recordState === STATE.RECORDING) {
      e.preventDefault();
      handleRecordingStop();
    }
  };

  // ── Derived UI values ─────────────────────────────────────────────────
  const ui = STATE_UI[recordState];
  const isRecording = recordState === STATE.RECORDING;
  const isProcessing = recordState === STATE.PROCESSING;
  const isDisabled = disabled || recordState === STATE.PROCESSING || recordState === STATE.ERROR;

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <>

      <div className="ptt-wrapper" role="region" aria-label="Push to talk voice input">

        {/* ── Main mic button ── */}
        <div className="ptt-button-area">
          <button
            className={`ptt-btn ${isRecording ? "ptt-recording" : ""} ${isProcessing ? "ptt-processing" : ""}`}
            style={{ "--btn-color": ui.color }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            disabled={isDisabled}
            aria-label={
              isRecording
                ? "Recording in progress. Release to stop."
                : "Push and hold to speak"
            }
            aria-pressed={isRecording}
          >
            {/* Pulse rings — shown while recording */}
            {ui.pulse && (
              <>
                <span className="pulse-ring pulse-ring-1" aria-hidden="true" />
                <span className="pulse-ring pulse-ring-2" aria-hidden="true" />
              </>
            )}

            {/* Icon */}
            <span className="ptt-icon" aria-hidden="true">
              {isProcessing ? (
                <span className="ptt-spinner" />
              ) : isRecording ? (
                // Stop square icon
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                // Microphone icon
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="9" y1="22" x2="15" y2="22" />
                </svg>
              )}
            </span>
          </button>

          {/* Recording timer */}
          {isRecording && (
            <div className="ptt-timer" aria-live="polite" aria-label={`Recording time: ${formatTime(recordingSeconds)}`}>
              <span className="timer-dot" aria-hidden="true" />
              {formatTime(recordingSeconds)}
            </div>
          )}
        </div>

        {/* ── Status label ── */}
        <div className="ptt-labels">
          <span className="ptt-label" aria-live="polite">{ui.label}</span>
          <span className="ptt-sublabel">{ui.sublabel}</span>
        </div>

        {/* ── Last transcription preview ── */}
        {transcribedText && recordState === STATE.IDLE && (
          <div className="ptt-transcript" role="status" aria-live="polite">
            <span className="transcript-icon" aria-hidden="true">🎙️</span>
            <span className="transcript-text">"{transcribedText}"</span>
          </div>
        )}

        {/* ── Error message ── */}
        {recordState === STATE.ERROR && errorMsg && (
          <div className="ptt-error" role="alert">
            <span>⚠️ {errorMsg}</span>
            <button
              className="ptt-retry"
              onClick={() => setRecordState(STATE.IDLE)}
              aria-label="Retry microphone access"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </>
  );
}


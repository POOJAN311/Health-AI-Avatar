import { useState, useEffect, useRef, useCallback } from "react";

// ─── useTTS hook ──────────────────────────────────────────────────────────
export function useTTS({ onStateChange } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Store callback in ref so speak() never needs to be recreated
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Chrome keepalive — Chrome silently pauses synthesis after ~15s.
  // Calling pause()+resume() every 10s prevents this.
  const keepaliveRef = useRef(null);

  const startKeepalive = useCallback(() => {
    stopKeepalive();
    keepaliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }, []);

  const stopKeepalive = useCallback(() => {
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current);
      keepaliveRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopKeepalive();
    };
  }, [stopKeepalive]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    stopKeepalive();
    setIsSpeaking(false);
    onStateChangeRef.current?.("idle");
  }, [stopKeepalive]);

  // getVoices() returns [] on first call in Chrome until voices load.
  // This returns a Promise that resolves with the voices list.
  const getVoicesAsync = () =>
    new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(window.speechSynthesis.getVoices());
        };
        // Fallback: if onvoiceschanged never fires, resolve after 500ms
        setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
      }
    });

  // speak() is stable — never recreated after mount
  const speak = useCallback(
    async (text) => {
      if (!text) return;

      // Cancel anything currently playing
      window.speechSynthesis.cancel();
      stopKeepalive();

      // Small delay required: cancel() is async internally in Chrome.
      // Without this, the new utterance sometimes doesn't start.
      await new Promise((r) => setTimeout(r, 150));

      const utterance = new SpeechSynthesisUtterance(text);

      // Pick a calm English voice if available
      const voices = await getVoicesAsync();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.toLowerCase().includes("samantha") ||
            v.name.toLowerCase().includes("karen") ||
            v.name.toLowerCase().includes("daniel") ||
            v.name.toLowerCase().includes("google us english"))
      );
      // Fallback: first English voice, then whatever's available
      const fallback = voices.find((v) => v.lang.startsWith("en")) || voices[0];
      if (preferred || fallback) utterance.voice = preferred || fallback;

      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        onStateChangeRef.current?.("speaking");
        startKeepalive();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        stopKeepalive();
        onStateChangeRef.current?.("idle");
      };

      utterance.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") {
          console.warn("TTS error:", e.error);
        }
        setIsSpeaking(false);
        stopKeepalive();
        onStateChangeRef.current?.("idle");
      };

      window.speechSynthesis.speak(utterance);
    },
    [startKeepalive, stopKeepalive] // onStateChange intentionally excluded — use ref instead
  );

  return { speak, stop, isSpeaking };
}

// ─── TextToSpeech UI Component ────────────────────────────────────────────
export default function TextToSpeech({
  lastMessage = "",
  onAvatarStateChange,
  autoSpeak = true,
}) {
  const { speak, stop, isSpeaking } = useTTS({ onStateChange: onAvatarStateChange });
  const [showSettings, setShowSettings] = useState(false);
  const [rate, setRate] = useState(0.92);
  const [volume, setVolume] = useState(1.0);
  const [supported] = useState(() => "speechSynthesis" in window);

  // Track previous message with a ref — NOT in state to avoid re-renders
  const prevMessageRef = useRef("");

  // Auto-speak when lastMessage changes
  // speak is stable (useCallback with no changing deps) so safe in dep array
  useEffect(() => {
    if (!autoSpeak || !supported) return;
    if (!lastMessage) return;
    if (lastMessage === prevMessageRef.current) return;

    prevMessageRef.current = lastMessage;
    speak(lastMessage);
  }, [lastMessage]); // intentionally only lastMessage — speak is stable

  const handlePlayPause = () => {
    if (isSpeaking) {
      stop();
    } else if (lastMessage) {
      // Reset ref so manual re-play always works
      prevMessageRef.current = "";
      speak(lastMessage);
    }
  };

  if (!supported) {
    return (
      <div className="tts-unsupported" role="note">
        ⚠️ Text-to-speech is not supported in this browser. Try Chrome or Edge.
      </div>
    );
  }

  return (
    <>
      <div
        className={`tts-bar ${isSpeaking ? "tts-bar--speaking" : ""}`}
        role="region"
        aria-label="Text to speech controls"
      >
        {/* Waveform */}
        <div
          className={`tts-waveform ${isSpeaking ? "tts-waveform--active" : ""}`}
          aria-hidden="true"
        >
          {[...Array(7)].map((_, i) => (
            <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>

        {/* Status */}
        <span className="tts-status" aria-live="polite">
          {isSpeaking ? "Speaking…" : lastMessage ? "Response ready" : "Waiting for response"}
        </span>

        {/* Controls */}
        <div className="tts-controls">
          <button
            className={`tts-btn ${isSpeaking ? "tts-btn--stop" : "tts-btn--play"}`}
            onClick={handlePlayPause}
            disabled={!lastMessage}
            aria-label={isSpeaking ? "Stop speaking" : "Read response aloud"}
          >
            {isSpeaking ? (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          <button
            className={`tts-btn tts-btn--settings ${showSettings ? "tts-btn--active" : ""}`}
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Toggle speech settings"
            aria-expanded={showSettings}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="tts-settings" role="group" aria-label="Speech settings">
            <label className="tts-setting-row">
              <span className="setting-label">Speed</span>
              <input
                type="range" min="0.5" max="1.5" step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                aria-label={`Speech rate: ${rate}`}
                className="tts-slider"
              />
              <span className="setting-value">{rate.toFixed(2)}x</span>
            </label>
            <label className="tts-setting-row">
              <span className="setting-label">Volume</span>
              <input
                type="range" min="0" max="1" step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label={`Volume: ${Math.round(volume * 100)}%`}
                className="tts-slider"
              />
              <span className="setting-value">{Math.round(volume * 100)}%</span>
            </label>
          </div>
        )}
      </div>
    </>
  );
}
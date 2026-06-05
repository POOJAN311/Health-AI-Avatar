import { useState, useEffect, useRef } from "react";
import ChatInterface from "./components/ChatInterface";
import PushToTalk from "./components/PushToTalk";
import TextToSpeech from "./components/TextToSpeech";
import FeedbackForm from "./components/FeedbackForm";
import * as THREE from "three";
import './App.css';
// ─── Avatar state config ─────────────────────────────────────────────────
// Maps each avatar state to visual properties Three.js will animate toward.
const AVATAR_STATES = {
  idle: {
    color: new THREE.Color("#1A6B7C"),
    emissive: new THREE.Color("#0a2a30"),
    pulseSpeed: 0.6,
    pulseAmplitude: 0.04,
    rotationSpeed: 0.003,
    scale: 1.0,
    ringColor: new THREE.Color("#1A6B7C"),
    ringOpacity: 0.15,
    label: "Idle",
    labelColor: "#67c9dc",
  },
  listening: {
    color: new THREE.Color("#1A7C6B"),
    emissive: new THREE.Color("#0a302a"),
    pulseSpeed: 2.2,
    pulseAmplitude: 0.08,
    rotationSpeed: 0.005,
    scale: 1.06,
    ringColor: new THREE.Color("#1db992"),
    ringOpacity: 0.35,
    label: "Listening…",
    labelColor: "#1db992",
  },
  thinking: {
    color: new THREE.Color("#7C6B1A"),
    emissive: new THREE.Color("#302a0a"),
    pulseSpeed: 1.4,
    pulseAmplitude: 0.03,
    rotationSpeed: 0.018,
    scale: 1.0,
    ringColor: new THREE.Color("#f5a623"),
    ringOpacity: 0.25,
    label: "Thinking…",
    labelColor: "#f5a623",
  },
  speaking: {
    color: new THREE.Color("#2E86AB"),
    emissive: new THREE.Color("#0d2f3d"),
    pulseSpeed: 3.5,
    pulseAmplitude: 0.1,
    rotationSpeed: 0.006,
    scale: 1.08,
    ringColor: new THREE.Color("#2E86AB"),
    ringOpacity: 0.4,
    label: "Speaking…",
    labelColor: "#67c9dc",
  },
  supportive: {
    color: new THREE.Color("#2E7D52"),
    emissive: new THREE.Color("#0d2d1d"),
    pulseSpeed: 0.8,
    pulseAmplitude: 0.05,
    rotationSpeed: 0.004,
    scale: 1.03,
    ringColor: new THREE.Color("#4ade80"),
    ringOpacity: 0.2,
    label: "Here for you",
    labelColor: "#4ade80",
  },
  warning: {
    color: new THREE.Color("#8B1A1A"),
    emissive: new THREE.Color("#3d0808"),
    pulseSpeed: 4.0,
    pulseAmplitude: 0.12,
    rotationSpeed: 0.002,
    scale: 1.0,
    ringColor: new THREE.Color("#ef4444"),
    ringOpacity: 0.5,
    label: "Urgent",
    labelColor: "#fca5a5",
  },
};

// ─── Three.js Avatar ─────────────────────────────────────────────────────
function AvatarDisplay({ state }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});

  useEffect(() => {
    const el = mountRef.current;
    const W = el.clientWidth;
    const H = el.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Scene & camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const point1 = new THREE.PointLight(0x67c9dc, 2.5, 20);
    point1.position.set(3, 3, 3);
    scene.add(point1);
    const point2 = new THREE.PointLight(0x1A6B7C, 1.5, 20);
    point2.position.set(-3, -2, 2);
    scene.add(point2);

    // Core sphere (the avatar)
    const geo = new THREE.IcosahedronGeometry(1, 4);
    const mat = new THREE.MeshStandardMaterial({
      color: AVATAR_STATES.idle.color,
      emissive: AVATAR_STATES.idle.emissive,
      roughness: 0.25,
      metalness: 0.7,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Inner glow sphere
    const glowGeo = new THREE.SphereGeometry(0.88, 32, 32);
    const glowMat = new THREE.MeshStandardMaterial({
      color: AVATAR_STATES.idle.color,
      emissive: AVATAR_STATES.idle.color,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.18,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);

    // Orbit ring 1
    const ring1Geo = new THREE.TorusGeometry(1.55, 0.018, 16, 120);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: AVATAR_STATES.idle.ringColor,
      transparent: true,
      opacity: AVATAR_STATES.idle.ringOpacity,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    // Orbit ring 2
    const ring2Geo = new THREE.TorusGeometry(1.8, 0.012, 16, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: AVATAR_STATES.idle.ringColor,
      transparent: true,
      opacity: AVATAR_STATES.idle.ringOpacity * 0.6,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 6;
    scene.add(ring2);

    // Particle field
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.2 + Math.random() * 1.2;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const partGeo = new THREE.BufferGeometry();
    partGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0x67c9dc,
      size: 0.035,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // Store refs for animation loop
    sceneRef.current = {
      renderer, scene, camera,
      mesh, mat, glowMesh, glowMat,
      ring1, ring1Mat, ring2, ring2Mat,
      particles, partMat,
      point1, point2,
    };

    // Resize handler
    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Animation loop ────────────────────────────────────────────────
    let frameId;
    let t = 0;
    // Smooth interpolation targets
    let currentScale = 1.0;
    let currentRotSpeed = 0.003;
    let currentPulseSpeed = 0.6;
    let currentPulseAmp = 0.04;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.016;

      const cfg = AVATAR_STATES[sceneRef.current.avatarState || "idle"];

      // Lerp rotation speed
      currentRotSpeed += (cfg.rotationSpeed - currentRotSpeed) * 0.05;
      currentPulseSpeed += (cfg.pulseSpeed - currentPulseSpeed) * 0.05;
      currentPulseAmp += (cfg.pulseAmplitude - currentPulseAmp) * 0.05;
      currentScale += (cfg.scale - currentScale) * 0.06;

      // Rotate
      mesh.rotation.y += currentRotSpeed;
      mesh.rotation.x += currentRotSpeed * 0.3;
      ring1.rotation.z += 0.004;
      ring2.rotation.z -= 0.003;
      ring2.rotation.x += 0.002;
      particles.rotation.y += 0.001;

      // Pulse scale
      const pulse = 1 + Math.sin(t * currentPulseSpeed) * currentPulseAmp;
      mesh.scale.setScalar(currentScale * pulse);
      glowMesh.scale.setScalar(currentScale * pulse * 1.02);

      // Lerp colors
      mat.color.lerp(cfg.color, 0.04);
      mat.emissive.lerp(cfg.emissive, 0.04);
      glowMat.color.lerp(cfg.color, 0.04);
      glowMat.emissive.lerp(cfg.color, 0.04);
      ring1Mat.color.lerp(cfg.ringColor, 0.04);
      ring2Mat.color.lerp(cfg.ringColor, 0.04);
      ring1Mat.opacity += (cfg.ringOpacity - ring1Mat.opacity) * 0.05;
      ring2Mat.opacity += (cfg.ringOpacity * 0.6 - ring2Mat.opacity) * 0.05;

      // Point light color follows state
      point1.color.lerp(cfg.ringColor, 0.03);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  // Pass current state into the animation loop via ref
  useEffect(() => {
    sceneRef.current.avatarState = state;
  }, [state]);

  const cfg = AVATAR_STATES[state] || AVATAR_STATES.idle;

  return (
    <div className="avatar-container">
      <div ref={mountRef} className="avatar-canvas" aria-label={`Avatar state: ${cfg.label}`} role="img" />
      <div className="avatar-state-badge" style={{ color: cfg.labelColor }}>
        <span className="state-dot" style={{ background: cfg.labelColor }} aria-hidden="true" />
        {cfg.label}
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [avatarState, setAvatarState] = useState("idle");
  const [lastMessage, setLastMessage] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);


  // Show feedback button after 2 exchanges
  const handleNewMessage = (text) => {
    setLastMessage(text);
    setExchangeCount((c) => c + 1);
  };

  return (
    <>


      <div className="app-root">

        {/* ── Background grid ── */}
        <div className="bg-grid" aria-hidden="true" />
        <div className="bg-glow" aria-hidden="true" />

        {/* ── Header ── */}
        <header className="app-header">
          <div className="app-logo">
            <span className="logo-dot" aria-hidden="true" />
            <span className="logo-text">HealthCoach <span className="logo-ai">AI</span></span>
          </div>
          <div className="header-right">
            <span className="header-badge">Research Prototype</span>
            {exchangeCount >= 2 && !feedbackDone && (
              <button
                className="feedback-trigger-btn"
                onClick={() => setShowFeedback(true)}
                aria-label="Open feedback form"
              >
                💬 Give Feedback
              </button>
            )}
          </div>
        </header>

        {/* ── Main layout ── */}
        <main className="app-main">

          {/* ── Left panel: Avatar + controls ── */}
          <aside className="left-panel" aria-label="Avatar and voice controls">
            <AvatarDisplay state={avatarState} />

            {/* TTS bar */}
            <div className="tts-section">
              <TextToSpeech
                lastMessage={lastMessage}
                onAvatarStateChange={setAvatarState}
                autoSpeak={true}
              />
            </div>

            {/* Push to talk */}
            <div className="ptt-section">
              <PushToTalk
                onAvatarStateChange={setAvatarState}
                disabled={avatarState === "thinking"}
              />
            </div>

            {/* State legend */}
            <div className="state-legend" aria-label="Avatar state legend">
              {Object.entries(AVATAR_STATES).map(([key, val]) => (
                <div
                  key={key}
                  className={`legend-item ${avatarState === key ? "legend-active" : ""}`}
                  onClick={() => setAvatarState(key)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Preview ${val.label} state`}
                  onKeyDown={(e) => e.key === "Enter" && setAvatarState(key)}
                >
                  <span className="legend-dot" style={{ background: val.labelColor }} aria-hidden="true" />
                  <span className="legend-label">{val.label}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Right panel: Chat ── */}
          <section className="right-panel" aria-label="Chat interface">
            <ChatInterface
              onAvatarStateChange={setAvatarState}
              onNewMessage={handleNewMessage}
            />
          </section>
        </main>

        {/* ── Feedback modal ── */}
        {showFeedback && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Feedback form"
            onClick={(e) => e.target === e.currentTarget && setShowFeedback(false)}
          >
            <div className="modal-inner">
              <FeedbackForm
                onClose={() => setShowFeedback(false)}
                onSubmit={(data) => {
                  console.log("Feedback received:", data);
                  setShowFeedback(false);
                  setFeedbackDone(true);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

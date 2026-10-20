import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Bouquet } from "./components/Bouquet.jsx";
import { FallingPetals } from "./components/FallingPetals.jsx";
import { Heart, RotateCcw, X } from "lucide-react";
import { recipients } from "./config/recipients.js";
import { MusicPlayer } from "./components/MusicPlayer.jsx";

function Scene({ recipient, controlsRef }) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 700;

  return (
    <Canvas
      camera={{
        position: mobile ? [0, 2.05, 9] : [0, 2.05, 8.4],
        fov: mobile ? 42 : 39,
      }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={[recipient.id === "mother" ? "#f5ede2" : "#f4e9e6"]} />
      <fog attach="fog" args={[recipient.id === "mother" ? "#f5ede2" : "#f4e9e6", 12.2, 22]} />
      <ambientLight intensity={0.86} />
      <directionalLight
        position={[-4.8, 7.8, 5.2]}
        intensity={2.35}
        color="#fff8e8"
        castShadow
      />
      <directionalLight
        position={[5.2, 3.4, -2.2]}
        intensity={1.15}
        color="#efcbd0"
      />
      <pointLight
        position={[0, 3.4, 3.8]}
        intensity={10.5}
        color="#d8b98b"
        distance={15}
      />
      <pointLight
        position={[0, 0.9, -4.5]}
        intensity={4.2}
        color="#a7b5a0"
        distance={14}
      />

      <group position={[0, 0.05, 0]} scale={mobile ? 0.98 : 1.04}>
        <Bouquet recipient={recipient} />
      </group>
      <FallingPetals color={recipient.palette.petal} />

      <OrbitControls
        ref={controlsRef}
        target={[0, 0.68, 0]}
        minDistance={6.5}
        maxDistance={11.5}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
        enablePan={false}
        enableDamping
        dampingFactor={0.055}
        autoRotate
        autoRotateSpeed={0.18}
      />
    </Canvas>
  );
}

export default function App() {
  const controlsRef = useRef(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const [recipientId, setRecipientId] = useState("mother");
  const [sceneChanging, setSceneChanging] = useState(false);
  const recipient = recipients[recipientId];

  const selectRecipient = (nextRecipient) => {
    if (nextRecipient === recipientId) return;
    setSceneChanging(true);
    window.setTimeout(() => {
      setRecipientId(nextRecipient);
      setSceneChanging(false);
    }, 240);
  };

  useEffect(() => {
    if (!letterOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setLetterOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [letterOpen]);

  return (
    <main className="experience is-ready" style={{ "--petal-color": recipient.palette.petal, "--accent-color": recipient.palette.ribbon[0] }}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="wordmark">
        Family <i>Blossoms</i>
        <span>WITH LOVE &amp; GRATITUDE</span>
      </div>

      <div className="top-actions">
        <MusicPlayer />
        <button className="icon-button" aria-label="Đặt lại góc nhìn bó hoa" title="Đặt lại góc nhìn" onClick={() => controlsRef.current?.reset()}>
          <RotateCcw aria-hidden="true" />
        </button>
        <button
          className="icon-button help-button"
          aria-label="Hướng dẫn xoay và phóng to"
          title="Kéo để xoay · Cuộn để phóng to"
        >
          <span>?</span>
        </button>
      </div>

      <div className="for-you">20 · 10</div>

      <div className={`scene-wrap ${sceneChanging ? "is-changing" : ""}`}>
        <Scene recipient={recipient} controlsRef={controlsRef} />
      </div>

      <div className="side-caption">
        <span>20 / 10</span>
        <span className="caption-line" />
        <span>GỬI NHỮNG NGƯỜI PHỤ NỮ YÊU THƯƠNG</span>
      </div>

      <section className="bottom-content">
        <p className="eyebrow">
          <span /> 20/10 · GỬI NHỮNG NGƯỜI PHỤ NỮ YÊU THƯƠNG <span />
        </p>
        <h1>Family <em>Blossoms</em></h1>
        <p className="subtitle">With Love &amp; Gratitude · Bó hoa dành tặng {recipient.name}</p>

        <div className="dedication">
          <p className="dedication-title">
            <Heart /> {recipient.flowerTitle}
          </p>
          <div className="recipient-switch" role="group" aria-label="Chọn người nhận lời chúc">
            {Object.values(recipients).map((item) => (
              <button key={item.id} className={recipientId === item.id ? "is-selected" : ""} onClick={() => selectRecipient(item.id)} aria-pressed={recipientId === item.id}>
                {item.label}
              </button>
            ))}
          </div>
          <button
            className="letter-trigger"
            onClick={() => setLetterOpen(true)}
          >
            <span>Gửi {recipient.name} lời chúc yêu thương ❤️</span>
            <span className="letter-trigger-link">Đọc lời chúc</span>
          </button>
        </div>
      </section>

      <div className="corner-mark">
        MỪNG NGÀY 20/10
        <br />
        FAMILY BLOSSOMS <span>✳</span>
      </div>

      {letterOpen && (
        <div className="letter-overlay" onClick={() => setLetterOpen(false)}>
          <section
            className="letter-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="letter-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="letter-close"
              onClick={() => setLetterOpen(false)}
              aria-label="Đóng thư"
            >
              <X />
            </button>
            <p className="letter-eyebrow">MỘT LỜI NHẮN GỬI {recipient.name.toUpperCase()}</p>
            <h2 id="letter-title">{recipient.title}</h2>
            <div className="letter-body">
              {recipient.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <p className="letter-signoff">{recipient.closing}</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

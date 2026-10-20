import React, { useEffect, useRef, useState } from "react";
import { Music2, Pause } from "lucide-react";

export function MusicPlayer() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    let cancelled = false;
    audio.volume = 0.38;
    audio.play().then(() => {
      if (!cancelled) {
        setPlaying(true);
        setAutoplayBlocked(false);
      } else {
        audio.pause();
      }
    }).catch(() => {
      if (!cancelled) setAutoplayBlocked(true);
    });
    return () => {
      cancelled = true;
      audio.pause();
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
      setAutoplayBlocked(false);
    } catch {
      setPlaying(false);
      setAutoplayBlocked(true);
    }
  };

  return (
    <div className="music-player">
      <button className="icon-button" aria-label={playing ? "Tạm dừng nhạc nền" : "Bật nhạc nền"} title={playing ? "Tạm dừng nhạc" : "Bật Soft Piano"} onClick={togglePlayback}>
        {playing ? <Pause aria-hidden="true" /> : <Music2 aria-hidden="true" />}
      </button>
      {autoplayBlocked && <button className="autoplay-prompt" onClick={togglePlayback}>Chạm để bật nhạc</button>}
      <audio ref={audioRef} src="/audio/soft-piano.mp3" preload="auto" autoPlay loop />
    </div>
  );
}

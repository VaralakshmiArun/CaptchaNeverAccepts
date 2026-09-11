import React, { useState, useCallback } from 'react';
import Captcha from './Captcha.jsx';
import {
  TerminalLog,
  MemeModal,
  getRandomMemeIndex,
  getRandomTilt,
} from './MemeGallery.jsx';

const HISTORY_LIMIT = 6;

export default function App() {
  const [history, setHistory] = useState([]);
  const [modalMemeIndex, setModalMemeIndex] = useState(null);
  const [modalTilt, setModalTilt] = useState('rotate-0');

  const handleVerified = useCallback(() => {
    setHistory((prevHistory) => {
      const lastShown = prevHistory[0];
      const nextIndex = getRandomMemeIndex(lastShown);
      setModalMemeIndex(nextIndex);
      setModalTilt(getRandomTilt());
      return [nextIndex, ...prevHistory].slice(0, HISTORY_LIMIT);
    });
  }, []);

  const closeModal = useCallback(() => setModalMemeIndex(null), []);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10 sm:py-16 gap-8">
      <header className="text-center max-w-lg">
        <p className="uppercase tracking-[0.3em] text-xs text-zinc-500 mb-2">
          hackathon demo — 0% pass rate
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-white">
          Prove you're <span className="text-glitch">not</span> a robot.
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Spoiler: it doesn't matter. Nobody gets through. Not even us.
        </p>
      </header>

      <div className="w-full flex flex-col md:flex-row items-start justify-center gap-6">
        <Captcha onVerified={handleVerified} />
        <TerminalLog />
      </div>

      <footer className="text-zinc-600 text-xs text-center pt-4">
        CaptchaNeverAccepts — built for maximum humiliation, zero accessibility to humans.
      </footer>

      {modalMemeIndex !== null && (
        <MemeModal memeIndex={modalMemeIndex} tilt={modalTilt} onClose={closeModal} />
      )}
    </div>
  );
}
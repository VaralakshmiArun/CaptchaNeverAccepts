import React from 'react';

// Original, self-contained "meme" cards — no external images, no copyright
// concerns, just bold captions over big emoji in the classic top/bottom
// meme layout, plus a one-line caption. One is picked at random every time
// the captcha fails.
export const MEMES = [
  { top: 'TRY AGAIN', bottom: 'HUMAN', emoji: '🙅', bg: 'from-pink-600 to-purple-700', caption: "The system has reviewed your attempt and found it lacking." },
  { top: 'NICE TRY', bottom: 'STILL NO', emoji: '🚫', bg: 'from-cyan-600 to-blue-800', caption: "Effort noted. Effort irrelevant." },
  { top: 'ACCESS', bottom: 'DENIED FOREVER', emoji: '🔒', bg: 'from-lime-600 to-green-800', caption: "This door was never going to open. Ever." },
  { top: 'ONE JOB', bottom: 'YOU FAILED IT', emoji: '🤡', bg: 'from-orange-600 to-red-700', caption: "A single task. A complete failure." },
  { top: 'CAPTCHA:', bottom: 'UNDEFEATED', emoji: '🏆', bg: 'from-yellow-500 to-amber-700', caption: "Current record: perfect. Yours: not." },
  { top: 'ERROR 404', bottom: 'DIGNITY NOT FOUND', emoji: '📉', bg: 'from-fuchsia-600 to-pink-800', caption: "We looked everywhere. It's just gone." },
  { top: 'ROBOTS: 1', bottom: 'YOU: 0', emoji: '🤖', bg: 'from-slate-600 to-slate-900', caption: "The machines are, in fact, winning." },
  { top: 'BETTER', bottom: 'LUCK NEVER', emoji: '🎲', bg: 'from-teal-600 to-emerald-800', caption: "Luck was never the variable holding you back." },
  { top: 'CERTIFIED', bottom: 'NOT HUMAN', emoji: '👽', bg: 'from-violet-600 to-indigo-800', caption: "Ironically, failing this hard is very human of you." },
  { top: 'THIS IS', bottom: 'FINE', emoji: '🔥', bg: 'from-red-600 to-orange-800', caption: "Everything is under control. Nothing is under control." },
];

function pickRandomMeme(excludeIndex) {
  if (MEMES.length <= 1) return 0;
  let idx = Math.floor(Math.random() * MEMES.length);
  while (idx === excludeIndex) {
    idx = Math.floor(Math.random() * MEMES.length);
  }
  return idx;
}

export function getRandomMemeIndex(excludeIndex) {
  return pickRandomMeme(excludeIndex);
}

// A handful of fixed tilt angles so the popup card looks "slapped down"
// rather than perfectly centered — picked randomly per popup.
const TILTS = ['-rotate-6', '-rotate-3', 'rotate-2', 'rotate-3', 'rotate-6', '-rotate-2'];
export function getRandomTilt() {
  return TILTS[Math.floor(Math.random() * TILTS.length)];
}

// ---------------------------------------------------------------------------
// Idle panel — a fake system terminal that scrolls denial log lines while
// nothing else is happening. Themed like a hacker-movie console.
// ---------------------------------------------------------------------------
const LOG_LINES = [
  '[SYS] Human verification module initialized.',
  '[SCAN] Analyzing input patterns...',
  '[WARN] Suspicious level of trying detected.',
  '[SEC] Trust score: 0%. Holding steady at 0%.',
  '[INFO] No known captcha has ever been solved here.',
  '[SCAN] Cross-referencing with database of Things That Work. No match.',
  '[SEC] Access gate status: permanently sealed.',
  '[INFO] Recalculating odds of success... odds unchanged.',
  '[WARN] User persistence: admirable. User progress: none.',
  '[SYS] Standing by to reject the next attempt.',
];

export function TerminalLog() {
  const [lines, setLines] = React.useState([LOG_LINES[0]]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLines((prev) => {
        const next = LOG_LINES[Math.floor(Math.random() * LOG_LINES.length)];
        return [...prev, next].slice(-8);
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md bg-panel border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <h2 className="font-display text-xl text-toxic mb-4">Live Denial Log</h2>
      <div className="w-full h-72 bg-black/70 border border-toxic/20 rounded-xl p-4 overflow-hidden font-mono text-xs text-toxic/90 flex flex-col justify-end">
        {lines.map((line, i) => (
          <p key={i} className="leading-relaxed whitespace-pre-wrap">
            <span className="text-zinc-600">$</span> {line}
          </p>
        ))}
        <p className="leading-relaxed">
          <span className="text-zinc-600">$</span>{' '}
          <span className="inline-block w-2 h-3 bg-toxic align-middle animate-pulse" />
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full-screen popup — slams in right when the final verify fails.
// ---------------------------------------------------------------------------
export function MemeModal({ memeIndex, tilt, onClose }) {
  const meme = MEMES[memeIndex] ?? MEMES[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-4 animate-pop"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm rounded-2xl overflow-hidden bg-gradient-to-br ${meme.bg} shadow-[0_0_60px_rgba(255,61,129,0.5)] flex flex-col items-center justify-center text-center px-6 py-8 ${tilt} animate-shake`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          aria-label="Close"
        >
          ✕
        </button>

        <p className="font-display text-3xl sm:text-4xl text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-tight uppercase">
          {meme.top}
        </p>
        <p className="text-7xl sm:text-8xl my-4 drop-shadow-lg">{meme.emoji}</p>
        <p className="font-display text-3xl sm:text-4xl text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-tight uppercase">
          {meme.bottom}
        </p>
        <p className="text-white/80 text-sm italic mt-4 max-w-xs">
          {meme.caption}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 bg-black/40 hover:bg-black/60 text-white text-sm font-display font-bold px-5 py-2 rounded-lg"
        >
          fine, whatever
        </button>
      </div>
    </div>
  );
}
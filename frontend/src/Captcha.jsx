import React, { useState, useRef } from 'react';

// A fake distorted-looking captcha string, purely for show — it is never
// actually checked against anything, because nothing you type will ever work.
function generateFakeCaptchaText() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Stage 1: "Select all squares with ___" image grid. The prompt gets more
// unreasonable each round. Nothing you select is ever correct.
// ---------------------------------------------------------------------------
const GRID_EMOJI = ['🌮', '🚦', '🐐', '🛸', '🧦', '🪑', '🫠', '🧠', '🪱', '🎺', '🧊', '🥽', '🍄', '🦴', '🧵'];
const GRID_PROMPTS = [
  'Select all squares containing a taco.',
  'Select all squares that feel personally attacked.',
  'Select all squares with existential dread.',
  'Select all squares that voted in the last election.',
  'Select all squares that are lying to you right now.',
];
const GRID_REJECTIONS = [
  "Wrong. There were no tacos. There are never any tacos.",
  "Incorrect. That square you picked was actually a war crime.",
  "Nope. You selected the one square that was rooting against you.",
  "Wrong. The correct answer was 'none of them, this is a trap.'",
  "Incorrect. Somehow worse than your last guess.",
];

function generateGrid() {
  const cells = [];
  for (let i = 0; i < 9; i++) {
    cells.push(GRID_EMOJI[Math.floor(Math.random() * GRID_EMOJI.length)]);
  }
  return cells;
}

const GRID_ROUNDS_REQUIRED = 3;
const SLIDER_SNAPBACKS_REQUIRED = 2;
const DODGE_COUNT_REQUIRED = 4;

const SLIDER_SNAPBACK_LINES = [
  "So close. Snapping back to zero, purely for comedic effect.",
  "Almost! Just kidding — back to zero with you.",
  "That's cute. Try convincing gravity next.",
];

export default function Captcha({ onVerified }) {
  // Wizard stage: 'username' -> 'grid' -> 'slider' -> 'dodge' -> 'final'
  const [stage, setStage] = useState('username');

  const [username, setUsername] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaText, setCaptchaText] = useState(generateFakeCaptchaText());

  const [roast, setRoast] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);

  // --- grid stage state ---
  const [gridCells, setGridCells] = useState(generateGrid());
  const [gridRound, setGridRound] = useState(0);
  const [gridSelected, setGridSelected] = useState([]);
  const [gridMessage, setGridMessage] = useState('');

  // --- slider stage state ---
  const [sliderValue, setSliderValue] = useState(0);
  const [sliderSnapbacks, setSliderSnapbacks] = useState(0);
  const [sliderMessage, setSliderMessage] = useState('');

  // --- dodge button stage state ---
  const [dodgeCount, setDodgeCount] = useState(0);
  const [dodgePos, setDodgePos] = useState({ x: 0, y: 0 });
  const [dodgeMessage, setDodgeMessage] = useState('Just click the button. If you can.');

  const gridPromptIndex = Math.min(gridRound, GRID_PROMPTS.length - 1);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }

  const refreshCaptcha = () => setCaptchaText(generateFakeCaptchaText());

  // ---- Stage: username ----
  function handleUsernameNext(e) {
    e.preventDefault();
    if (!username.trim() || !captchaInput.trim()) {
      setRoast('Nice attempt at skipping fields. Fill them in, hero.');
      triggerShake();
      return;
    }
    setRoast('');
    setStage('grid');
  }

  // ---- Stage: grid ----
  function toggleGridCell(i) {
    setGridSelected((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  }

  function handleGridSubmit() {
    if (gridSelected.length === 0) {
      setGridMessage('You have to pick at least one. Yes, even though it will still be wrong.');
      triggerShake();
      return;
    }

    const nextRound = gridRound + 1;
    triggerShake();

    if (nextRound >= GRID_ROUNDS_REQUIRED) {
      setGridMessage("Fine. We're letting you through out of pity, not correctness.");
      setTimeout(() => {
        setStage('slider');
        setGridMessage('');
      }, 1100);
    } else {
      setGridMessage(GRID_REJECTIONS[Math.min(gridRound, GRID_REJECTIONS.length - 1)]);
      setGridCells(generateGrid());
      setGridSelected([]);
      setGridRound(nextRound);
    }
  }

  // ---- Stage: slider ----
  function handleSliderChange(e) {
    const val = Number(e.target.value);

    if (val >= 95 && sliderSnapbacks < SLIDER_SNAPBACKS_REQUIRED) {
      setSliderMessage(
        SLIDER_SNAPBACK_LINES[sliderSnapbacks % SLIDER_SNAPBACK_LINES.length]
      );
      setSliderSnapbacks((n) => n + 1);
      setSliderValue(0);
      triggerShake();
      return;
    }

    setSliderValue(val);

    if (val >= 100) {
      setSliderMessage("100%! Wow, an actual achievement. Doesn't count for anything though.");
      setTimeout(() => {
        setStage('dodge');
        setSliderMessage('');
      }, 900);
    }
  }

  // ---- Stage: dodge button ----
  function handleDodgeHover(e) {
    if (dodgeCount >= DODGE_COUNT_REQUIRED) return;

    const container = e.currentTarget.parentElement.getBoundingClientRect();
    const maxX = Math.max(container.width - 140, 40);
    const maxY = Math.max(container.height - 44, 20);
    const newX = Math.random() * maxX - maxX / 2;
    const newY = Math.random() * maxY - maxY / 2;

    setDodgePos({ x: newX, y: newY });
    setDodgeCount((n) => n + 1);

    const lines = [
      'Almost had it.',
      "Nope! Come on, try again.",
      'This button has trust issues.',
      "It's not you, it's... okay it's you.",
    ];
    setDodgeMessage(lines[Math.floor(Math.random() * lines.length)]);
  }

  async function handleFinalVerify() {
    setLoading(true);
    try {
      const res = await fetch('/verifyCaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), captchaInput }),
      });
      const data = await res.json();
      setRoast(data.message);
      triggerShake();
      if (onVerified) onVerified(data);
    } catch (err) {
      setRoast('The server refused to even look at your captcha. Bold move from both of you.');
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() {
    setStage('username');
    setCaptchaInput('');
    refreshCaptcha();
    setGridRound(0);
    setGridCells(generateGrid());
    setGridSelected([]);
    setGridMessage('');
    setSliderValue(0);
    setSliderSnapbacks(0);
    setSliderMessage('');
    setDodgeCount(0);
    setDodgePos({ x: 0, y: 0 });
    setDodgeMessage('Just click the button. If you can.');
    setRoast('');
  }

  async function handlePlayAudio() {
    setAudioLoading(true);
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch (err) {
      setRoast('Even the audio captcha refused to play for you.');
    } finally {
      setAudioLoading(false);
    }
  }

  const stageOrder = ['username', 'grid', 'slider', 'dodge', 'final'];
  const stepNumber = stageOrder.indexOf(stage) + 1;

  return (
    <div
      className={`w-full max-w-md bg-panel border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl ${
        shake ? 'animate-shake' : ''
      }`}
    >
      <h1 className="font-display text-2xl sm:text-3xl text-glitch tracking-tight mb-1">
        CaptchaNeverAccepts
      </h1>
      <p className="text-zinc-400 text-sm mb-1">
        A captcha engineered with a single feature: it will never let you in.
      </p>
      <p className="text-xs text-zinc-500 mb-6">
        Step {Math.min(stepNumber, 4)} of 4
        {stage !== 'username' && (
          <button
            type="button"
            onClick={handleRestart}
            className="ml-3 text-zinc-500 hover:text-glitch underline underline-offset-2"
          >
            start over
          </button>
        )}
      </p>

      {/* ---------------- Stage: username + fake text captcha ---------------- */}
      {stage === 'username' && (
        <form onSubmit={handleUsernameNext} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. definitely_not_a_bot"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-glitch"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">
              Solve this "captcha"
            </label>
            <div className="flex items-center gap-3 mb-2">
              <div className="select-none font-display text-xl tracking-[0.3em] text-toxic bg-black/50 border border-white/10 rounded-lg px-4 py-2 italic skew-x-3">
                {captchaText}
              </div>
              <button
                type="button"
                onClick={refreshCaptcha}
                className="text-xs text-zinc-400 hover:text-zap underline underline-offset-2"
              >
                refresh
              </button>
            </div>
            <input
              type="text"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder="Type it. It won't matter."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-glitch"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-glitch hover:bg-pink-600 text-black font-display font-bold py-2.5 rounded-lg transition-colors"
          >
            Continue
          </button>
        </form>
      )}

      {/* ---------------- Stage: image grid ---------------- */}
      {stage === 'grid' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">{GRID_PROMPTS[gridPromptIndex]}</p>
          <div className="grid grid-cols-3 gap-2">
            {gridCells.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleGridCell(i)}
                className={`aspect-square rounded-lg text-2xl flex items-center justify-center border transition-colors ${
                  gridSelected.includes(i)
                    ? 'bg-glitch/30 border-glitch'
                    : 'bg-black/40 border-white/10 hover:border-white/30'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleGridSubmit}
            className="w-full bg-zap/90 hover:bg-zap text-black font-display font-bold py-2.5 rounded-lg transition-colors"
          >
            Submit ({gridRound}/{GRID_ROUNDS_REQUIRED})
          </button>
          {gridMessage && (
            <p className="text-sm text-toxic font-medium">{gridMessage}</p>
          )}
        </div>
      )}

      {/* ---------------- Stage: slider ---------------- */}
      {stage === 'slider' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Drag the slider all the way to 100% to prove you have the patience of a human.
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full accent-glitch"
          />
          <p className="text-xs text-zinc-500">{sliderValue}%</p>
          {sliderMessage && (
            <p className="text-sm text-toxic font-medium">{sliderMessage}</p>
          )}
        </div>
      )}

      {/* ---------------- Stage: dodging verify button ---------------- */}
      {stage === 'dodge' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Final step: click Verify. It may not want to be clicked.
          </p>
          <div className="relative h-28 bg-black/30 border border-white/10 rounded-lg overflow-hidden">
            <button
              type="button"
              onMouseEnter={handleDodgeHover}
              onClick={dodgeCount >= DODGE_COUNT_REQUIRED ? handleFinalVerify : undefined}
              disabled={loading}
              style={{
                transform: `translate(${dodgePos.x}px, ${dodgePos.y}px)`,
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-glitch hover:bg-pink-600 disabled:opacity-60 text-black font-display font-bold px-6 py-2.5 rounded-lg transition-transform duration-150 animate-pulseGlow"
            >
              {loading ? 'Judging you...' : 'Verify'}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            {dodgeCount >= DODGE_COUNT_REQUIRED
              ? 'Fine. It will hold still now. Go ahead.'
              : dodgeMessage}
          </p>
        </div>
      )}

      <audio ref={audioRef} src="/audioCaptcha" preload="none" />

      <button
        type="button"
        onClick={handlePlayAudio}
        disabled={audioLoading}
        className="w-full mt-4 bg-zap/20 hover:bg-zap/30 disabled:opacity-60 text-zap border border-zap/40 font-display font-bold py-2 rounded-lg transition-colors text-sm"
      >
        {audioLoading ? 'Loading noise...' : '🔊 Audio Captcha (equally useless)'}
      </button>

      {roast && (
        <div className="mt-5 bg-black/50 border border-glitch/40 rounded-lg px-4 py-3 text-sm text-toxic font-medium">
          {roast}
          <button
            type="button"
            onClick={handleRestart}
            className="block mt-2 text-xs text-zinc-400 hover:text-zap underline underline-offset-2"
          >
            suffer again
          </button>
        </div>
      )}
    </div>
  );
}
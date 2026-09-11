import React, { useState, useRef, useEffect } from 'react';

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
// Tunables for maximum suffering.
// ---------------------------------------------------------------------------
const CHECKBOX_ATTEMPTS_REQUIRED = 4;
const GRID_ROUNDS_REQUIRED = 5;
const SLIDER_SNAPBACKS_REQUIRED = 3;
const DODGE_COUNT_REQUIRED = 4;

// ---------------------------------------------------------------------------
// Stage 2: the "I'm not a robot" box that keeps unchecking itself.
// ---------------------------------------------------------------------------
const CHECKBOX_LABELS = [
  'I am not a robot',
  'I am DEFINITELY not a robot',
  'I am not a robot, legally speaking',
  'I am a human and I have the paperwork to prove it',
  'I am so human it is honestly a problem',
];
const CHECKBOX_REJECTIONS = [
  "Unchecked. Robots love checkboxes too, you know.",
  "Nope. Your cursor movement had 'synthetic' energy.",
  "Suspiciously fast clicking. Bots click fast. Next.",
  "Almost passed. Just kidding — we deleted your checkmark out of spite.",
];

// ---------------------------------------------------------------------------
// Stage 3: "Select all squares with ___" image grid. The prompt gets more
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
  "Wrong. The grid has started a group chat about you.",
  "Nope. A neural net just judged your taste in emojis.",
  "Incorrect. The correct squares were metaphorical.",
];
const GRID_FINAL_LINES = [
  'Fine. The grid surrenders. Out of pity, not correctness.',
  "The grid is tired. You may proceed to your next disappointment.",
];

function generateGrid() {
  const cells = [];
  for (let i = 0; i < 9; i++) {
    cells.push(GRID_EMOJI[Math.floor(Math.random() * GRID_EMOJI.length)]);
  }
  return cells;
}

// ---------------------------------------------------------------------------
// Stage 4: the slider that snaps back to zero.
// ---------------------------------------------------------------------------
const SLIDER_SNAPBACK_LINES = [
  'So close. Snapping back to zero, purely for comedic effect.',
  "Almost! Just kidding — back to zero with you.",
  "That's cute. Try convincing gravity next.",
  'Third snap. Bureaucracy demands exactly three.',
];
const SLIDER_100_LINES = [
  "100%! Wow, an actual achievement. Doesn't count for anything though.",
  '100%. Astounding. We are analyzing it anyway, obviously.',
];

// ---------------------------------------------------------------------------
// Stage 5: the Verify button that does not want to be clicked.
// ---------------------------------------------------------------------------
const DODGE_LINES = [
  'Whoops. Slipped. Butter fingers.',
  'The button is shy. Recommend therapy.',
  "You're embarrassing it in front of the other buttons.",
  "It's not you. Wait. It's absolutely you.",
  'No means no.',
  'The button has filed a restraining order.',
  'Clicking with confidence is still clicking.',
  'It moved. That is the entire feature.',
];
const DODGE_HOLD_STILL_LINE = 'Fine. It will hold still now. Mostly out of pity.';

// ---------------------------------------------------------------------------
// Stage 6: the fake AI verdict.
// ---------------------------------------------------------------------------
const ANALYSIS_QUIPS = [
  { until: 25, text: 'Scanning for a soul...' },
  { until: 50, text: 'Comparing against 8.7 billion known humans...' },
  { until: 75, text: 'Consulting the robot council...' },
  { until: 99, text: 'Rendering verdict...' },
];
const ANALYSIS_DURATION_MS = 2800;

export default function Captcha({ onVerified }) {
  // Wizard stage: 'username' -> 'notarobot' -> 'grid' -> 'slider' -> 'dodge'
  //   -> 'analyzing' -> 'final'
  const [stage, setStage] = useState('username');

  const [username, setUsername] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaText, setCaptchaText] = useState(generateFakeCaptchaText());

  const [roast, setRoast] = useState('');
  const [failCount, setFailCount] = useState(null);
  const [title, setTitle] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);

  // --- "not a robot" checkbox stage ---
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [checkboxAttempts, setCheckboxAttempts] = useState(0);
  const [checkboxMessage, setCheckboxMessage] = useState('');

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
  const stageRef = useRef(null);
  const cursorRef = useRef(null); // cursor pos relative to stage center
  const cursorInZoneRef = useRef(false); // cursor currently over the button zone

  // --- fake AI analysis finale ---
  const [analysisProgress, setAnalysisProgress] = useState(0);

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
    setStage('notarobot');
  }

  // ---- Stage: "I'm not a robot" checkbox that keeps unchecking itself ----
  function handleCheckboxClick() {
    if (checkboxChecked) return;
    setCheckboxChecked(true);

    const attempt = checkboxAttempts + 1;
    setCheckboxAttempts(attempt);
    setCheckboxMessage('');

    setTimeout(() => {
      setCheckboxChecked(false);
      if (attempt >= CHECKBOX_ATTEMPTS_REQUIRED) {
        setCheckboxMessage('Fine. We checked it for you. Legally, this is binding.');
        setTimeout(() => setStage('grid'), 1100);
      } else {
        setCheckboxMessage(
          CHECKBOX_REJECTIONS[Math.min(attempt - 1, CHECKBOX_REJECTIONS.length - 1)]
        );
      }
    }, 550);
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
      setGridMessage(GRID_FINAL_LINES[nextRound % GRID_FINAL_LINES.length]);
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
      setSliderMessage(SLIDER_100_LINES[sliderSnapbacks % SLIDER_100_LINES.length]);
      setTimeout(() => setStage('dodge'), 900);
    }
  }

  // ---- Stage: dodging verify button ----
  function performDodge() {
    if (dodgeCount >= DODGE_COUNT_REQUIRED) return;

    const stageEl = stageRef.current;
    const marginX = stageEl ? Math.max(stageEl.offsetWidth / 2 - 55, 0) : 100;
    const marginY = stageEl ? Math.max(stageEl.offsetHeight / 2 - 28, 0) : 40;

    let nx = 0;
    let ny = 0;
    const cursor = cursorRef.current;
    for (let tries = 0; tries < 20; tries++) {
      nx = (Math.random() * 2 - 1) * marginX;
      ny = (Math.random() * 2 - 1) * marginY;
      // Prefer spots far away from the cursor so it never lands under the mouse.
      if (!cursor || Math.hypot(nx - cursor.x, ny - cursor.y) > 90) break;
    }

    setDodgePos({ x: nx, y: ny });
    setDodgeCount((n) => n + 1);
    setDodgeMessage(DODGE_LINES[dodgeCount % DODGE_LINES.length]);
    cursorInZoneRef.current = false;
  }

  function handleStageMouseMove(e) {
    const stageEl = stageRef.current;
    if (!stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    cursorRef.current = { x: cx, y: cy };

    if (dodgeCount >= DODGE_COUNT_REQUIRED) return;

    const dist = Math.hypot(cx - dodgePos.x, cy - dodgePos.y);
    if (dist < 70 && !cursorInZoneRef.current) {
      cursorInZoneRef.current = true;
      performDodge();
    } else if (dist >= 70) {
      cursorInZoneRef.current = false;
    }
  }

  function handleDodgeClick() {
    if (dodgeCount < DODGE_COUNT_REQUIRED) {
      setDodgeMessage('Clicking harder is not a strategy. That one counts as an attempt.');
      performDodge();
      return;
    }
    handleFinalVerify();
  }

  // ---- Fake AI verdict, then the real (rigged) verify call ----
  async function handleFinalVerify() {
    setLoading(true);
    setStage('analyzing');
    try {
      const res = await fetch('/verifyCaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), captchaInput }),
      });
      const data = await res.json();
      setRoast(data.message);
      setFailCount(data.failCount);
      setTitle(data.title);
      triggerShake();
      if (onVerified) onVerified(data);
    } catch (err) {
      setRoast('The server refused to even look at your captcha. Bold move from both of you.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (stage !== 'analyzing') return undefined;
    setAnalysisProgress(0);
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min(99, Math.round(((Date.now() - t0) / ANALYSIS_DURATION_MS) * 100));
      setAnalysisProgress(p);
      if (p >= 99) {
        clearInterval(id);
        setTimeout(() => setStage('final'), 700);
      }
    }, 80);
    return () => clearInterval(id);
  }, [stage]);

  function handleRestart() {
    setStage('username');
    setCaptchaInput('');
    refreshCaptcha();
    setCheckboxChecked(false);
    setCheckboxAttempts(0);
    setCheckboxMessage('');
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
    cursorRef.current = null;
    cursorInZoneRef.current = false;
    setAnalysisProgress(0);
    setRoast('');
    setFailCount(null);
    setTitle('');
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

  const stageOrder = ['username', 'notarobot', 'grid', 'slider', 'dodge', 'analyzing', 'final'];
  const stepNumber = Math.min(stageOrder.indexOf(stage) + 1, 5);

  const checkboxLabel =
    CHECKBOX_LABELS[Math.min(checkboxAttempts, CHECKBOX_LABELS.length - 1)];
  const analysisQuip = ANALYSIS_QUIPS.find((q) => analysisProgress < q.until)?.text ||
    'Rendering verdict...';

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
        Step {stepNumber} of 5
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

      {/* ---------- Stage: "I'm not a robot" box that unchecks itself ---------- */}
      {stage === 'notarobot' && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Last chance to leave with your dignity. Check the box.
          </p>
          <button
            type="button"
            onClick={handleCheckboxClick}
            className={`w-full flex items-center gap-3 bg-black/40 border rounded-lg px-4 py-3 text-left transition-colors ${
              checkboxChecked ? 'border-zap' : 'border-white/10 hover:border-white/30'
            }`}
          >
            <span
              className={`w-5 h-5 rounded border flex items-center justify-center text-sm font-bold ${
                checkboxChecked
                  ? 'bg-zap border-zap text-black'
                  : 'border-zinc-500 text-transparent'
              }`}
            >
              ✓
            </span>
            <span className={`text-sm ${checkboxChecked ? 'text-zap' : 'text-zinc-300'}`}>
              {checkboxLabel}
            </span>
          </button>
          {checkboxMessage && (
            <p className="text-sm text-toxic font-medium">{checkboxMessage}</p>
          )}
        </div>
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
          <p className="text-xs text-zinc-500">
            {sliderValue}%{' '}
            {sliderValue > 0 && sliderValue < 100 && sliderValue >= 95
              ? '(careful. it knows.)'
              : ''}
          </p>
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
          {/* Flex centers the button; the inline transform only adds the dodge
              offset. (Putting translate(-50%,-50%) centering classes on the
              button itself would be overridden by the inline transform.) */}
          <div
            ref={stageRef}
            onMouseMove={handleStageMouseMove}
            className="relative h-28 bg-black/30 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center"
          >
            <button
              type="button"
              onMouseEnter={() => {
                if (dodgeCount < DODGE_COUNT_REQUIRED && !cursorInZoneRef.current) {
                  cursorInZoneRef.current = true;
                  performDodge();
                }
              }}
              onClick={handleDodgeClick}
              disabled={loading}
              style={{
                transform: `translate(${dodgePos.x}px, ${dodgePos.y}px)`,
              }}
              className="bg-glitch hover:bg-pink-600 disabled:opacity-60 text-black font-display font-bold px-6 py-2.5 rounded-lg transition-transform duration-150 animate-pulseGlow"
            >
              {loading ? 'Judging you...' : 'Verify'}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            {dodgeCount >= DODGE_COUNT_REQUIRED ? DODGE_HOLD_STILL_LINE : dodgeMessage}
          </p>
        </div>
      )}

      {/* ---------------- Stage: fake AI analysis ---------------- */}
      {stage === 'analyzing' && (
        <div className="space-y-4 py-2">
          <p className="text-sm text-zinc-300">
            Analyzing your humanity with enterprise-grade AI™...
          </p>
          <div className="w-full h-3 bg-black/40 border border-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-zap to-glitch transition-all duration-100"
              style={{ width: `${analysisProgress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">
            {analysisQuip} <span className="text-glitch">{analysisProgress}%</span>
          </p>
        </div>
      )}

      <audio ref={audioRef} src="/audioCaptcha" preload="none" />

      {stage !== 'final' && (
        <button
          type="button"
          onClick={handlePlayAudio}
          disabled={audioLoading}
          className="w-full mt-4 bg-zap/20 hover:bg-zap/30 disabled:opacity-60 text-zap border border-zap/40 font-display font-bold py-2 rounded-lg transition-colors text-sm"
        >
          {audioLoading ? 'Loading noise...' : '🔊 Audio Captcha (equally useless)'}
        </button>
      )}

      {/* ---------------- Stage: the verdict ---------------- */}
      {stage === 'final' && roast && (
        <div className="mt-2 bg-black/50 border border-glitch/40 rounded-lg px-4 py-3 text-sm">
          <p className="text-toxic font-medium">{roast}</p>
          {failCount != null && (
            <p className="mt-2 text-xs text-zinc-400">
              Verdict logged: fail #{failCount}
              {title && <span className="text-glitch"> · {title}</span>}
            </p>
          )}
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

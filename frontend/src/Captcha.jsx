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

export default function Captcha({ onVerified }) {
  const [username, setUsername] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaText, setCaptchaText] = useState(generateFakeCaptchaText());
  const [roast, setRoast] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);

  const refreshCaptcha = () => setCaptchaText(generateFakeCaptchaText());

  async function handleVerify(e) {
    e.preventDefault();
    if (!username.trim() || !captchaInput.trim()) {
      setRoast('Nice attempt at skipping fields. Fill them in, hero.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/verifyCaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), captchaInput }),
      });
      const data = await res.json();
      setRoast(data.message);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setCaptchaInput('');
      refreshCaptcha();
      if (onVerified) onVerified(data);
    } catch (err) {
      setRoast('The server refused to even look at your captcha. Bold move from both of you.');
    } finally {
      setLoading(false);
    }
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

  return (
    <div
      className={`w-full max-w-md bg-panel border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl ${
        shake ? 'animate-shake' : ''
      }`}
    >
      <h1 className="font-display text-2xl sm:text-3xl text-glitch tracking-tight mb-1">
        CaptchaNeverAccepts
      </h1>
      <p className="text-zinc-400 text-sm mb-6">
        A captcha engineered with a single feature: it will never let you in.
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
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

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-glitch hover:bg-pink-600 disabled:opacity-60 text-black font-display font-bold py-2.5 rounded-lg transition-colors animate-pulseGlow"
          >
            {loading ? 'Judging you...' : 'Verify'}
          </button>
          <button
            type="button"
            onClick={handlePlayAudio}
            disabled={audioLoading}
            className="flex-1 bg-zap/90 hover:bg-zap disabled:opacity-60 text-black font-display font-bold py-2.5 rounded-lg transition-colors"
          >
            {audioLoading ? 'Loading noise...' : '🔊 Audio Captcha'}
          </button>
        </div>
      </form>

      <audio ref={audioRef} src="/audioCaptcha" preload="none" />

      {roast && (
        <div className="mt-5 bg-black/50 border border-glitch/40 rounded-lg px-4 py-3 text-sm text-toxic font-medium">
          {roast}
        </div>
      )}
    </div>
  );
}

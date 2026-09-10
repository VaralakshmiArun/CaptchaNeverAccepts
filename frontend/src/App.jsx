import React, { useEffect, useState, useCallback } from 'react';
import Captcha from './Captcha.jsx';

function Leaderboard({ entries, onRefresh, loading }) {
  return (
    <div className="w-full max-w-md bg-panel border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-toxic">Hall of Failure</h2>
        <button
          onClick={onRefresh}
          className="text-xs text-zinc-400 hover:text-zap underline underline-offset-2"
        >
          {loading ? 'refreshing...' : 'refresh'}
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-zinc-500 text-sm">
          No one has failed yet. That's about to change.
        </p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry, i) => (
            <li
              key={entry.username}
              className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-zinc-200">
                <span className="text-zinc-500 w-5">{i + 1}.</span>
                {entry.username}
              </span>
              <span className="text-glitch font-bold">{entry.fails} fails</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/leaderboard');
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      // The leaderboard failed to load. Thematically appropriate.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

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
        <Captcha onVerified={fetchLeaderboard} />
        <Leaderboard entries={entries} onRefresh={fetchLeaderboard} loading={loading} />
      </div>

      <footer className="text-zinc-600 text-xs text-center pt-4">
        CaptchaNeverAccepts — built for maximum humiliation, zero accessibility to humans.
      </footer>
    </div>
  );
}

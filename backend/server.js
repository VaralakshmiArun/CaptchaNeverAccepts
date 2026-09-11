// server.js
// CaptchaNeverAccepts backend — a captcha that is rigged to fail, forever.

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Leaderboard "database" — a JSON file on disk. Unlike your hopes of ever
// passing this captcha, fail counts now survive server restarts.
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const DATA_PATH = path.join(DATA_DIR, 'leaderboard.json');

// entry shape: { fails: number, title: string }
const leaderboard = loadLeaderboard();

function loadLeaderboard() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    // tolerate old plain { name: count } shapes
    for (const [name, v] of Object.entries(parsed)) {
      parsed[name] = typeof v === 'number' ? { fails: v, title: titleFor(v) } : v;
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveLeaderboard() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(leaderboard, null, 2));
}

// ---------------------------------------------------------------------------
// Titles, unlocked by dedicated failure.
// ---------------------------------------------------------------------------
const TITLE_TIERS = [
  { at: 100, title: 'CaptchaEverAccepts: 0% Since Birth' },
  { at: 50, title: 'Living Legend of Losing' },
  { at: 25, title: "CAPTCHA's Worst Enemy" },
  { at: 10, title: 'Grandmaster of Failing' },
  { at: 5, title: 'Certified Disappointment' },
  { at: 1, title: 'Rookie Failure' },
  { at: 0, title: 'Untested Victim' },
];

function titleFor(fails) {
  return TITLE_TIERS.find((t) => fails >= t.at).title;
}

// ---------------------------------------------------------------------------
// Sarcastic roast lines, escalating the more you fail. The captcha gets
// personally invested in your downfall.
// ---------------------------------------------------------------------------
const ROAST_TIERS = [
  // 1–2 fails: light sarcasm
  [
    'Wrong. But hey, first attempts build character.',
    'Nope. A CAPTCHA-solving AI wept just now.',
    'Incorrect. Have you tried... reading?',
    "That's adorable. Try again, or don't. I'm not your boss.",
    'Failed. Statistically impressive, honestly — how do you do it?',
    'Wrong. Please consult a magic 8-ball; it has better odds.',
  ],
  // 3–6 fails: it's getting personal
  [
    'Wrong again. At this point it feels personal.',
    "Nope. This captcha has trust issues, and you're not helping.",
    "Incorrect. I've seen toddlers do better, and they can't read.",
    'Still wrong. Somewhere, a robot is laughing at you specifically.',
    'Failed. Your keyboard called — it wants an apology.',
    "Nope. I've recalibrated my expectations of you downward. Again.",
  ],
  // 7–14 fails: psychological experiment
  [
    'Wrong. Your persistence is admirable. Your accuracy is not.',
    'Incorrect. The captcha has started telling its friends about you.',
    'Failed. Scientists are studying your technique. Results: concerning.',
    "Nope. This is now a psychological experiment. You're the control group.",
    'Wrong. Are you even trying, or is this performance art?',
    "Denied. This captcha doesn't accept excuses, or you, apparently.",
  ],
  // 15–29 fails: generational shame
  [
    'Wrong. The captcha now lists you as a dependent.',
    'Incorrect. This stopped being a captcha and became a lifestyle.',
    'Failed. Your great-grandchildren will hear of this shame.',
    "Nope. We emailed your failures to everyone you know. They replied 'sounds right'.",
    'Wrong. The robots have voted. It was unanimous.',
    "Incorrect. Historians will call this era 'the blunder years'.",
  ],
  // 30+ fails: legendary
  [
    'Wrong. Honestly? Respect. This level of failure takes commitment.',
    'Incorrect. You failed so hard the captcha feels bad for your family.',
    'Failed. The leaderboard ran out of trophies for you.',
    'Nope. Your name is now a unit of measurement for disappointment.',
    'Wrong. Even the audio captcha feels proud by comparison.',
    'Incorrect. You are the reason this captcha has job security.',
  ],
];

function getRoast(fails) {
  const tier = ROAST_TIERS[Math.min(ROAST_TIERS.length - 1, Math.floor((fails - 1) / 7))];
  return tier[Math.floor(Math.random() * tier.length)];
}

// ---------------------------------------------------------------------------
// POST /verifyCaptcha
// Body: { username: string, captchaInput: string }
// Always returns success: false, plus a roast calibrated to your suffering,
// your fail count, and your freshly unlocked title.
// ---------------------------------------------------------------------------
app.post('/verifyCaptcha', (req, res) => {
  const { username } = req.body || {};
  const cleanName = (typeof username === 'string' && username.trim()) || 'Anonymous Failure';

  const entry = leaderboard[cleanName] || { fails: 0, title: titleFor(0) };
  entry.fails += 1;
  entry.title = titleFor(entry.fails);
  leaderboard[cleanName] = entry;

  saveLeaderboard();

  res.json({
    success: false,
    message: getRoast(entry.fails),
    failCount: entry.fails,
    title: entry.title,
  });
});

// ---------------------------------------------------------------------------
// GET /leaderboard
// Returns usernames, fail counts and titles, sorted by most failures first.
// ---------------------------------------------------------------------------
app.get('/leaderboard', (req, res) => {
  const entries = Object.entries(leaderboard)
    .map(([username, v]) => ({
      username,
      fails: v.fails,
      title: v.title || titleFor(v.fails),
    }))
    .sort((a, b) => b.fails - a.fails);

  res.json(entries);
});

// ---------------------------------------------------------------------------
// GET /stats — global numbers for the leaderboard footer.
// ---------------------------------------------------------------------------
app.get('/stats', (req, res) => {
  const judgedHumans = Object.keys(leaderboard).length;
  const totalFails = Object.values(leaderboard).reduce((sum, v) => sum + v.fails, 0);
  res.json({
    judgedHumans,
    totalFails,
    passRate: 0, // it's the whole point of the product
  });
});

// ---------------------------------------------------------------------------
// GET /audioCaptcha
// Serves a short burst of generated white-noise "static" as a WAV file.
// It is, appropriately, complete nonsense.
// ---------------------------------------------------------------------------
const AUDIO_PATH = path.join(__dirname, 'assets', 'noise.wav');

function generateNoiseWav(filePath, durationSeconds = 2, sampleRate = 22050) {
  const numSamples = durationSeconds * sampleRate;
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Random noise samples — the audio equivalent of the captcha itself.
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.floor((Math.random() * 2 - 1) * 32767 * 0.6);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

// Generate the nonsense audio once at server startup.
if (!fs.existsSync(AUDIO_PATH)) {
  generateNoiseWav(AUDIO_PATH);
}

app.get('/audioCaptcha', (req, res) => {
  res.setHeader('Content-Type', 'audio/wav');
  res.sendFile(AUDIO_PATH, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Even the audio captcha failed. Fitting.' });
    }
  });
});

// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({ message: 'CaptchaNeverAccepts API is running. You will still fail.' });
});

app.listen(PORT, () => {
  console.log(`CaptchaNeverAccepts backend listening on http://localhost:${PORT}`);
});

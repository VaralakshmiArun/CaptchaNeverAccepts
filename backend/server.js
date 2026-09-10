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
// In-memory "database" — resets whenever the server restarts, much like your
// hopes of ever passing this captcha.
// ---------------------------------------------------------------------------
const leaderboard = {};

// ---------------------------------------------------------------------------
// Sarcastic roast lines. Feel free to add more — the more, the merrier.
// ---------------------------------------------------------------------------
const ROASTS = [
  "Nice try. A CAPTCHA-solving AI wept just now.",
  "Wrong. Also, your keyboard called — it wants an apology.",
  "That's adorable. Try again, or don't. I'm not your boss.",
  "Incorrect. Have you considered a career that doesn't involve typing?",
  "Nope. Somewhere, a robot is laughing at you right now.",
  "Failed. Statistically impressive, honestly — how do you do it?",
  "Wrong again. At this point it feels personal.",
  "Access denied. Not because of the captcha — I just don't like you.",
  "That answer was so wrong it looped back around to impressive.",
  "Incorrect. I've seen toddlers do better, and they can't read.",
  "Nope. This captcha has trust issues, and you're not helping.",
  "Wrong. Please consult a magic 8-ball; it has better odds.",
  "Failed. I'd say 'better luck next time' but we both know that's a lie.",
  "Incorrect. Somewhere a CAPTCHA designer is very proud of this moment.",
  "Nope, still human-proof. Mostly you-proof, specifically.",
  "Wrong. Are you even trying, or is this performance art?",
  "That was almost right, in the sense that it was a string of characters.",
  "Denied. This captcha doesn't accept excuses, or you, apparently.",
  "Incorrect. On the bright side, you're very consistent.",
  "Nope. I've recalibrated my expectations of you downward. Again.",
];

function getRoast() {
  return ROASTS[Math.floor(Math.random() * ROASTS.length)];
}

// ---------------------------------------------------------------------------
// POST /verifyCaptcha
// Body: { username: string, captchaInput: string }
// Always returns success: false, with a random roast, and bumps the
// leaderboard fail count for that username.
// ---------------------------------------------------------------------------
app.post('/verifyCaptcha', (req, res) => {
  const { username } = req.body || {};
  const cleanName = (typeof username === 'string' && username.trim()) || 'Anonymous Failure';

  leaderboard[cleanName] = (leaderboard[cleanName] || 0) + 1;

  res.json({
    success: false,
    message: getRoast(),
    failCount: leaderboard[cleanName],
  });
});

// ---------------------------------------------------------------------------
// GET /leaderboard
// Returns usernames and fail counts, sorted by most failures first.
// ---------------------------------------------------------------------------
app.get('/leaderboard', (req, res) => {
  const entries = Object.entries(leaderboard)
    .map(([username, fails]) => ({ username, fails }))
    .sort((a, b) => b.fails - a.fails);

  res.json(entries);
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

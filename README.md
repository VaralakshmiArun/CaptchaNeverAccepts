# CaptchaNeverAccepts

A captcha that never, ever accepts you — by design.


## Project structure

```
CaptchaNeverAccepts/
├── backend/
│   ├── server.js         # Express server: /verifyCaptcha, /leaderboard, /audioCaptcha
│   ├── package.json
│   └── assets/           # auto-generated noise.wav lives here after first run
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx        # layout + leaderboard
        ├── Captcha.jsx     # form, verify button, audio captcha
        └── index.css
```

## Running the backend

```bash
cd backend
npm install
npm start
```

The API runs on **http://localhost:4000**. On first launch it auto-generates
`backend/assets/noise.wav`, a 2-second burst of white noise used by the audio
captcha.

Endpoints:
- `POST /verifyCaptcha` — body `{ "username": "...", "captchaInput": "..." }`,
  always responds `{ success: false, message: "<sarcastic line>" }`.
- `GET /leaderboard` — returns `[{ username, fails }, ...]` sorted by most fails.
- `GET /audioCaptcha` — streams the nonsense `noise.wav` file.

## Running the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite serves the app on **http://localhost:5173** and proxies `/verifyCaptcha`,
`/leaderboard`, and `/audioCaptcha` to the backend on port 4000 (see
`vite.config.js`), so no CORS configuration is needed in dev.

## Notes

- The leaderboard is stored in memory on the backend and resets whenever the
  server restarts.
- The on-screen captcha text is purely decorative — nothing you type is ever
  checked, because there is nothing to check against. That's the joke.
- To deploy, build the frontend (`npm run build` inside `frontend/`) and serve
  the resulting `dist/` folder from Express (e.g. `app.use(express.static(...))`
  in `server.js`), or host frontend/backend separately and point the frontend
  at the backend's public URL instead of the Vite proxy.

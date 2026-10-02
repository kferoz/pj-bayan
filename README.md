# PJ Bayan Archive

A YouTube-style catalogue of P. Jainulabdeen's Tamil talks, in chronological order (oldest first), with an embedded player, search, topic/era filters, watched tracking, notes and resume.

Static site, no build step.

## Files
- `index.html`, `style.css`, `app.js`: the app
- `videos.js`: the talk list (one row per video, kept in date order)

## Adding talks
Append rows to `videos.js`:

    [youtubeId, "YYYY-MM-DD", approxDate(0/1), seconds, channel, tamilTitle, englishGloss, topic]

Use the recording date from the title/description. If none is given, use the upload date and set `approxDate` to 1.

## Run locally
    python3 -m http.server 8000   # then open http://localhost:8000

(Opening `index.html` by double-click will not play videos; YouTube rejects embeds from `file://`.)

## Deploy
Netlify is linked to this repo; every push to `main` deploys automatically.

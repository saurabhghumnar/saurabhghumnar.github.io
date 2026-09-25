# saurabhghumnar.github.io — v3 "Save file" (gamified)

A playable portfolio: HUD with completion tracking, twelve achievements (two secret),
the eight reports as levels, a boss fight against the three-day month-end, a skill tree,
a career map with save points, projects as loot, and a 30-second arcade mini-game.
Static files, no build step, no external dependencies (fonts are self-hosted).

## Deploy

1. In the repo `saurabhghumnar/saurabhghumnar.github.io`, delete the old template files
   (`index.html`, `Projects.html`, `Research.html`, `Work Experience.html`, `contact.html`,
   `elements.html`, `generic.html`, `README.txt`, and the old `assets/` folder).
   KEEP the existing `images/` folder — this version reuses those files.
2. Upload this folder's contents to the repo root: `index.html`, `Saurabh_Ghumnar_Resume.pdf`,
   and the `assets/` folder (css, js, fonts).
3. Add `images/dwyeromega.png` (DwyerOmega logo, PNG, transparent background).
4. Commit. GitHub Pages redeploys in about a minute.

If you would rather keep v2 as the main site, deploy v3 to a subfolder (for example `/play/`)
and link to it; every path here is relative so it works from any folder as long as `images/`
is copied next to it or the image paths are updated.

## Images used (already in `images/` except the first)

Logos: dwyeromega.png (new), persi.png, sppu.png, uiuc.png, qstn.png, giesuiuc.png
Loot thumbnails: snow.png, sigma.png, airbnb.png, tableau.jpg, app.jpg, MBA.png, air.jpeg,
jello.png, blackberry.png, zomato.png, dropbox.png
Missing images fall back to an initials tile automatically.

## How the game works

- Completion (HUD bar): 8% for each of the nine screens discovered, plus 8% for opening a level
  card, 10% for finishing an arcade round, 5% for using a loot item, 5% for inspecting a skill node.
- Achievements: New Game, Quest Accepted, Level Select, Boss Slain, Respec, Cartographer,
  Loot Goblin, Reconciled (500+ arcade score), Recruiter (resume download or invite sent),
  Completionist (100%), and two secrets (1000+ arcade score; the Konami code).
- Progress and best score persist in the visitor's browser (localStorage). Nothing is sent anywhere.
- Sound is off by default (SND in the HUD). CRT scanlines can be toggled (CRT in the HUD).
- Reduced-motion users skip the title screen and get no screen shake.

## Editing content

- `index.html` — copy, character stats, boss moves, loot items, contact.
- `assets/js/game.js` — `LEVELS` (the eight reports), `BR` (skill tree), `SAVES` (career map),
  `TROPHIES`, the boss fight damage values (`DMG`), and the mini-game.
- `assets/css/game.css` — palette variables at the top.

The contact form posts to the existing Formspree endpoint (`movjkbyk`).

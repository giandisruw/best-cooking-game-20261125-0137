# Ember Lane Kitchen

A complete, original street-food cooking game that runs offline in a desktop
browser from its own files — no network, no libraries, no build step.

You run a tiny ember-grill stall on Ember Lane. Tickets land on the order
board with a ticking patience bar. Grab ingredients from the pantry, chop
them on the board or grill and boil them on the stove, build the dish on the
plating counter, and run the finished plate to the serve hatch before the
customer walks out. Serve fast and in a row to build a combo; let a ticket
expire and you lose a heart and the combo. A shift lasts 150 seconds, new
recipes unlock as the levels rise, and the lunch rush only gets faster.

## How to play

Open `game/index.html` in desktop Chrome (or serve `game/` with any static
server). Keyboard and mouse both work:

| Action | Keys / mouse |
|---|---|
| Move the chef | WASD or arrow keys, or click the floor to walk there |
| Grab an ingredient | Near the pantry: press 1–8, or click its bin |
| Chop (tomato, lettuce, mushroom) | Near the chop board: press E |
| Cook (patty, egg, noodle, cheese) | Near the stove: press E to put it on, E again to collect |
| Add to the plate | Carry chopped/cooked food to the plating counter: press E |
| Pick up a finished plate | Empty hands at the plating counter: press E |
| Serve | Carry the plate to the serve hatch: press E |
| Bin what you carry | Q, or E at the bin |
| Pause / mute / restart | P / M / R |

Clicking a station walks the chef over to it and uses it on arrival.

## Recipes

- **Garden Salad** — chopped tomato + chopped lettuce
- **Ember Burger** — grilled patty + bread + chopped tomato
- **Sunny Noodles** (level 2) — boiled noodle + fried egg + chopped mushroom
- **Melt Toast** (level 3) — grilled cheese + bread + chopped tomato

## Scoring

A served dish pays 100 points plus a tip of up to 60 for patience left, times a
combo multiplier (up to ×3 for serving dish after dish without an expiry).
Three hearts: an expired order costs one. At the end of the shift you get
1–3 stars (4 / 8 / 12 dishes served) and your best shift is kept in the browser.

## Sound

All sound is synthesized live with WebAudio — chop thocks, stove sizzle,
serve chimes and a quiet pentatonic tune. No audio files. Press M to mute.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` (run with `MAKEFUN_OUTPUT_DIR=out` outside
  the grader)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `game/index.html` — the page; `game/src/` holds the game, one job per file:
  `config.js` (tuning, ingredients, recipes), `kitchen.js` (the rules),
  `render.js` (all drawing), `audio.js` (synthesized sound), `input.js`
  (keyboard and mouse), `shots.js` (staged screenshot scenes), `main.js`
  (the frame loop and wiring)
- `screenshots/` — real renders of the game's own code in a headless browser
- `?shot=title|play|serve|rush` stages a fixed scene for screenshots

## License

MIT — see `LICENSE`.

---

Built for the make.fun bounty "Make the best cooking game".
https://make.fun/?ref=0txwmf1m

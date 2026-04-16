# TanachScraper

A TypeScript Node.js console app that scrapes the complete Tanach (Hebrew Bible) from [Chabad.org](https://www.chabad.org/library/bible_cdo/aid/8165) and saves it locally as structured Markdown files.

## What it saves

For each of the 929 chapters across Torah, Neviim, and Ketuvim, 6 Markdown files are generated:

| File | Content |
|------|---------|
| `Chapter_N-H.md` | Hebrew verse text (no nikkud) |
| `Chapter_N-H.nikkud.md` | Hebrew verse text with full nikkud and cantillation marks |
| `Chapter_N-E.md` | English verse text |
| `Chapter_N.rashi.md` | Rashi commentary — Hebrew and English interleaved (title bolded) |
| `Chapter_N-E.rashi.md` | Rashi commentary — English only (title bolded) |
| `Chapter_N-H.rashi.md` | Rashi commentary — Hebrew only, no nikkud (title bolded) |

Output is saved to `%USERPROFILE%\Desktop\Tanach`. If that folder already exists, it auto-increments (`Tanach-1`, `Tanach-2`, …) to avoid overwriting previous runs.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)

## Setup

```bash
npm install
```

## Run

```bash
npx tsx scraper.ts
```

Progress is logged to the console. A `stats.md` summary file is written to the output root when the run completes.

## Tests

### `test_chapter.ts` — single-chapter preview

Fetches one chapter, parses it, and writes `test_output.md` next to the script. Open `test_output.md` in VS Code to visually verify the Hebrew renders correctly — do **not** rely on the Windows terminal, which does not render RTL text.

```bash
npm test                           # Bereshit 1 (default, AID 8165)
npx tsx test_chapter.ts 8166       # Bereshit 2
npx tsx test_chapter.ts 16222      # Tehillim 1
```

The output mirrors all 6 file variants (`-H.md`, `-H.nikkud.md`, `-E.md`, `.rashi.md`, `-H.rashi.md`, `-E.rashi.md`) for the first 5 verses/entries.


# Tanach Scraper — TypeScript Console Application: Implementation Instructions

## Goal

Build a TypeScript Node.js console application that scrapes all Hebrew verse text, English verse text, and
Rashi commentary from Chabad.org's complete Tanach at:
  https://www.chabad.org/library/bible_cdo/aid/8165

Save everything locally as structured Markdown files. The app runs on a Windows personal machine.

---

## Output Folder Structure

Root folder is configurable (default: `C:\Tanach`). If the default (or any user-supplied
path) already exists on disk, the program must not overwrite or merge into it. Instead,
auto-increment a numeric suffix until a free name is found:
  `C:\Tanach` → `C:\Tanach-1` → `C:\Tanach-2` → …

Determination logic (run once at startup, before any HTTP fetches):
```ts
let outputRoot = 'C:\\Tanach';
if (fs.existsSync(outputRoot)) {
  let i = 1;
  while (fs.existsSync(`${outputRoot}-${i}`)) i++;
  outputRoot = `${outputRoot}-${i}`;
}
console.log(`Output folder: ${outputRoot}`);
```

Structure:

```
Tanach/
├── Torah/
│   ├── Bereshit/
│   │   ├── Chapter_1/
│   │   │   ├── Chapter_1-H.md
│   │   │   ├── Chapter_1-H.nikkud.md
│   │   │   ├── Chapter_1-E.md
│   │   │   ├── Chapter_1.rashi.md
│   │   │   ├── Chapter_1-E.rashi.md
│   │   │   └── Chapter_1-H.rashi.md
│   │   ├── Chapter_2/
│   │   └── ...
│   ├── Shemot/
│   └── ...
├── Neviim/
│   └── ...
└── Ketuvim/
│   └── ...
stats.md
```

Section folder names: `Torah`, `Neviim`, `Ketuvim` (no apostrophe — Windows-safe).
Book folder names: Hebrew name only (e.g., `Bereshit`, not `Bereshit (Genesis)`).
Chapter folder names: `Chapter_1`, `Chapter_2`, etc.

---

## File Types Per Chapter

Each chapter folder contains exactly 6 files:

| File | Content |
|------|--------|
| `Chapter_N-H.md` | Hebrew verse text only (no nikkud or cantillation marks) |
| `Chapter_N-H.nikkud.md` | Hebrew verse text with full nikkud and cantillation marks |
| `Chapter_N-E.md` | English verse text only |
| `Chapter_N.rashi.md` | Full Rashi commentary: both Hebrew (with nikkud) and English interleaved |
| `Chapter_N-E.rashi.md` | Rashi commentary English text only |
| `Chapter_N-H.rashi.md` | Rashi commentary Hebrew text only (no nikkud) |

---

## Per-Line Format

One verse (or Rashi entry) per line. Format:

  **{verse_number}**{TAB}{text}

- Use a real tab character (`\t`) between the verse number and the text.
- Verse numbers are in **bold** Markdown syntax.
- Hebrew files (H, RH): verse number is the Hebrew letter(s) as they appear on the site (e.g., alef for 1, bet for 2).
- English files (E, RE): verse number is the Arabic numeral (e.g., 1, 2, 3).

### Rashi file formats

Each `Co_Rashi` HTML row = one output line. A verse may have multiple entries; all share
the same verse number. Blank line between groups when the verse number changes.

The Rashi title (`co_RashiTitle`) is rendered in **bold** immediately before the body
text in every Rashi file: `**{title}** {body}`. If no title is present, only the body
is written.

For the combined file, the Hebrew line appears immediately below its matching English
line with no blank line between them. Two trailing spaces after the Hebrew line force a
Markdown line break (`  \n`) without creating a paragraph gap. Blank lines only appear
between different verse groups.

`Chapter_N.rashi.md` (combined):

```
**{verse_num} [Hebrew]**{TAB}**{heb_title_1}** {heb_body_1}<br>
**{verse_num} [English]**{TAB}**{eng_title_1}** {eng_body_1}
**{verse_num} [Hebrew]**{TAB}**{heb_title_2}** {heb_body_2}
**{verse_num} [English]**{TAB}**{eng_title_2}** {eng_body_2}

**{verse_num2} [Hebrew]**{TAB}**{heb_title_1}** {heb_body_1}
**{verse_num2} [English]**{TAB}**{eng_title_1}** {eng_body_1}
```

`Chapter_N-E.rashi.md` (English only):

```
**{verse_num}**{TAB}**{eng_title_1}** {eng_body_1}
**{verse_num}**{TAB}**{eng_title_2}** {eng_body_2}

**{verse_num2}**{TAB}**{eng_title_1}** {eng_body_1}
```

`Chapter_N-H.rashi.md` (Hebrew only):

```
**{hebrew_num}**{TAB}**{heb_title_1}** {heb_body_1}
**{hebrew_num}**{TAB}**{heb_title_2}** {heb_body_2}

**{hebrew_num2}**{TAB}**{heb_title_1}** {heb_body_1}
```

If a chapter has no Rashi commentary at all, write a single line in all three Rashi files:
  `(No Rashi commentary for this chapter.)`

---

## Project Setup

1. Create a new Node.js project:
   ```
   mkdir TanachScraper
   cd TanachScraper
   npm init -y
   ```

2. Install required packages:
   ```
   npm install cheerio
   npm install -D tsx typescript @types/node
   ```

3. Run directly from the console with no build step needed:
   ```
   npx tsx scraper.ts
   ```

4. Node.js uses UTF-8 by default. Always write files without BOM:
   ```ts
   await fs.promises.writeFile(filePath, content, { encoding: 'utf8' });
   ```
   (UTF-8 without BOM — important for correct Hebrew rendering in Markdown viewers.)

5. Ensure `tsconfig.json` exists (auto-created by `tsx` if absent, but you can create one):
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "Node16",
       "moduleResolution": "Node16",
       "strict": true
     }
   }
   ```

---

## Tanach Structure Reference

The complete Tanach is 929 chapters. With 6 files each, the app will write ~5,574 files.

### Torah (187 chapters)

| Folder Name | English | Chapter Count |
|-------------|---------|---------------|
| Bereshit | Genesis | 50 |
| Shemot | Exodus | 40 |
| Vayikra | Leviticus | 27 |
| Bamidbar | Numbers | 36 |
| Devarim | Deuteronomy | 34 |

### Neviim (352 chapters)

| Folder Name | English | Chapter Count |
|-------------|---------|---------------|
| Yehoshua | Joshua | 24 |
| Shoftim | Judges | 21 |
| Shmuel_I | 1 Samuel | 31 |
| Shmuel_II | 2 Samuel | 24 |
| Melachim_I | 1 Kings | 22 |
| Melachim_II | 2 Kings | 25 |
| Yeshayahu | Isaiah | 66 |
| Yirmiyahu | Jeremiah | 52 |
| Yechezkel | Ezekiel | 48 |
| Hoshea | Hosea | 14 |
| Yoel | Joel | 4 |
| Amos | Amos | 9 |
| Ovadiah | Obadiah | 1 |
| Yonah | Jonah | 4 |
| Michah | Micah | 7 |
| Nachum | Nahum | 3 |
| Chavakuk | Habakkuk | 3 |
| Tzefaniah | Zephaniah | 3 |
| Chaggai | Haggai | 2 |
| Zechariah | Zechariah | 14 |
| Malachi | Malachi | 3 |

### Ketuvim (390 chapters)

| Folder Name | English | Chapter Count |
|-------------|---------|---------------|
| Tehillim | Psalms | 150 |
| Mishlei | Proverbs | 31 |
| Iyov | Job | 42 |
| Shir_HaShirim | Song of Songs | 8 |
| Rut | Ruth | 4 |
| Eichah | Lamentations | 5 |
| Kohelet | Ecclesiastes | 12 |
| Esther | Esther | 10 |
| Daniel | Daniel | 12 |
| Ezra | Ezra | 10 |
| Nechemiah | Nehemiah | 13 |
| Divrei_HaYamim_I | 1 Chronicles | 29 |
| Divrei_HaYamim_II | 2 Chronicles | 36 |

---

## Phase 1: Discover All Chapter URLs

Chapter URLs follow this pattern:
  https://www.chabad.org/library/bible_cdo/aid/{AID}/jewish/Chapter-{N}.htm

The `{AID}` is a unique numeric ID per chapter across the entire site — it is NOT simply
sequential within a book.

### Discovery approach: extract `SectionListItems` JSON

**Confirmed**: The `<select>` dropdown elements in the HTML are **empty** — they are
populated client-side. Do NOT attempt to parse `<option>` elements. Instead, every
chapter page inlines a JavaScript variable containing all 929 chapter AIDs:

```js
var SectionListItems = { "Text": null, "Value": null, "Selected": false, "Items": [
  { "Text": "Torah (The Pentateuch)", "Value": "6288", "Items": [
    { "Text": "Bereshit (Genesis)", "Value": "6289", "Items": [
      { "Text": "Chapter 1", "Value": "8165", "Items": [] },
      { "Text": "Chapter 2", "Value": "8166", "Items": [] },
      ...
    ]},
    ...
  ]},
  { "Text": "Nevi'im (Prophets)", "Value": "15747", "Items": [ ... ] },
  { "Text": "Ketuvim (Scriptures)", "Value": "15748", "Items": [ ... ] }
]};
```

This variable contains all three sections — Torah, Neviim, and Ketuvim — in a single
fetch. No secondary fetches, redirects, or "Next Chapter" chaining are needed.

**Implementation steps:**

1. Fetch the raw HTML of `https://www.chabad.org/library/bible_cdo/aid/8165`.

2. Extract the JSON with a regex:
   ```ts
   const match = html.match(/var SectionListItems = (\{[\s\S]*?\});/);
   if (!match) throw new Error('SectionListItems not found');
   const json = match[1];
   ```

3. Parse with `JSON.parse`. The three-level nesting maps to:
   - Level 1 Items: Section (Torah / Neviim / Ketuvim)
   - Level 2 Items: Book
   - Level 3 Items: Chapter — `"Text": "Chapter N"`, `"Value": "{AID}"`

4. Build the chapter URL from each chapter's `Value`:
   ```
   https://www.chabad.org/library/bible_cdo/aid/{AID}
   ```

5. Map each book's `Text` (e.g., `"Bereshit (Genesis)"`) to its folder name using a
   lookup dictionary that strips the English parenthetical.

6. Build a flat ordered list of all chapters:
   ```ts
   const allChapters: ChapterDef[] = []; // 929 entries in canonical Tanach order
   ```

---

## Phase 2: Confirmed HTML Structure

All gaps resolved by inspecting raw HTML of Genesis Chapter 1 and Tehillim Chapter 1.

### Key confirmed facts

- **Both verse text and Rashi** are fully server-rendered in the initial HTTP response.
  No JavaScript execution or Playwright is needed for any book.
- **No URL parameters** affect content delivery. `?showrashi=`, `?rashi=`, `?lang=` etc.
  do nothing server-side. The "Show/Hide" Rashi button is a CSS opacity tween only.
- **One single HTML layout** used by all books across all three sections (confirmed
  identically in Bereshit Ch1 and Tehillim Ch1). There are no layout variants to detect.

### Table structure

All content lives in `<table class="Co_TanachTable">`. Walk all `<tr>` children in order,
tracking the current verse number as you go.

#### Verse rows — `<tr class="Co_Verse">`

```html
<tr class="Co_Verse">
  <td valign="top">
    <a id="v{internal_id}"></a>
    <a id="v{n}" class="co_VerseNum" href="#v{n}">{arabic_numeral}</a>
    <span class="co_VerseText">{english text}</span>
  </td>
  <td class="Co_Spacer"> </td>
  <td valign="top" class="hebrew">
    <a id="v{n}" class="co_VerseNum" href="#v{n}">{hebrew_letter(s)}</a>
    <span class="co_VerseText">{hebrew text with nikud and cantillation}</span>
  </td>
</tr>
```

- **Verse number**: always in `<a class="co_VerseNum">` for ALL books — never bare text.
- **Verse text**: always in `<span class="co_VerseText">`.
- Use HtmlAgilityPack selectors `a.co_VerseNum` and `span.co_VerseText` directly.
  Do NOT use `InnerText` prefix-stripping.
- Strip nikkud (U+0591–U+05C7) from Hebrew text when writing `Chapter_N-H.md` and all Rashi
  Hebrew files. Preserve full nikkud only in `Chapter_N-H.nikkud.md`.

#### Rashi rows — `<tr class="Co_Rashi">`

Rashi rows follow immediately after the verse row they comment on. A single verse may
have multiple consecutive `Co_Rashi` rows (e.g., Genesis 1:1 has 3 entries; 1:2 has 5).

```html
<tr class="Co_Rashi">
  <td valign="top">
    <span class="Co_RashiContainer">
      <span class="co_RashiTitle">{quoted phrase (English)}</span>
      <span class="co_RashiText">{commentary body (English)}</span>
    </span>
  </td>
  <td class="Co_Spacer"> </td>
  <td valign="top" class="hebrew">
    <span class="Co_RashiContainer">
      <span class="co_RashiTitle">{quoted phrase (Hebrew)}</span>
      <span class="co_RashiText">{commentary body (Hebrew)}</span>
    </span>
  </td>
</tr>
```

- **Verse association**: `Co_Rashi` rows carry no verse number of their own. Track by
  noting the last `Co_Verse` row seen while walking the table in document order.
- **Content to extract**: concatenate `co_RashiTitle.InnerText + " " + co_RashiText.InnerText`
  for both the English and Hebrew cells. This gives the full commentary per entry.
- **One line per entry**: each `Co_Rashi` row → one output line. Multiple entries for the
  same verse each get their own line with the same verse number.

---

## Phase 3: TypeScript Project Structure

Split across focused modules. Entry point is `scraper.ts`.

```
TanachScraper/
├── scraper.ts     (main orchestration loop + entry point)
├── types.ts       (shared interfaces: ChapterDef, VerseEntry, RashiEntry, BookStats, SectionStats)
├── constants.ts   (DISCOVERY_URL, BOOK_FOLDER_MAP)
├── fetch.ts       (fetchPage, fetchWithRetry, sleep — PowerShell-based HTTP)
├── discover.ts    (discoverChapters — extracts SectionListItems JSON)
├── parse.ts       (parseVerses, parseRashi — cheerio HTML parsing)
├── write.ts       (writeChapterFiles, expectedChapterFiles — writes 5 .md files per chapter)
├── stats.ts       (logFailure, writeStats, buildSectionStats, formatNum)
├── package.json
└── tsconfig.json
```

Run directly from the console with no build step needed:
```
npx tsx scraper.ts
```

---

## Phase 4: HTTP Fetching

### fetch setup:
Use the built-in `fetch` API (available in Node.js 18+). No extra packages needed.

```ts
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; TanachScraper/1.0; personal-use)',
  'Accept-Language': 'he,en-US;q=0.9,en;q=0.8',
};

async function fetchPage(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, { headers: DEFAULT_HEADERS, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}
```

### Retry logic:
Wrap `fetchPage` in a simple retry loop (no extra library needed):
```ts
async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchPage(url);
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await sleep(delay);
    }
  }
  throw new Error('unreachable');
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
```

### Rate limiting:
Add `await sleep(750)` between every HTTP request. This is a personal-use
scraper and must be respectful of server resources.

---

## Phase 5: Parsing

Use `cheerio` (jQuery-compatible HTML parser for Node.js):

```ts
import * as cheerio from 'cheerio';

const $ = cheerio.load(html);
```

### Verse parsing:
1. Select `table.Co_TanachTable tr.Co_Verse`.
2. For each verse row:
   - English cell (col 1, first `td`): `a.co_VerseNum` → `.text()` for the Arabic numeral;
     `span.co_VerseText` → `.text()` for the English text.
   - Hebrew cell (col 3, `td.hebrew`): same selectors for Hebrew letter(s) and text.
3. Build `VerseEntry`:
   - `verseNum` = `parseInt` of the Arabic numeral from `co_VerseNum`.
   - `hebrewNum` = raw `.text()` of the Hebrew cell's `co_VerseNum`.

```ts
function parseVerses(html: string): VerseEntry[] {
  const $ = cheerio.load(html);
  const entries: VerseEntry[] = [];
  $('table.Co_TanachTable tr.Co_Verse').each((_, row) => {
    const tds = $(row).find('td');
    const engCell = tds.eq(0);
    const hebCell = tds.filter('.hebrew');
    entries.push({
      verseNum: parseInt(engCell.find('a.co_VerseNum').text(), 10),
      hebrewNum: hebCell.find('a.co_VerseNum').text(),
      englishText: engCell.find('span.co_VerseText').text(),
      hebrewText: hebCell.find('span.co_VerseText').text(),
    });
  });
  return entries;
}
```

### Rashi parsing:
Walk ALL `<tr>` children of `Co_TanachTable` in document order, tracking `currentVerseNum`
and `currentHebrewNum` each time a `Co_Verse` row is encountered.

For each `tr.Co_Rashi`:
  - English cell (col 1): `co_RashiTitle.text() + ' ' + co_RashiText.text()`
  - Hebrew cell (`td.hebrew`): same concatenation from the Hebrew cell

```ts
function parseRashi(html: string): RashiEntry[] {
  const $ = cheerio.load(html);
  const entries: RashiEntry[] = [];
  let currentVerseNum = 0;
  let currentHebrewNum = '';
  $('table.Co_TanachTable tr').each((_, row) => {
    const cls = $(row).attr('class') ?? '';
    if (cls.includes('Co_Verse')) {
      const tds = $(row).find('td');
      currentVerseNum = parseInt(tds.eq(0).find('a.co_VerseNum').text(), 10);
      currentHebrewNum = tds.filter('.hebrew').find('a.co_VerseNum').text();
    } else if (cls.includes('Co_Rashi')) {
      const tds = $(row).find('td');
      const engCell = tds.eq(0);
      const hebCell = tds.filter('.hebrew');
      entries.push({
        verseNum: currentVerseNum,
        hebrewNum: currentHebrewNum,
        rashiEnglish: engCell.find('.co_RashiTitle').text() + ' ' + engCell.find('.co_RashiText').text(),
        rashiHebrew: hebCell.find('.co_RashiTitle').text() + ' ' + hebCell.find('.co_RashiText').text(),
      });
    }
  });
  return entries;
}
```

A single verse produces multiple `RashiEntry` objects (one per `Co_Rashi` row) — this is expected.
Do not deduplicate or merge them.

---

## Phase 6: File Writing

For each chapter, create the folder and write 5 files:

### Chapter_N-H.md (Hebrew only):
```
**[HebrewNum]**\t[HebrewText]
**[HebrewNum]**\t[HebrewText]
...
```

### Chapter_N-E.md (English only):
```
**[VerseNum]**\t[EnglishText]
**[VerseNum]**\t[EnglishText]
...
```

### Chapter_N-H.rashi.md (Rashi Hebrew only):
One line per `Co_Rashi` entry. Blank line when the verse number changes. Title bolded.
```
**[HebrewNum]**\t**[HebTitle1]** [HebBody1]
**[HebrewNum]**\t**[HebTitle2]** [HebBody2]

**[HebrewNum2]**\t**[HebTitle1]** [HebBody1]
...
```

### Chapter_N-E.rashi.md (Rashi English only):
One line per `Co_Rashi` entry. Blank line when the verse number changes. Title bolded.
```
**[VerseNum]**\t**[EngTitle1]** [EngBody1]
**[VerseNum]**\t**[EngTitle2]** [EngBody2]

**[VerseNum2]**\t**[EngTitle1]** [EngBody1]
...
```

### Chapter_N.rashi.md (Rashi combined):
One Hebrew+English pair per `Co_Rashi` entry. Hebrew and English lines are adjacent (no
blank line between them). Blank line only between different verse groups. Title bolded.
```
**[VerseNum] [Hebrew]**\t**[HebTitle1]** [HebBody1]
**[VerseNum] [English]**\t**[EngTitle1]** [EngBody1]
**[VerseNum] [Hebrew]**\t**[HebTitle2]** [HebBody2]
**[VerseNum] [English]**\t**[EngTitle2]** [EngBody2]

**[VerseNum2] [Hebrew]**\t**[HebTitle1]** [HebBody1]
**[VerseNum2] [English]**\t**[EngTitle1]** [EngBody1]
```

---

## Phase 7: Progress, Resume, and Error Handling

### Output folder selection:
Run the collision-avoidance logic (see Output Folder Structure section) before any
HTTP fetches. Log the chosen folder at startup:
```
Output folder: C:\Tanach-1
```

### Resume support:
Before processing a chapter, check if the chapter folder contains all 5 expected files
using `fs.existsSync`. If yes, log `[SKIP] Torah/Bereshit/Chapter_1 — already complete` and continue.

> Note: resume applies only within a single run's chosen output folder. A folder that
> already existed triggered a new numbered folder, so resume will never skip chapters
> in a brand-new run.

### Console progress:
```
[1/929] Torah/Bereshit/Chapter_1 — fetching...
[1/929] Torah/Bereshit/Chapter_1 — done (31 verses, 57 Rashi entries)
[2/929] Torah/Bereshit/Chapter_2 — fetching...
```

### Stats file:
After the last chapter completes (or on clean exit after `Ctrl+C`, by handling `process.on('SIGINT', ...)`),
write `stats.md` at the root of the output folder. Accumulate counts during the run in memory; write once at the end.

### Error handling:
Wrap each chapter in try/catch. On failure:
- Log the error to console in red using `\x1b[31m...\x1b[0m` ANSI codes
- Append to `{outputRoot}\failed_chapters.log`:
  ```
  [2026-04-14 03:15:22] FAILED: Torah/Bereshit/Chapter_1 | URL: https://... | Error: ...
  ```
- Continue to next chapter without stopping the run

### Consecutive-failure abort:
Track a `consecutiveFailures` counter (reset to `0` on every successful chapter).
If **3 or more chapters fail in a row**, immediately abort and write stats.

---

## Phase 8: Single-Chapter Encoding Test

Before running the full scrape, use `test_chapter.ts` to verify that Hebrew characters
and nikkud are coming through correctly.

```
npm test                           # Genesis 1 (default)
npx tsx test_chapter.ts 8166       # Genesis 2
npx tsx test_chapter.ts 16222      # Tehillim (Psalms) 1
```

### Why the fix is needed

PowerShell defaults to the system OEM code page (Windows-1252 or similar) for stdout.
Hebrew characters (U+05B0–U+05EA) cannot be represented in that code page, so they are
replaced with `?` before Node.js ever reads them. Setting `[Console]::OutputEncoding`
to UTF-8 before writing `$r.Content` ensures the full Unicode content passes through.

---

## Phase 9: Full-Run Testing Checklist

Before running the full 929-chapter scrape:

1. Run for Genesis Chapter 1 only. Verify all 5 files exist with correct content.
2. Run for Genesis Chapter 2. Verify verse count and file structure match.
3. Spot-check a Ketuvim book (e.g., Tehillim Chapter 1).
4. Verify the resume feature: run again for Chapter 1 — it should be skipped.

---

## Summary of Confirmed Facts

| Topic | Confirmed Fact |
|-------|----------------|
| `<select>` dropdown data | Empty in HTML. All 929 AIDs are in the inline `SectionListItems` JS variable |
| All three sections in one fetch | Yes — Torah, Neviim, and Ketuvim are all in `SectionListItems` on every page |
| Rashi delivery method | Fully server-rendered HTML; no AJAX, no JavaScript execution needed |
| URL parameters for Rashi | None needed; `?showrashi=` is cosmetic only (client-side opacity tween) |
| HTML layout variants | One layout only: `Co_TanachTable` with `Co_Verse` / `Co_Rashi` rows |
| Verse number location | Always in `<a class="co_VerseNum">` — applies to ALL books, not just Tehillim |
| Verse text location | Always in `<span class="co_VerseText">` |
| Rashi verse association | No verse number on `Co_Rashi` rows — track by last seen `Co_Verse` |
| Multiple Rashi entries per verse | Common — one line per `Co_Rashi` row; blank line between verse groups |


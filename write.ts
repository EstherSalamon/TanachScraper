import * as fs from "fs";
import * as path from "path";
import type { VerseEntry, RashiEntry } from "./types.js";

// ─── File naming conventions ──────────────────────────────────────────────────
//
//   Chapter_N-H.md          Hebrew verse text (no nikkud/cantillation)
//   Chapter_N-H.nikkud.md   Hebrew verse text with full nikkud and cantillation
//   Chapter_N-E.md          English verse text
//   Chapter_N.rashi.md      Rashi combined (Hebrew + English interleaved, no nikkud)
//   Chapter_N-H.rashi.md    Rashi Hebrew only (no nikkud)
//   Chapter_N-E.rashi.md    Rashi English only
//
// These are the 6 files written per chapter. The resume check in scraper.ts
// must list all six to know a chapter is complete.

/** Strip Hebrew nikkud (vowel points) and cantillation marks (U+0591–U+05C7).
 *  The maqaf (U+05BE, ־) is a word-connecting hyphen; replace it with a space
 *  before stripping so that joined words (e.g. יְהִי־אוֹר) split correctly. */
function stripNikkud(text: string): string {
    return text.replace(/\u05BE/g, " ").replace(/[\u0591-\u05C7]/g, "");
}

function buildRashiLines(
    entries: RashiEntry[],
    lineMapper: (e: RashiEntry) => string | string[],
): string {
    const lines: string[] = [];
    let lastVerseNum = -1;
    for (const e of entries) {
        if (lastVerseNum !== -1 && e.verseNum !== lastVerseNum) {
            lines.push(""); // blank line between verse groups
        }
        const mapped = lineMapper(e);
        if (Array.isArray(mapped)) {
            lines.push(...mapped);
        } else {
            lines.push(mapped);
        }
        lastVerseNum = e.verseNum;
    }
    return lines.join("\n\n");
}

export async function writeChapterFiles(
    chapterDir: string,
    chapterNum: number,
    verses: VerseEntry[],
    rashiEntries: RashiEntry[],
): Promise<void> {
    await fs.promises.mkdir(chapterDir, { recursive: true });

    const base = `Chapter_${chapterNum}`;

    // ── Chapter_N-H.md  (Hebrew verse text, no nikkud) ────────────────────────
    await fs.promises.writeFile(
        path.join(chapterDir, `${base}-H.md`),
        verses
            .map((v) => `**${v.hebrewNum}**\t${stripNikkud(v.hebrewText)}`)
            .join("\n\n"),
        { encoding: "utf8" },
    );

    // ── Chapter_N-H.nikkud.md  (Hebrew verse text with nikkud) ──────────────
    await fs.promises.writeFile(
        path.join(chapterDir, `${base}-H.nikkud.md`),
        verses.map((v) => `**${v.hebrewNum}**\t${v.hebrewText}`).join("\n\n"),
        { encoding: "utf8" },
    );

    // ── Chapter_N-E.md  (English verse text) ─────────────────────────────────
    await fs.promises.writeFile(
        path.join(chapterDir, `${base}-E.md`),
        verses.map((v) => `**${v.verseNum}**\t${v.englishText}`).join("\n\n"),
        { encoding: "utf8" },
    );

    // ── Rashi files ───────────────────────────────────────────────────────────
    const noRashi = "(No Rashi commentary for this chapter.)";

    if (rashiEntries.length === 0) {
        for (const name of [
            `${base}.rashi.md`,
            `${base}-E.rashi.md`,
            `${base}-H.rashi.md`,
        ]) {
            await fs.promises.writeFile(path.join(chapterDir, name), noRashi, {
                encoding: "utf8",
            });
        }
        return;
    }

    // ── Chapter_N-E.rashi.md  (Rashi English only) ───────────────────────────
    await fs.promises.writeFile(
        path.join(chapterDir, `${base}-E.rashi.md`),
        buildRashiLines(
            rashiEntries,
            (e) => `**${e.verseNum}**\t${e.rashiEnglish}`,
        ),
        { encoding: "utf8" },
    );

    // ── Chapter_N-H.rashi.md  (Rashi Hebrew only, no nikkud) ─────────────────
    await fs.promises.writeFile(
        path.join(chapterDir, `${base}-H.rashi.md`),
        buildRashiLines(
            rashiEntries,
            (e) => `**${e.hebrewNum}**\t${stripNikkud(e.rashiHebrew)}`,
        ),
        { encoding: "utf8" },
    );

    // ── Chapter_N.rashi.md  (Rashi combined — Hebrew with nikkud + English interleaved) ─
    await fs.promises.writeFile(
        path.join(chapterDir, `${base}.rashi.md`),
        buildRashiLines(
            rashiEntries,
            (e) =>
                `**${e.verseNum} [Hebrew]**\t${e.rashiHebrew}<br>\n**${e.verseNum} [English]**\t${e.rashiEnglish}`,
        ),
        { encoding: "utf8" },
    );
}

/** The 6 filenames expected in a complete chapter folder (for resume detection). */
export function expectedChapterFiles(chapterNum: number): string[] {
    const base = `Chapter_${chapterNum}`;
    return [
        `${base}-H.md`,
        `${base}-H.nikkud.md`,
        `${base}-E.md`,
        `${base}.rashi.md`,
        `${base}-H.rashi.md`,
        `${base}-E.rashi.md`,
    ];
}

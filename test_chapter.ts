/**
 * test_chapter.ts
 *
 * Fetches one chapter, writes all 6 files using the real writeChapterFiles()
 * function (same as the main scraper), then assembles test_output.md from
 * the first few entries of each written file.
 *
 * Usage:
 *   npm test                           <- Genesis 1 (default, AID 8165)
 *   npx tsx test_chapter.ts 8166       <- Genesis 2
 *   npx tsx test_chapter.ts 16222      <- Tehillim (Psalms) 1
 *
 * Open test_output.md in VS Code to visually verify rendering.
 * Do NOT rely on the terminal — Windows does not render RTL text.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { fetchWithRetry } from "./fetch.js";
import { parseVerses, parseRashi } from "./parse.js";
import { writeChapterFiles } from "./write.js";

const PREVIEW_ENTRIES = 5;
const OUT_FILE = path.join(__dirname, "test_output.md");

/** Returns true if the string contains at least one Hebrew Unicode character. */
function hasHebrew(s: string): boolean {
    return /[\u0590-\u05FF]/.test(s);
}

/**
 * Read a file and return the first N paragraph-separated blocks.
 * Paragraphs are delimited by one or more blank lines (\n\n+).
 */
function firstN(filePath: string, n: number): string {
    const content = fs.readFileSync(filePath, "utf8");
    return content
        .split(/\n{2,}/)
        .filter((s) => s.trim() !== "")
        .slice(0, n)
        .join("\n\n");
}

async function main(): Promise<void> {
    const aid = process.argv[2] ?? "8165";
    const url = `https://www.chabad.org/library/bible_cdo/aid/${aid}`;

    console.log(`\nFetching: ${url}\n`);
    const html = await fetchWithRetry(url);
    console.log(`Received ${html.length.toLocaleString()} bytes of HTML.`);

    // ── Parse ────────────────────────────────────────────────────────────────
    const verses = parseVerses(html);
    const rashiEntries = parseRashi(html);
    console.log(
        `Parsed ${verses.length} verses, ${rashiEntries.length} Rashi entries.`,
    );

    // ── Console encoding sanity check ────────────────────────────────────────
    console.log("\nEncoding check (first 5 verses):");
    for (const v of verses.slice(0, PREVIEW_ENTRIES)) {
        const ok = hasHebrew(v.hebrewText);
        console.log(
            `  v${v.verseNum}: Hebrew chars present = ${ok ? "YES ✓" : "NO ✗  <-- still broken"}`,
        );
    }

    // ── Write all 6 files via the real writeChapterFiles() ───────────────────
    const tmpDir = path.join(os.tmpdir(), `tanach-test-${aid}`);
    await writeChapterFiles(tmpDir, 1, verses, rashiEntries);
    console.log(`\nWrote chapter files to: ${tmpDir}`);

    // ── Assemble test_output.md from the written files ───────────────────────
    const base = path.join(tmpDir, "Chapter_1");
    const sections: string[] = [
        "# Test Output — Hebrew Encoding Check",
        "",
        `**Source:** ${url}`,
        "",
        "Open this file in VS Code to visually verify all 6 file variants.",
        "",
        "---",
        "",
        `## -H.md — Hebrew verses, no nikkud (first ${PREVIEW_ENTRIES})`,
        "",
        firstN(`${base}-H.md`, PREVIEW_ENTRIES),
        "",
        "---",
        "",
        `## -H.nikkud.md — Hebrew verses with nikkud (first ${PREVIEW_ENTRIES})`,
        "",
        firstN(`${base}-H.nikkud.md`, PREVIEW_ENTRIES),
        "",
        "---",
        "",
        `## -E.md — English verses (first ${PREVIEW_ENTRIES})`,
        "",
        firstN(`${base}-E.md`, PREVIEW_ENTRIES),
        "",
        "---",
        "",
        `## .rashi.md — Rashi combined (first ${PREVIEW_ENTRIES})`,
        "",
        firstN(`${base}.rashi.md`, PREVIEW_ENTRIES),
        "",
        "---",
        "",
        `## -H.rashi.md — Rashi Hebrew only, no nikkud (first ${PREVIEW_ENTRIES})`,
        "",
        firstN(`${base}-H.rashi.md`, PREVIEW_ENTRIES),
        "",
        "---",
        "",
        `## -E.rashi.md — Rashi English only (first ${PREVIEW_ENTRIES})`,
        "",
        firstN(`${base}-E.rashi.md`, PREVIEW_ENTRIES),
    ];

    await fs.promises.writeFile(OUT_FILE, sections.join("\n"), {
        encoding: "utf8",
    });
    console.log(`\nWrote: ${OUT_FILE}`);
    console.log(
        "Open test_output.md in VS Code to visually verify the Hebrew.\n",
    );
}

main().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});

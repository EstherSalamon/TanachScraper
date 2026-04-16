import * as fs from "fs";
import * as path from "path";
import type { BookStats } from "./types.ts";
import { discoverChapters } from "./discover.js";
import { sleep, fetchWithRetry } from "./fetch.js";
import { parseVerses, parseRashi } from "./parse.js";
import { writeChapterFiles, expectedChapterFiles } from "./write.js";
import { logFailure, writeStats, buildSectionStats } from "./stats.js";

async function main(): Promise<void> {
    // -- Output folder (collision-avoidance)
    let outputRoot = path.join(
        process.env["USERPROFILE"] ?? "C:\\Users\\esthers",
        "Desktop",
        "Tanach",
    );
    if (fs.existsSync(outputRoot)) {
        let i = 1;
        while (fs.existsSync(`${outputRoot}-${i}`)) i++;
        outputRoot = `${outputRoot}-${i}`;
    }
    console.log(`Output folder: ${outputRoot}`);

    // -- Discover all 929 chapters
    const allChapters = await discoverChapters();
    const totalChapters = allChapters.length;

    // -- Build stats accumulators keyed by section -> book
    const statsMap = new Map<string, Map<string, BookStats>>();
    for (const ch of allChapters) {
        if (!statsMap.has(ch.section)) statsMap.set(ch.section, new Map());
        const byBook = statsMap.get(ch.section)!;
        if (!byBook.has(ch.bookFolder)) {
            byBook.set(ch.bookFolder, {
                bookFolder: ch.bookFolder,
                chapters: 0,
                verses: 0,
                rashiEntries: 0,
            });
        }
    }

    let completedChapters = 0;
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 3;

    // -- SIGINT handler: write stats on Ctrl+C
    let shutdownRequested = false;
    process.on("SIGINT", async () => {
        if (shutdownRequested) process.exit(1);
        shutdownRequested = true;
        console.log("\n\nInterrupted -- writing stats...");
        try {
            await writeStats(
                outputRoot,
                buildSectionStats(statsMap),
                completedChapters,
                totalChapters,
            );
            console.log(`stats.md written to ${outputRoot}`);
        } catch {
            /* ignore */
        }
        process.exit(0);
    });

    // -- Process each chapter
    for (let idx = 0; idx < allChapters.length; idx++) {
        if (shutdownRequested) break;

        const ch = allChapters[idx];
        const chapterLabel = `${ch.section}/${ch.bookFolder}/Chapter_${ch.chapterNum}`;
        const chapterDir = path.join(
            outputRoot,
            ch.section,
            ch.bookFolder,
            `Chapter_${ch.chapterNum}`,
        );

        // Resume: skip if all 5 expected files already exist
        const expected = expectedChapterFiles(ch.chapterNum).map((f) =>
            path.join(chapterDir, f),
        );
        if (expected.every((f) => fs.existsSync(f))) {
            console.log(
                `[${idx + 1}/${totalChapters}] ${chapterLabel} -- already complete, skipping`,
            );
            completedChapters++;
            statsMap.get(ch.section)!.get(ch.bookFolder)!.chapters++;
            continue;
        }

        console.log(`[${idx + 1}/${totalChapters}] ${chapterLabel} -- fetching...`);

        try {
            const html = await fetchWithRetry(ch.url);
            const verses = parseVerses(html);
            const rashiEntries = parseRashi(html);

            await writeChapterFiles(chapterDir, ch.chapterNum, verses, rashiEntries);

            completedChapters++;
            consecutiveFailures = 0;
            const bk = statsMap.get(ch.section)!.get(ch.bookFolder)!;
            bk.chapters++;
            bk.verses += verses.length;
            bk.rashiEntries += rashiEntries.length;

            console.log(
                `[${idx + 1}/${totalChapters}] ${chapterLabel} -- done (${verses.length} verses, ${rashiEntries.length} Rashi entries)`,
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(
                `\x1b[31m[${idx + 1}/${totalChapters}] ${chapterLabel} -- FAILED: ${msg}\x1b[0m`,
            );
            await logFailure(outputRoot, chapterLabel, ch.url, err);
            consecutiveFailures++;
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                console.error(
                    `\x1b[31m\n${MAX_CONSECUTIVE_FAILURES} consecutive chapters failed — aborting run.\x1b[0m`,
                );
                shutdownRequested = true;
                break;
            }
        }

        // Rate limiting: 750 ms between requests
        if (idx < allChapters.length - 1 && !shutdownRequested) {
            await sleep(750);
        }
    }

    // -- Write final stats
    await writeStats(
        outputRoot,
        buildSectionStats(statsMap),
        completedChapters,
        totalChapters,
    );
    console.log(`\nAll done! stats.md written to ${outputRoot}`);
}

main().catch((err) => {
    console.error("\x1b[31mFatal error:\x1b[0m", err);
    process.exit(1);
});

import * as fs from "fs";
import * as path from "path";
import type { BookStats, SectionStats } from "./types.ts";

export function formatNum(n: number): string {
    return n.toLocaleString("en-US");
}

export async function logFailure(
    outputRoot: string,
    chapterPath: string,
    url: string,
    err: unknown,
): Promise<void> {
    await fs.promises.mkdir(outputRoot, { recursive: true });
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const message = err instanceof Error ? err.message : String(err);
    const line = `[${timestamp}] FAILED: ${chapterPath} | URL: ${url} | Error: ${message}\n`;
    await fs.promises.appendFile(
        path.join(outputRoot, "failed_chapters.log"),
        line,
        { encoding: "utf8" },
    );
}

export async function writeStats(
    outputRoot: string,
    sectionStats: SectionStats[],
    completedChapters: number,
    totalChapters: number,
): Promise<void> {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const incomplete = completedChapters < totalChapters;

    let totalVerses = 0;
    let totalRashi = 0;
    for (const sec of sectionStats) {
        for (const b of sec.books) {
            totalVerses += b.verses;
            totalRashi += b.rashiEntries;
        }
    }
    const totalBooks = sectionStats.reduce((s, sec) => s + sec.books.length, 0);
    const totalChaptersFull = sectionStats.reduce(
        (s, sec) => s + sec.books.reduce((bs, b) => bs + b.chapters, 0),
        0,
    );

    const lines: string[] = [
        "# Tanach Scraper — Statistics",
        "",
        `Generated: ${timestamp}`,
        `Output folder: ${outputRoot}`,
        "",
        "## Summary",
        "",
        `Total: ${sectionStats.length} sections | ${formatNum(totalBooks)} books | ${formatNum(totalChaptersFull)} chapters | ${formatNum(totalVerses)} verses | ${formatNum(totalRashi)} Rashi entries`,
        "",
    ];

    if (incomplete) {
        lines.push(
            `⚠ Run incomplete — ${completedChapters} of ${totalChapters} chapters processed.`,
        );
        lines.push("");
    }

    for (const sec of sectionStats) {
        const secChapters = sec.books.reduce((s, b) => s + b.chapters, 0);
        const secVerses = sec.books.reduce((s, b) => s + b.verses, 0);
        const secRashi = sec.books.reduce((s, b) => s + b.rashiEntries, 0);

        lines.push(
            `## ${sec.sectionName} — ${sec.books.length} books | ${formatNum(secChapters)} chapters`,
        );
        lines.push("");
        lines.push("| Book | Chapters | Verses | Rashi Entries |");
        lines.push("|------|----------|--------|---------------|");

        for (const b of sec.books) {
            lines.push(
                `| ${b.bookFolder} | ${formatNum(b.chapters)} | ${formatNum(b.verses)} | ${formatNum(b.rashiEntries)} |`,
            );
        }

        lines.push(
            `| **${sec.sectionName} total** | **${formatNum(secChapters)}** | **${formatNum(secVerses)}** | **${formatNum(secRashi)}** |`,
        );
        lines.push("");
    }

    await fs.promises.writeFile(
        path.join(outputRoot, "stats.md"),
        lines.join("\n"),
        { encoding: "utf8" },
    );
}

export function buildSectionStats(
    statsMap: Map<string, Map<string, BookStats>>,
): SectionStats[] {
    const sectionOrder = ["Torah", "Neviim", "Ketuvim"];
    return sectionOrder
        .filter((s) => statsMap.has(s))
        .map((sectionName) => ({
            sectionName,
            books: Array.from(statsMap.get(sectionName)!.values()),
        }));
}
import * as cheerio from "cheerio";
import type { VerseEntry, RashiEntry } from "./types.ts";

export function parseVerses(html: string): VerseEntry[] {
    const $ = cheerio.load(html);
    const entries: VerseEntry[] = [];

    $("table.Co_TanachTable tr.Co_Verse").each((_, row) => {
        const tds = $(row).find("td");
        const engCell = tds.eq(0);
        const hebCell = tds.filter(".hebrew");

        const verseNumStr = engCell.find("a.co_VerseNum").text().trim();
        const hebrewNum = hebCell.find("a.co_VerseNum").text().trim();
        const englishText = engCell.find("span.co_VerseText").text().trim();
        const hebrewText = hebCell.find("span.co_VerseText").text().trim();

        const verseNum = parseInt(verseNumStr, 10);
        if (!isNaN(verseNum) && englishText) {
            entries.push({ verseNum, hebrewNum, englishText, hebrewText });
        }
    });

    return entries;
}

/** Extract text from an element, preserving <br> tags as newlines. */
function textWithBreaks(
    $: ReturnType<typeof cheerio.load>,
    el: ReturnType<typeof $>,
): string {
    const clone = el.clone();
    clone.find("br").replaceWith("\n");
    return clone.text().trim();
}

export function parseRashi(html: string): RashiEntry[] {
    const $ = cheerio.load(html);
    const entries: RashiEntry[] = [];
    let currentVerseNum = 0;
    let currentHebrewNum = "";

    $("table.Co_TanachTable tr").each((_, row) => {
        const cls = $(row).attr("class") ?? "";

        if (cls.includes("Co_Verse")) {
            const tds = $(row).find("td");
            currentVerseNum = parseInt(
                tds.eq(0).find("a.co_VerseNum").text().trim(),
                10,
            );
            currentHebrewNum = tds
                .filter(".hebrew")
                .find("a.co_VerseNum")
                .text()
                .trim();
        } else if (cls.includes("Co_Rashi")) {
            const tds = $(row).find("td");
            const engCell = tds.eq(0);
            const hebCell = tds.filter(".hebrew");

            const engTitle = engCell.find(".co_RashiTitle").text().trim();
            const engBody = textWithBreaks($, engCell.find(".co_RashiText"));
            const rashiEnglish = engTitle
                ? `**${engTitle}** ${engBody}`.trim()
                : engBody;

            const hebTitle = hebCell.find(".co_RashiTitle").text().trim();
            const hebBody = textWithBreaks($, hebCell.find(".co_RashiText"));
            const rashiHebrew = hebTitle
                ? `**${hebTitle}** ${hebBody}`.trim()
                : hebBody;

            if (rashiEnglish || rashiHebrew) {
                entries.push({
                    verseNum: currentVerseNum,
                    hebrewNum: currentHebrewNum,
                    rashiEnglish,
                    rashiHebrew,
                });
            }
        }
    });

    return entries;
}

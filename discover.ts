import type { ChapterDef } from "./types.ts";
import { DISCOVERY_URL, BOOK_FOLDER_MAP } from "./constants.js";
import { fetchWithRetry } from "./fetch.js";

interface SectionListItem {
    Text: string;
    Value: string;
    Items: SectionListItem[];
}

/** Strip the English parenthetical from a book name:
 *  "Bereshit (Genesis)" → "Bereshit"
 *  "Shmuel I (1 Samuel)" → "Shmuel I"
 */
function extractBookKey(text: string): string {
    return text.replace(/\s*\(.*\)\s*$/, "").trim();
}

function sectionLabel(text: string): string {
    if (text.includes("Torah") || text.includes("Pentateuch")) return "Torah";
    if (text.includes("Nevi") || text.includes("Prophets")) return "Neviim";
    if (text.includes("Ketuvim") || text.includes("Scriptures")) return "Ketuvim";
    return text;
}

/** Fetch the discovery page, extract the inline SectionListItems JSON, and
 *  return a flat ordered list of all 929 chapters with their AIDs and URLs. */
export async function discoverChapters(): Promise<ChapterDef[]> {
    console.log("Fetching chapter list from Chabad.org…");
    const html = await fetchWithRetry(DISCOVERY_URL);

    const match = html.match(/var SectionListItems = (\{[\s\S]*?\});/);
    if (!match) throw new Error("SectionListItems not found in page HTML");

    const root: SectionListItem = JSON.parse(match[1]);
    const chapters: ChapterDef[] = [];

    for (const sectionItem of root.Items) {
        const section = sectionLabel(sectionItem.Text);
        for (const bookItem of sectionItem.Items) {
            const bookKey = extractBookKey(bookItem.Text);
            const bookFolder = BOOK_FOLDER_MAP[bookKey];
            if (!bookFolder) {
                console.warn(`  WARNING: unknown book key "${bookKey}" — skipping`);
                continue;
            }
            for (const chapterItem of bookItem.Items) {
                const chapterNum = parseInt(
                    chapterItem.Text.replace("Chapter ", ""),
                    10,
                );
                chapters.push({
                    section,
                    bookFolder,
                    chapterNum,
                    url: `https://www.chabad.org/library/bible_cdo/aid/${chapterItem.Value}`,
                });
            }
        }
    }

    console.log(`Discovered ${chapters.length} chapters across 3 sections.`);
    return chapters;
}

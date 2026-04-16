export interface ChapterDef {
    section: string; // e.g. "Torah"
    bookFolder: string; // e.g. "Bereshit"
    chapterNum: number; // e.g. 1
    url: string; // full chabad.org URL
}

export interface VerseEntry {
    verseNum: number;
    hebrewNum: string;
    englishText: string;
    hebrewText: string;
}

export interface RashiEntry {
    verseNum: number;
    hebrewNum: string;
    rashiEnglish: string;
    rashiHebrew: string;
}

export interface BookStats {
    bookFolder: string;
    chapters: number;
    verses: number;
    rashiEntries: number;
}

export interface SectionStats {
    sectionName: string;
    books: BookStats[];
}

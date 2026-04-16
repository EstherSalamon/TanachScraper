
export const DISCOVERY_URL =
    "https://www.chabad.org/library/bible_cdo/aid/8165";

// Maps the site's book "Text" field (before the English parenthetical) to folder names
export const BOOK_FOLDER_MAP: Record<string, string> = {
    // Torah
    Bereshit: "Bereshit",
    Shemot: "Shemot",
    Vayikra: "Vayikra",
    Bamidbar: "Bamidbar",
    Devarim: "Devarim",
    // Neviim
    Yehoshua: "Yehoshua",
    Shoftim: "Shoftim",
    "Shmuel I": "Shmuel_I",
    "Shmuel II": "Shmuel_II",
    "Melachim I": "Melachim_I",
    "Melachim II": "Melachim_II",
    Yeshayahu: "Yeshayahu",
    Yirmiyahu: "Yirmiyahu",
    Yechezkel: "Yechezkel",
    Hoshea: "Hoshea",
    Yoel: "Yoel",
    Amos: "Amos",
    Ovadiah: "Ovadiah",
    Yonah: "Yonah",
    Michah: "Michah",
    Nachum: "Nachum",
    Chavakuk: "Chavakuk",
    Tzefaniah: "Tzefaniah",
    Chaggai: "Chaggai",
    Zechariah: "Zechariah",
    Malachi: "Malachi",
    // Ketuvim
    Tehillim: "Tehillim",
    Mishlei: "Mishlei",
    Iyov: "Iyov",
    "Shir HaShirim": "Shir_HaShirim",
    "Shir Hashirim": "Shir_HaShirim", // alternate site casing
    Rut: "Rut",
    Eichah: "Eichah",
    Kohelet: "Kohelet",
    Esther: "Esther",
    Daniel: "Daniel",
    Ezra: "Ezra",
    Nechemiah: "Nechemiah",
    "Divrei HaYamim I": "Divrei_HaYamim_I",
    "Divrei Hayamim I": "Divrei_HaYamim_I", // alternate site casing
    "Divrei HaYamim II": "Divrei_HaYamim_II",
    "Divrei Hayamim II": "Divrei_HaYamim_II", // alternate site casing
};
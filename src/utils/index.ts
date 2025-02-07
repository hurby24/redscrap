import { customAlphabet } from "nanoid";

export const createSlug = (title: string): string => {
  const azToEnMap: Record<string, string> = {
    ə: "e",
    Ə: "e",
    ü: "u",
    Ü: "u",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    I: "i",
    i: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ç: "c",
    Ç: "c",
  };

  let transliterated = title
    .split("")
    .map((char) => azToEnMap[char] || char)
    .join("");

  transliterated = transliterated.replace(/[^a-zA-Z0-9\s-]/g, "");

  return transliterated
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const generateRandomId = (length = 10): string => {
  const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const nanoid = customAlphabet(alphabet, length);
  return nanoid();
};

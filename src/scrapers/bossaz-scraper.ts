import { HTMLScraper } from "../base/html-scraper.ts";
import { generateRandomId, createSlug } from "../utils/index.ts";
import type { Job } from "../db/models/jobs.ts";
import crypto from "node:crypto";
import moment from "moment";

export class BossAZScraper extends HTMLScraper {
  protected handleResponse(): void {}
}

const CategoryToId: Record<string, number> = {
  Finance: 2,
  Marketing: 6,
  "Information Technology": 5,
  Administrative: 1,
  Sales: 3,
  Design: 10,
  Legal: 12,
  "Education and Science": 9,
  Agriculture: 18,
  "Service Personnel": 18,
  "Medicine and Pharmacy": 13,
  Other: 18,
  "Tourism, hotels, restaurants": 8,
  "Sports clubs, fitness, beauty salons": 18,
  "Transport, logistics, transportation": 7,
  "Manufacturing Personnel": 14,
};

import {
  CheerioCrawler,
  createCheerioRouter,
  type ProxyConfiguration,
  RequestQueue,
} from "crawlee";
import crypto from "node:crypto";
import sql from "../db/db.ts";
import type { Job } from "../db/models/jobs.ts";

export abstract class HTMLScraper {
  protected router: ReturnType<typeof createCheerioRouter>;
  protected requestQueue!: RequestQueue;
  protected crawler!: CheerioCrawler;
  protected jobs: Job[] = [];
  public startUrls: string[] = [];
  public options: HTMLScraperOptions;

  constructor(options: HTMLScraperOptions) {
    this.router = createCheerioRouter();
    this.options = options;
    this.startUrls = options.startUrls;
  }
  public async start(): Promise<void> {
    this.requestQueue = await RequestQueue.open(
      crypto.randomBytes(12).toString("hex")
    );
    this.crawler = new CheerioCrawler({
      proxyConfiguration: this.options.proxyConfiguration,
      requestHandler: this.router,
      maxRequestsPerCrawl: this.options.maxRequestsPerCrawl,
      maxRequestRetries: 2,
      maxRequestsPerMinute: 60,
      requestQueue: this.requestQueue,
    });
    await this.crawler.run(this.startUrls);
    this.requestQueue.drop();
  }
  async saveJobs(): Promise<void> {
    console.log(`Saving ${this.jobs.length} jobs to the database...`);
    if (this.jobs.length === 0) return;

    try {
      await sql`INSERT INTO jobs ${sql(this.jobs)} ON CONFLICT DO NOTHING`;
    } catch (e) {
      console.error(e);
    }
    await sql.end();
    return;
  }

  protected abstract handleResponse(): void;
}

export interface HTMLScraperOptions {
  startUrls: string[];
  proxyConfiguration: ProxyConfiguration;
  maxRequestsPerCrawl: number;
  maxPages: number;
}

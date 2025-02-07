import { APIScraper } from "../base/api-scraper.ts";

export class JobSearchAZScraper extends APIScraper {
  protected async handleResponse(label: string, data: unknown): Promise<void> {}

  public async start(): Promise<void> {}
}

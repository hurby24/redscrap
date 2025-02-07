import { JobSearchAZScraper } from "./scrapers/jobsearchaz-scraper.ts";
import { APIScraperOptions } from "./base/api-scraper.ts";

const APIproxyConfiguration =
  process.env.PROXY_URLS?.split(",").map((url) => {
    const [authAndHost, port] = url.split("@")[1].split(":");
    const [username, password] = url.split("//")[1].split("@")[0].split(":");
    const host = authAndHost;

    return {
      protocol: "http",
      host,
      port: Number.parseInt(port, 10),
      auth: { username, password },
    };
  }) || [];

import { JobSearchAZScraper } from "./scrapers/jobsearchaz-scraper.ts";
import { BossAZScraper } from "./scrapers/bossaz-scraper.ts";
import type { APIScraperOptions } from "./base/api-scraper.ts";
import type { HTMLScraperOptions } from "./base/html-scraper.ts";
import { ProxyConfiguration } from "crawlee";

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

const HTMLproxyConfiguration = new ProxyConfiguration({
	proxyUrls: process.env.PROXY_URLS?.split(","),
});

//jobsearch.az
const ApiOptions: APIScraperOptions = {
	baseUrl: "https://www.jobsearch.az/api-en",
	headers: {
		"X-Requested-With": " XMLHttpRequest",
	},
	maxRequests: 62,
	maxPages: 2,
	maxRetries: 1,
	proxyConfiguration: APIproxyConfiguration,
};

const JobSearchscraper = new JobSearchAZScraper(ApiOptions);
await JobSearchscraper.start();
await JobSearchscraper.saveJobs();

//boss.az
const HtmlOptions: HTMLScraperOptions = {
	startUrls: ["https://en.boss.az/vacancies"],
	proxyConfiguration: HTMLproxyConfiguration,
	maxRequestsPerCrawl: 50,
	maxPages: 2,
};

const BossAZscraper = new BossAZScraper(HtmlOptions);
await BossAZscraper.start();
await BossAZscraper.saveJobs();

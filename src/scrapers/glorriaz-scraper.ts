import { APIScraper } from "../base/api-scraper.ts";
import { generateRandomId, createSlug } from "../utils/index.ts";
import type { Job } from "../db/models/jobs.ts";
import turndown from "turndown";
import crypto from "node:crypto";
import moment from "moment";
import * as cheerio from "cheerio";

export class GlorriAZScraper extends APIScraper {
	public currentPage = 1;
	protected async handleResponse(
		label: string,
		data: unknown,
		metadata: Record<string, string>,
	): Promise<void> {
		if (label === "main") {
			const response = data as GlorriMinimalResponse;
			response.entities.map((item) => {
				const url = `https://jobs.glorri.com/en/vacancies/${item.company.slug}/${item.slug}`;
				this.enqueueRequest({
					endpoint: url,
					label: "detail",
					metadata: { url },
				});
			});

			if (this.options.maxPages > 0) {
				console.log(
					`https://atsapp.glorri.az/job-service-v2/jobs/public?offset=${
						this.currentPage * 20
					}&limit=20`,
				);
				this.enqueueRequest({
					endpoint: `https://atsapp.glorri.az/job-service-v2/jobs/public?offset=${
						this.currentPage * 20
					}&limit=20`,
					label: "main",
				});
				this.currentPage++;
				this.options.maxPages--;
			}
		}
		if (label === "detail") {
			if (typeof data !== "string") {
				return;
			}
			const $ = cheerio.load(data);
			const url = metadata.url;
			console.log(`INFO: scraping ${url}`);
			const id = generateRandomId();
			const title = $("h1").first().text().trim();
			const company = $("ul.mb-2 li a").first().text().trim();

			const hash = crypto
				.createHash("sha256")
				.update(`${title}.${company}`)
				.digest("hex");
			const slug = createSlug(title);

			const categoryId =
				CategoryToId[
					$('h3:contains("Category")').siblings("span").text().trim()
				] || 18;
			const jobType =
				jobTypes[$('p:contains("Job Type")').siblings("p").text().trim()] ||
				"full-time";

			let endsAt = $('p:contains("Apply Before")').siblings("p").text().trim();
			let postedAt = $('p:contains("Job Posted On")')
				.siblings("p")
				.text()
				.trim();

			postedAt =
				moment(postedAt, "MMMM DD, YYYY").toISOString() ||
				moment().toISOString();
			endsAt = moment(endsAt, "MMMM DD, YYYY").toISOString();
			if (moment().diff(postedAt, "days") > 2) return;

			let description = $("div.grid.grid-cols-1 div.col-span-1").first().html();
			description = HtmlToMd(description || "");

			const location = $("ul.mb-2 li span").eq(0).text().trim();
			const companyLogo = $("div.relative.shrink-0 img").attr("src");

			const viewCount = $("div.flex.items-center.gap-1")
				.eq(1)
				.find("p")
				.text()
				.trim();
			const view_count = parseViewCount(viewCount);

			const salaryText = $('p:contains("Salary")').siblings("p").text().trim();
			const salary = salaryText.match(/\d+/g)?.map(Number) || null;

			const jobData: Job = {
				id,
				source_id: "",
				category_id: categoryId,
				hash,
				slug: `${slug}-${id}`,
				url,
				title,
				description: description || null,
				salary,
				view_count: view_count ? view_count : 0,
				source: "glorri-az",
				job_type: jobType,
				company_name: company,
				company_logo: `https://jobs.glorri.com/${companyLogo}`,
				location,
				posted_at: postedAt,
				ends_at: endsAt,
			};

			this.jobs.push(jobData);
		}
	}
	public async start(): Promise<void> {
		console.log("Starting GlorriAZScraper...");
		this.enqueueRequest({
			endpoint:
				"https://atsapp.glorri.az/job-service-v2/jobs/public?offset=0&limit=20",
			label: "main",
		});
		this.options.maxPages--;

		await this.queue.waitUntilAllDone();
	}
}

interface GlorriMinimalResponse {
	entities: { slug: string; company: { slug: string } }[];
}

const CategoryToId: Record<string, number> = {
	"Construction and Real Estate": 15,
	"Design, Arts, Creative": 10,
	Education: 9,
	"Finance, Business and Administration": 1,
	"Healthcare Services": 13,
	"Industry and Agriculture": 14,
	"Insurance and Leasing services": 2,
	"Legal services": 12,
	"Logistics and Transportation": 7,
	"Mass Media and Public Relations": 17,
	Other: 18,
	"Other services": 18,
	"Restaurants, Tourism and Accommodation": 8,
	"Sales and Customer Services": 3,
	"Science, Technology, Engineering": 4,
	Services: 16,
	"Social Services": 18,
};

const jobTypes: Record<string, string> = {
	"Full-time": "full-time",
	"Part-time": "part-time",
	Freelance: "freelance",
	Internship: "internship",
};

const HtmlToMd = (html: string): string => {
	const turndownService = new turndown({ bulletListMarker: "-" });

	turndownService.addRule("removeH3", {
		filter: ["h3"],
		replacement: () => "",
	});

	return turndownService.turndown(html);
};

const parseViewCount = (text: string): number => {
	let multiplier = 1;
	let value = text.trim();

	if (value.toLowerCase().endsWith("k")) {
		multiplier = 1000;
		value = value.slice(0, -1);
	}

	value = value.replace(/,/g, "");

	const num = Number.parseFloat(value);
	return Math.round(num * multiplier);
};

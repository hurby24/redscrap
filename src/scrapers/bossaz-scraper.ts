import { HTMLScraper } from "../base/html-scraper.ts";
import { generateRandomId, createSlug } from "../utils/index.ts";
import turndown from "turndown";
import type { Job } from "../db/models/jobs.ts";
import crypto from "node:crypto";
import moment from "moment";

export class BossAZScraper extends HTMLScraper {
	public currentPage = 1;

	protected handleResponse(): void {
		this.router.addDefaultHandler(async ({ enqueueLinks, log, request, $ }) => {
			if (request.label === "detail") {
				const url = request.url;
				log.info(`Scraping ${url}`);

				const id = generateRandomId();
				const title = $(".post-title").first().text().trim().toLowerCase();
				const company = $(".post-company").first().text().trim().toLowerCase();
				const hash = crypto
					.createHash("sha256")
					.update(`${title}.${company}`)
					.digest("hex");
				const slug = createSlug(title);

				let postedAt = $(".bumped_on.params-i-val").first().text().trim();
				let endsAt = $(".expires_on.params-i-val").first().text().trim();
				const companyLogo = `https://ui-avatars.com/api/?name=${company.charAt(
					0,
				)}&size=300&bold=true&background=random`;

				postedAt = moment(postedAt, "MMMM DD, YYYY").toISOString();
				if (moment().diff(postedAt, "days") > 2) return;

				endsAt = moment(endsAt, "MMMM DD, YYYY").toISOString();

				const viewAndId = $(".post-header-secondary").first().text();
				const viewCount = viewAndId.match(/Views:\s*(\d+)/);
				const Id = viewAndId.match(/Ad #\s*(\d+)/);
				const location = $(".params-i-val.region").first().text().trim();
				let description = $(".post-cols.post-info").html();
				description = HtmlToMd(description || "");

				const categoryId =
					CategoryToId[$(".breadcrumbs a").first().text().trim()] || 18;

				const salaryText = $(".post-salary.salary").first().text().trim();
				const salary = salaryText.match(/\d+/g)?.map(Number) || null;

				const jobData: Job = {
					id,
					source_id: Id ? Id[1] : "",
					category_id: categoryId,
					hash,
					slug: `${slug}-${id}`,
					url,
					title,
					description: description || null,
					company_name: company,
					company_logo: companyLogo,
					location,
					salary,
					view_count: viewCount ? Number.parseInt(viewCount[1]) : 0,
					job_type: "full-time",
					source: "boss-az",
					posted_at: postedAt,
					ends_at: endsAt,
				};

				this.jobs.push(jobData);
			} else if (request.label === "main") {
				log.info(request.url);
				await enqueueLinks({
					selector: ".results-i-link",
					globs: ["https://en.boss.az/vacancies/**"],
					label: "detail",
				});
				if (this.options.maxPages > 0) {
					this.currentPage++;
					let url = `https://en.boss.az/vacancies?page=${this.currentPage}`;
					await enqueueLinks({
						urls: [url],
						label: "main",
					});
					this.options.maxPages--;
				}
			} else {
				log.info(request.url);

				await enqueueLinks({
					selector: ".results-i-link",
					globs: ["https://en.boss.az/vacancies/**"],
					label: "detail",
				});

				if (this.options.maxPages > 0) {
					this.currentPage++;
					let url = `https://en.boss.az/vacancies?page=${this.currentPage}`;
					await enqueueLinks({
						urls: [url],
						label: "main",
					});
					this.options.maxPages--;
				}
			}
		});
	}
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

const HtmlToMd = (html: string): string => {
	const turndownService = new turndown({ bulletListMarker: "-" });
	return turndownService.turndown(html);
};

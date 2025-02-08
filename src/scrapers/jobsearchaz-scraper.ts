import { APIScraper } from "../base/api-scraper.ts";
import { generateRandomId, createSlug } from "../utils/index.ts";
import type { Job } from "../db/models/jobs.ts";
import turndown from "turndown";
import crypto from "node:crypto";
import moment from "moment";
export class JobSearchAZScraper extends APIScraper {
	protected async handleResponse(label: string, data: unknown): Promise<void> {
		if (label === "main") {
			const response = data as JobSearchMinimalResponse;
			response.items.map((item) => {
				this.enqueueRequest({
					endpoint: `/vacancies-en/${item.slug}`,
					label: "detail",
				});
			});
			if (response.next && this.options.maxPages > 0) {
				this.enqueueRequest({
					endpoint: response.next,
					label: "main",
				});
				this.options.maxPages--;
			}
		}
		if (label === "detail") {
			if (typeof data !== "object" && data === null) {
				return;
			}
			const job = data as JobSearchDetailResponse;
			console.log(
				`INFO: scraping https://www.jobsearch.az/vacancies/${job.slug}`,
			);
			const id = generateRandomId();
			const title = job.title;
			const company = job.company.title;
			const hash = crypto
				.createHash("sha256")
				.update(`${title}.${company}`)
				.digest("hex");
			const slug = createSlug(title);
			const categoryId = CategoryToId[job.category.title] || 18;
			const description = HtmlToMd(job.text || "");
			const companyLogo =
				job.company.logo ||
				job.company.logo_mini ||
				`https://ui-avatars.com/api/?name=${company.charAt(
					0,
				)}&size=300&bold=true&background=random`;
			const postedAt = moment(job.created_at).toISOString();
			if (moment().diff(postedAt, "days") > 2) {
				return;
			}

			const jobData: Job = {
				id,
				source_id: job.id.toString(),
				category_id: categoryId,
				hash,
				slug: `${slug}-${id}`,
				url: `https://www.jobsearch.az/vacancies/${job.slug}`,
				title,
				description: description,
				salary: job.salary ? [job.salary] : null,
				view_count: job.v_count,
				source: "jobsearch-az",
				job_type: "full-time",
				company_name: company,
				company_logo: companyLogo,
				location: job.company.address || null,
				posted_at: postedAt,
				ends_at: moment(job.deadline_at).toISOString(),
			};

			this.jobs.push(jobData);
		}
	}

	public async start(): Promise<void> {
		this.enqueueRequest({
			endpoint: "/vacancies-en",
			label: "main",
		});
		this.options.maxPages--;

		await this.queue.waitUntilAllDone();
	}
}

interface JobSearchMinimalResponse {
	items: { slug: string }[];
	next?: string;
}

interface JobSearchDetailResponse {
	id: number;
	title: string;
	slug: string;
	created_at: string;
	company: {
		title: string;
		logo?: string;
		logo_mini?: string;
		address?: string;
	};
	category: {
		title: string;
	};
	deadline_at: string;
	salary?: number;
	text?: string;
	v_count: number;
}

const CategoryToId: Record<string, number> = {
	"Administration, business and management": 1,
	"Financial services": 2,
	"Retail and customer services": 3,
	Engineering: 4,
	"Computing and ICT": 5,
	"Marketing and advertising, print and publishing": 6,
	"Transport, distribution and logistics": 7,
	"Hospitality, catering and tourism": 8,
	"Education and training": 9,
	"Design, arts and crafts": 10,
	"Facilities and property services": 11,
	"Legal and court services": 12,
	Healthcare: 13,
	"Manufacturing and production": 14,
	"Construction and building": 15,
	"Security, uniformed and protective services": 16,
	"Performing arts and media": 17,
};

const HtmlToMd = (html: string): string => {
	const cleanedHtml = html.replace(/[\n\t]+/g, " ").trim();

	const turndownService = new turndown({ bulletListMarker: "-" });
	return turndownService.turndown(cleanedHtml);
};

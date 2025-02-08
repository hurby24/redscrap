import { HTMLScraper } from "../base/html-scraper.ts";
import { generateRandomId, createSlug } from "../utils/index.ts";
import turndown from "turndown";
import type { Job } from "../db/models/jobs.ts";
import crypto from "node:crypto";
import moment from "moment";

export class HelloJobAZScraper extends HTMLScraper {
	public currentPage = 1;
	protected handleResponse(): void {
		this.router.addDefaultHandler(async ({ enqueueLinks, log, request, $ }) => {
			if (request.label === "detail") {
				const url = request.url;
				log.info(`Scraping ${url}`);

				const id = generateRandomId();
				const title = $(".resume__header__name").first().text().trim();
				const company = $(".resume__header__speciality a")
					.first()
					.text()
					.trim();
				const hash = crypto
					.createHash("sha256")
					.update(`${title}.${company}`)
					.digest("hex");
				const slug = createSlug(title);

				let postedAt = $(".resume__item__text:contains('Elan tarixi') h4")
					.first()
					.text()
					.trim();
				let endsAt = $(".resume__item__text:contains('Bitmə tarixi') h4")
					.first()
					.text()
					.trim();
				const imageSrc = $(".resume__header__img img").attr("src");
				const companyLogo = imageSrc
					? imageSrc
					: `https://ui-avatars.com/api/?name=${company.charAt(
							0,
						)}&size=300&bold=true&background=random`;

				postedAt = moment(postedAt, "DD MMMM YYYY", "az").toISOString();
				if (moment().diff(postedAt, "days") > 2) return;

				endsAt = moment(endsAt, "DD MMMM YYYY", "az").toISOString();

				const viewCount = $(".resume__item__text p:contains('Baxılıb')")
					.first()
					.prev("h4")
					.text()
					.trim();
				const Id = $(".contact__top h4").first().text().match(/\d+/);
				const location = $(".resume__item__text p:contains('Şəhər')")
					.prev("h4")
					.text()
					.trim();
				let description = $(".resume__block h3.resume__title")
					.eq(1)
					.closest(".resume__block")
					.html();
				description = HtmlToMd(description || "");

				const jobType =
					jobTypes[
						$(".resume__item__text p:contains('İş rejimi')")
							.prev("h4")
							.text()
							.trim()
					] || "full-time";

				const categoryId =
					CategoryToId[
						$(".resume__item__text p:contains('Sahə')").prev("h4").text().trim()
					] || 18;

				const salaryText = $(".resume__item__text p:contains('Əmək haqqı AZN')")
					.prev("h4")
					.text()
					.trim();
				const salary = salaryText.match(/\d+/g)?.map(Number) || null;

				const jobData: Job = {
					id,
					source_id: Id ? Id[0] : "",
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
					view_count: Number.parseInt(viewCount),
					job_type: jobType,
					source: "hellojob-az",
					posted_at: postedAt,
					ends_at: endsAt,
				};

				this.jobs.push(jobData);
			} else if (request.label === "main") {
				log.info(request.url);
				await enqueueLinks({
					selector: ".vacancies__item",
					globs: ["https://www.hellojob.az/vakansiya/**"],
					label: "detail",
				});
				if (this.options.maxPages > 0) {
					this.currentPage++;
					const url = `https://www.hellojob.az/vakansiyalar?page=${this.currentPage}`;
					await enqueueLinks({
						urls: [url],
						label: "main",
					});
					this.options.maxPages--;
				}
			} else {
				log.info(request.url);

				await enqueueLinks({
					selector: ".vacancies__item",
					globs: ["https://www.hellojob.az/vakansiya/**"],
					label: "detail",
				});

				if (this.options.maxPages > 0) {
					this.currentPage++;
					const url = `https://www.hellojob.az/vakansiyalar?page=${this.currentPage}`;
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
	Maliyyə: 2,
	Marketinq: 6,
	Texnologiya: 5,
	"Restoran işi": 8,
	Satış: 3,
	Xidmət: 7,
	Dizayn: 10,
	Müxtəlif: 18,
	Səhiyyə: 13,
	"Təhsil və elm": 9,
	"Sənaye və k/t": 14,
	Hüquq: 12,
	İnzibati: 1,
};

const jobTypes: Record<string, string> = {
	"Tam-ştat": "full-time",
	"Part-time": "part-time",
	Freelance: "freelance",
	Təcrübəçi: "internship",
	Uzaqdan: "remote",
};

const HtmlToMd = (html: string): string => {
	const turndownService = new turndown({ bulletListMarker: "-" });
	turndownService.addRule("removeJobInfoHeading", {
		filter: (node) => {
			return (
				node.nodeName === "H3" &&
				node.classList.contains("resume__title") &&
				node.textContent?.trim() === "İş barədə məlumat"
			);
		},
		replacement: () => "",
	});

	turndownService.addRule("removeHr", {
		filter: "hr",
		replacement: () => "",
	});

	turndownService.addRule("removeTelegramLink", {
		filter: (node) => {
			return (
				node.nodeName === "P" &&
				node.innerHTML.includes('href="https://bit.ly/hjtopbanner1"')
			);
		},
		replacement: () => "",
	});

	return turndownService.turndown(html);
};

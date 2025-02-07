export interface Job {
	id: string;
	source_id: string;
	category_id: number;
	hash: string;
	slug: string;
	url: string;
	title: string;
	description: string | null;
	salary: number[] | null;
	view_count: number;
	source: string;
	job_type: string | null;
	company_name: string | null;
	company_logo: string | null;
	location: string | null;
	posted_at: string;
	ends_at: string | null;
}

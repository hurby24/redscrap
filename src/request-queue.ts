export interface QueuedRequest {
	endpoint: string;
	params: Record<string, unknown>;
	label: string;
	retries?: number;
	metadata?: Record<string, unknown>;
}

export class RequestQueue {
	private queue: QueuedRequest[] = [];
	private activeRequests = 0;

	constructor(
		private maxRequests: number,
		private processFn: (request: QueuedRequest) => Promise<void>,
	) {}

	public enqueue(request: QueuedRequest): void {
		this.queue.push(request);
		this.processQueue();
	}

	private async processQueue(): Promise<void> {
		while (this.queue.length > 0 && this.activeRequests < this.maxRequests) {
			const request = this.queue.shift();
			if (request) {
				this.activeRequests++;
				this.processFn(request)
					.catch((error) => {
						console.error(
							`Error processing request (${request.label}):`,
							error,
						);
						if (request.retries && request.retries > 0) {
							console.warn(
								`Retrying request (${request.label}). Retries left: ${request.retries}`,
							);
							request.retries--;
							this.enqueue(request);
						}
					})
					.finally(() => {
						this.activeRequests--;
						this.processQueue();
					});
			}
		}
	}
}

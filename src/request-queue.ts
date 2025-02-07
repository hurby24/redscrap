export interface QueuedRequest {
	endpoint: string;
	label: string;
	params?: Record<string, unknown>;
	retries?: number;
	metadata?: Record<string, unknown>;
}

export class RequestQueue {
	private queue: QueuedRequest[] = [];
	private totalRequests = 0;
	private successfulRequests = 0;
	private failedRequests = 0;

	constructor(
		private maxRequests: number,
		private processFn: (request: QueuedRequest) => Promise<void>,
	) {}

	public enqueue(request: QueuedRequest): void {
		if (this.totalRequests >= this.maxRequests) {
			return;
		}
		this.queue.push(request);
		this.totalRequests++;
		this.processQueue();
	}

	private async processQueue(): Promise<void> {
		while (this.queue.length > 0 && this.totalRequests <= this.maxRequests) {
			const request = this.queue.shift();
			if (request) {
				this.processFn(request)
					.then(() => {
						this.successfulRequests++;
					})
					.catch((error) => {
						this.failedRequests++;
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
						this.processQueue();
					});
			}
		}
	}

	public waitUntilAllDone(): Promise<void> {
		return new Promise((resolve) => {
			const checkFinished = () => {
				if (
					this.queue.length === 0 &&
					this.successfulRequests + this.failedRequests >= this.totalRequests
				) {
					resolve();
				} else {
					setTimeout(checkFinished, 100);
				}
			};
			checkFinished();
		});
	}
}

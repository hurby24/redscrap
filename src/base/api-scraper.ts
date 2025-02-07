import axios, {
  type AxiosInstance,
  type AxiosProxyConfig,
  isAxiosError,
} from "axios";

import { RequestQueue, type QueuedRequest } from "../request-queue.ts";
import sql from "../db/db.ts";
import type { Job } from "../db/models/jobs.ts";

export abstract class APIScraper {
  protected readonly client: AxiosInstance;
  protected jobs: Job[] = [];
  protected readonly options: APIScraperOptions;
  protected readonly queue: RequestQueue;

  constructor(options: APIScraperOptions) {
    this.options = options;
    this.client = axios.create({
      baseURL: options.baseUrl,
      headers: options.headers,
      timeout: options.timeout ?? 10000,
    });

    this.queue = new RequestQueue(
      options.maxRequests,
      async (request: QueuedRequest) => {
        const data = await this.get(request.endpoint, request.params);
        await this.handleResponse(request.label, data, request.metadata);
      }
    );
  }

  private getRandomProxy(): AxiosProxyConfig | undefined {
    const { proxyConfiguration } = this.options;
    return proxyConfiguration.length > 0
      ? proxyConfiguration[
          Math.floor(Math.random() * proxyConfiguration.length)
        ]
      : undefined;
  }

  protected async saveJobs(jobs: Job[]): Promise<void> {
    if (jobs.length === 0) return;
    console.log(jobs[0]);
  }

  protected async get(
    endpoint: string,
    params: Record<string, unknown> = {}
  ): Promise<unknown> {
    try {
      const response = await this.client.get(endpoint, {
        params,
        proxy: this.getRandomProxy(),
      });
      return response.data;
    } catch (error: unknown) {
      let errorMessage = "An unknown error occurred.";
      if (isAxiosError(error)) {
        errorMessage = `Axios error: ${
          error.response?.status ?? "Unknown status"
        } - ${error.message}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error fetching data from ${endpoint}:`, errorMessage);
      throw new Error(`Failed to fetch data from ${endpoint}: ${errorMessage}`);
    }
  }

  protected enqueueRequest(request: QueuedRequest): void {
    this.queue.enqueue(request);
  }

  protected abstract handleResponse(
    label: string,
    data: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void>;

  public abstract start(): Promise<void>;
}

export interface APIScraperOptions {
  baseUrl: string;
  proxyConfiguration: AxiosProxyConfig[];
  maxPages: number;
  maxRequests: number;
  maxRetries?: number;
  headers?: Record<string, string>;
  timeout?: number;
}

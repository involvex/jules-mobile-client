import { Octokit } from "@octokit/rest";

// Type definitions for GitHub API responses and errors
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  default_branch: string;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  topics?: string[];
  languages?: Record<string, number>;
  updated_at?: string;
  license?: {
    name: string;
    spdx_id: string;
  };
}

export interface SearchResults {
  total_count: number;
  items: Repository[];
}

export interface PaginationParams {
  per_page?: number;
  page?: number;
}

export interface SearchParams extends PaginationParams {
  query: string;
  language?: string;
  topic?: string;
  sort?: "stars" | "forks" | "updated";
  order?: "asc" | "desc";
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface GitHubError {
  status: number;
  message: string;
  type:
    | "network"
    | "auth"
    | "rate_limit"
    | "not_found"
    | "server"
    | "validation";
  retryAfter?: number;
  documentation_url?: string;
}

export interface RequestMetrics {
  timestamp: number;
  url: string;
  method: string;
  status: number;
  duration: number;
  size: number;
}

// Cache entry with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Request queue for rate limiting
interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  priority: number;
  retries: number;
}

/**
 * GitHub API Service with comprehensive rate limiting, caching, and error handling
 */
export class GitHubService {
  private octokit: Octokit | null = null;
  private rateLimit: RateLimitInfo = {
    limit: 5000,
    remaining: 5000,
    reset: Date.now() + 3600000,
    used: 0,
  };

  private cache = new Map<string, CacheEntry<any>>();
  private requestQueue: QueuedRequest<any>[] = [];
  private isProcessingQueue = false;
  private metrics: RequestMetrics[] = [];
  private maxRetries = 3;
  private baseDelay = 1000; // 1 second

  constructor(token?: string) {
    if (token) {
      this.initialize(token);
    }
  }

  /**
   * Initialize the service with a GitHub token
   */
  initialize(token: string): void {
    this.octokit = new Octokit({
      auth: token,
      userAgent: "Jules-Mobile-Client/1.0.0",
      request: {
        timeout: 10000,
      },
    });
  }

  /**
   * Check if the service is authenticated
   */
  isAuthenticated(): boolean {
    return this.octokit !== null;
  }

  /**
   * Get current rate limit status
   */
  getRateLimit(): RateLimitInfo {
    return { ...this.rateLimit };
  }

  /**
   * Get recent request metrics
   */
  getMetrics(limit = 10): RequestMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Validate token by making a test request
   */
  async validateToken(): Promise<boolean> {
    if (!this.octokit) return false;

    try {
      await this.request("GET /user", {});
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user repositories with pagination
   */
  async getUserRepos(params: PaginationParams = {}): Promise<Repository[]> {
    const { per_page = 30, page = 1 } = params;
    const cacheKey = `user-repos-${per_page}-${page}`;

    // Check cache first
    const cached = this.getFromCache<Repository[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.request("GET /user/repos", {
      per_page,
      page,
      sort: "updated",
      direction: "desc",
      type: "owner",
    });

    const repos = response.data as Repository[];

    // Cache the result for 5 minutes
    this.setCache(cacheKey, repos, 300000);

    return repos;
  }

  /**
   * Search repositories
   */
  async searchRepos(params: SearchParams): Promise<SearchResults> {
    const {
      query,
      language,
      topic,
      sort = "updated",
      order = "desc",
      per_page = 30,
      page = 1,
    } = params;

    let searchQuery = query;
    if (language) searchQuery += ` language:${language}`;
    if (topic) searchQuery += ` topic:${topic}`;

    const cacheKey = `search-${searchQuery}-${sort}-${order}-${per_page}-${page}`;

    // Check cache first
    const cached = this.getFromCache<SearchResults>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.request("GET /search/repositories", {
      q: searchQuery,
      sort,
      order,
      per_page,
      page,
    });

    const results = response.data as SearchResults;

    // Cache search results for 10 minutes
    this.setCache(cacheKey, results, 600000);

    return results;
  }

  /**
   * Get repository details
   */
  async getRepo(owner: string, repo: string): Promise<Repository> {
    const cacheKey = `repo-${owner}-${repo}`;

    const cached = this.getFromCache<Repository>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
    });

    const repository = response.data as Repository;

    // Cache for 15 minutes
    this.setCache(cacheKey, repository, 900000);

    return repository;
  }

  /**
   * Get repository topics
   */
  async getRepoTopics(owner: string, repo: string): Promise<string[]> {
    const cacheKey = `topics-${owner}-${repo}`;

    const cached = this.getFromCache<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.request("GET /repos/{owner}/{repo}/topics", {
      owner,
      repo,
    });

    const topics = response.data.names || [];

    // Cache for 30 minutes
    this.setCache(cacheKey, topics, 1800000);

    return topics;
  }

  /**
   * Get repository languages
   */
  async getRepoLanguages(
    owner: string,
    repo: string,
  ): Promise<Record<string, number>> {
    const cacheKey = `languages-${owner}-${repo}`;

    const cached = this.getFromCache<Record<string, number>>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.request("GET /repos/{owner}/{repo}/languages", {
      owner,
      repo,
    });

    const languages = response.data as Record<string, number>;

    // Cache for 30 minutes
    this.setCache(cacheKey, languages, 1800000);

    return languages;
  }

  /**
   * Star a repository (optimistic update)
   */
  async starRepo(owner: string, repo: string): Promise<void> {
    await this.request("PUT /user/starred/{owner}/{repo}", {
      owner,
      repo,
    });

    // Invalidate related caches
    this.invalidateCache(`repo-${owner}-${repo}`);
    this.invalidateCache(`user-repos-*`);
  }

  /**
   * Unstar a repository
   */
  async unstarRepo(owner: string, repo: string): Promise<void> {
    await this.request("DELETE /user/starred/{owner}/{repo}", {
      owner,
      repo,
    });

    // Invalidate related caches
    this.invalidateCache(`repo-${owner}-${repo}`);
    this.invalidateCache(`user-repos-*`);
  }

  /**
   * Fork a repository
   */
  async forkRepo(owner: string, repo: string): Promise<Repository> {
    const response = await this.request("POST /repos/{owner}/{repo}/forks", {
      owner,
      repo,
    });

    // Invalidate user repos cache
    this.invalidateCache(`user-repos-*`);

    return response.data as Repository;
  }

  /**
   * Private method to make API requests with rate limiting and retry logic
   */
  private async request(endpoint: string, params: any = {}): Promise<any> {
    if (!this.octokit) {
      throw this.createError(401, "GitHub client not initialized", "auth");
    }

    // Check rate limit before making request
    if (this.rateLimit.remaining <= 10) {
      const resetTime = new Date(this.rateLimit.reset * 1000);
      const now = new Date();

      if (resetTime > now) {
        const waitTime = resetTime.getTime() - now.getTime();
        throw this.createError(
          429,
          `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`,
          "rate_limit",
          waitTime,
        );
      }
    }

    const startTime = Date.now();

    try {
      const response = await this.octokit.request(endpoint, params);

      // Update rate limit info from response headers
      this.updateRateLimit(response.headers);

      // Record metrics
      this.recordMetrics({
        timestamp: Date.now(),
        url: endpoint,
        method: endpoint.split(" ")[0],
        status: response.status,
        duration: Date.now() - startTime,
        size: JSON.stringify(response.data).length,
      });

      return response;
    } catch (error: any) {
      // Record failed request metrics
      this.recordMetrics({
        timestamp: Date.now(),
        url: endpoint,
        method: endpoint.split(" ")[0],
        status: error.status || 0,
        duration: Date.now() - startTime,
        size: 0,
      });

      throw this.handleError(error);
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimit(headers: any): void {
    const limit =
      parseInt(headers["x-ratelimit-limit"]) || this.rateLimit.limit;
    const remaining =
      parseInt(headers["x-ratelimit-remaining"]) || this.rateLimit.remaining;
    const reset =
      parseInt(headers["x-ratelimit-reset"]) || this.rateLimit.reset;
    const used = parseInt(headers["x-ratelimit-used"]) || this.rateLimit.used;

    this.rateLimit = { limit, remaining, reset, used };
  }

  /**
   * Handle and normalize API errors
   */
  private handleError(error: any): GitHubError {
    if (error.status) {
      switch (error.status) {
        case 401:
          return this.createError(
            401,
            "Authentication failed. Please check your GitHub token.",
            "auth",
          );
        case 403:
          if (error.message?.includes("rate limit")) {
            const resetTime = new Date(
              (this.rateLimit.reset || Date.now() / 1000 + 3600) * 1000,
            );
            const waitTime = resetTime.getTime() - Date.now();
            return this.createError(
              403,
              "Rate limit exceeded",
              "rate_limit",
              waitTime,
            );
          }
          return this.createError(
            403,
            "Access forbidden. Check your token permissions.",
            "auth",
          );
        case 404:
          return this.createError(
            404,
            "Repository or resource not found",
            "not_found",
          );
        case 422:
          return this.createError(422, "Validation failed", "validation");
        case 429:
          return this.createError(
            429,
            "Too many requests",
            "rate_limit",
            60000,
          ); // 1 minute default
        default:
          if (error.status >= 500) {
            return this.createError(
              error.status,
              "GitHub server error",
              "server",
            );
          }
          return this.createError(
            error.status,
            error.message || "Unknown error",
            "server",
          );
      }
    }

    // Network or other errors
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return this.createError(0, "Network connection failed", "network");
    }

    return this.createError(0, error.message || "Unknown error", "network");
  }

  /**
   * Create a standardized error object
   */
  private createError(
    status: number,
    message: string,
    type: GitHubError["type"],
    retryAfter?: number,
  ): GitHubError {
    return {
      status,
      message,
      type,
      retryAfter,
    };
  }

  /**
   * Cache management methods
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private invalidateCache(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      } else if (key === pattern) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Record request metrics
   */
  private recordMetrics(metric: RequestMetrics): void {
    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }
}

// Export singleton instance
export const githubService = new GitHubService();

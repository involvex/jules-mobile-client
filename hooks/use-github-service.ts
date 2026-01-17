import {
  GitHubService,
  githubService,
  Repository,
  SearchResults,
  SearchParams,
  PaginationParams,
  GitHubError,
  RequestMetrics,
  RateLimitInfo,
  GitHubUser,
} from "../services/github";

import { useCallback, useEffect, useState } from "react";
import { useApiKey } from "@/constants/api-key-context";

export type {
  Repository,
  SearchResults,
  SearchParams,
  PaginationParams,
  GitHubError,
  RequestMetrics,
  RateLimitInfo,
  GitHubUser,
};

export interface UseGitHubServiceReturn {
  // Service instance
  service: GitHubService;

  // Authentication
  isAuthenticated: boolean;
  isLoading: boolean;

  // Rate limiting
  rateLimit: RateLimitInfo;

  // Metrics
  metrics: RequestMetrics[];

  // API Methods
  getUserRepos: (params?: PaginationParams) => Promise<Repository[]>;
  searchRepos: (params: SearchParams) => Promise<SearchResults>;
  getRepo: (owner: string, repo: string) => Promise<Repository>;
  getRepoTopics: (owner: string, repo: string) => Promise<string[]>;
  getRepoLanguages: (
    owner: string,
    repo: string,
  ) => Promise<Record<string, number>>;
  starRepo: (owner: string, repo: string) => Promise<void>;
  unstarRepo: (owner: string, repo: string) => Promise<void>;
  forkRepo: (owner: string, repo: string) => Promise<Repository>;
  validateToken: () => Promise<boolean>;
  refreshRepos: () => Promise<Repository[]>;

  // Cache management
  clearCache: () => void;

  // Error handling
  lastError: GitHubError | null;

  // User data
  user: GitHubUser | null;
}

/**
 * Enhanced GitHub service hook with comprehensive state management
 */
export function useGitHubService(): UseGitHubServiceReturn {
  const { GITHUB_TOKEN } = useApiKey();
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<GitHubError | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);

  // Error handling wrapper - Move to top to avoid hoisting issues
  const handleRequest = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      setLastError(null);

      try {
        const result = await operation();
        return result;
      } catch (error: any) {
        const githubError = error as GitHubError;
        setLastError(githubError);
        // If we get an auth error, mark token as invalid
        if (githubError.status === 401 || githubError.type === "auth") {
          setIsTokenValid(false);
        }
        throw githubError;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const validateToken = useCallback(async () => {
    try {
      const isValid = await handleRequest(() => githubService.validateToken());
      if (isValid) {
        const userData = await githubService.getCurrentUser();
        setUser(userData);
        setIsTokenValid(true);
      }
      return isValid;
    } catch (error) {
      setIsTokenValid(false);
      setUser(null);
      return false;
    }
  }, [handleRequest]);

  // Initialize service when token changes
  useEffect(() => {
    const validate = async () => {
      if (GITHUB_TOKEN) {
        githubService.initialize(GITHUB_TOKEN);
        try {
          const isValid = await githubService.validateToken();
          if (isValid) {
            setIsTokenValid(true);
            const userData = await githubService.getCurrentUser();
            setUser(userData);
          } else {
            setIsTokenValid(false);
            setUser(null);
          }
        } catch (error) {
          setIsTokenValid(false);
          setUser(null);
        }
      } else {
        setIsTokenValid(false);
        setUser(null);
      }
    };
    validate();
  }, [GITHUB_TOKEN]);

  // API method wrappers with error handling
  const getUserRepos = useCallback(
    (params?: PaginationParams) =>
      handleRequest(() => githubService.getUserRepos(params)),
    [handleRequest],
  );

  const searchRepos = useCallback(
    (params: SearchParams) =>
      handleRequest(() => githubService.searchRepos(params)),
    [handleRequest],
  );

  const getRepo = useCallback(
    (owner: string, repo: string) =>
      handleRequest(() => githubService.getRepo(owner, repo)),
    [handleRequest],
  );

  const getRepoTopics = useCallback(
    (owner: string, repo: string) =>
      handleRequest(() => githubService.getRepoTopics(owner, repo)),
    [handleRequest],
  );

  const getRepoLanguages = useCallback(
    (owner: string, repo: string) =>
      handleRequest(() => githubService.getRepoLanguages(owner, repo)),
    [handleRequest],
  );

  const starRepo = useCallback(
    (owner: string, repo: string) =>
      handleRequest(() => githubService.starRepo(owner, repo)),
    [handleRequest],
  );

  const unstarRepo = useCallback(
    (owner: string, repo: string) =>
      handleRequest(() => githubService.unstarRepo(owner, repo)),
    [handleRequest],
  );

  const forkRepo = useCallback(
    (owner: string, repo: string) =>
      handleRequest(() => githubService.forkRepo(owner, repo)),
    [handleRequest],
  );

  const refreshRepos = useCallback(
    () => handleRequest(() => githubService.getUserRepos()),
    [handleRequest],
  );

  const clearCache = useCallback(() => {
    githubService.clearCache();
  }, []);

  return {
    service: githubService,
    isAuthenticated: !!GITHUB_TOKEN && isTokenValid === true,
    isLoading,
    rateLimit: githubService.getRateLimit(),
    metrics: githubService.getMetrics(),
    getUserRepos,
    searchRepos,
    getRepo,
    getRepoTopics,
    getRepoLanguages,
    starRepo,
    unstarRepo,
    forkRepo,
    validateToken,
    refreshRepos,
    clearCache,
    lastError,
    user,
  };
}

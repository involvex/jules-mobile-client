import {
  useGitHubService,
  Repository,
  SearchParams,
} from "./use-github-service";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRepositorySync } from "./use-repository-sync";

export interface RepositoryFilters {
  searchQuery: string;
  language: string | null;
  topic: string | null;
  sortBy: "updated" | "stars" | "name";
  sortOrder: "asc" | "desc";
}

export interface RepositoryManagerState {
  repositories: Repository[];
  filteredRepositories: Repository[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;
  filters: RepositoryFilters;
}

export interface UseRepositoryManagerReturn extends RepositoryManagerState {
  // Actions
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  search: (query: string) => void;
  setLanguageFilter: (language: string | null) => void;
  setTopicFilter: (topic: string | null) => void;
  setSortBy: (sortBy: RepositoryFilters["sortBy"]) => void;
  setSortOrder: (sortOrder: RepositoryFilters["sortOrder"]) => void;
  clearFilters: () => void;

  // Repository actions
  starRepository: (repository: Repository) => Promise<void>;
  unstarRepository: (repository: Repository) => Promise<void>;
  forkRepository: (repository: Repository) => Promise<void>;

  // Enhanced data
  getRepositoryWithDetails: (repository: Repository) => Promise<Repository>;
}

/**
 * Enhanced repository manager hook with pagination, search, and filtering
 */
export function useRepositoryManager(): UseRepositoryManagerReturn {
  const {
    getUserRepos,
    searchRepos,
    getRepoTopics,
    getRepoLanguages,
    starRepo,
    unstarRepo,
    forkRepo,
  } = useGitHubService();
  const { syncStatus, cache, syncRepositories } = useRepositorySync();

  const [state, setState] = useState<RepositoryManagerState>({
    repositories: [],
    filteredRepositories: [],
    isLoading: false,
    isRefreshing: false,
    isLoadingMore: false,
    hasMore: true,
    page: 1,
    error: null,
    filters: {
      searchQuery: "",
      language: null,
      topic: null,
      sortBy: "updated",
      sortOrder: "desc",
    },
  });

  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(state.filters.searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [state.filters.searchQuery]);

  // Load initial repositories
  const loadInitialRepositories = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let repos: Repository[] = [];

      if (cache?.repositories?.length) {
        repos = cache.repositories;
      } else {
        repos = await getUserRepos({ per_page: 30, page: 1 });
      }

      setState(prev => ({
        ...prev,
        repositories: repos,
        page: 1,
        hasMore: repos.length === 30,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || "Failed to load repositories",
        isLoading: false,
      }));
    }
  }, [cache, getUserRepos]);

  // Load more repositories
  const loadMore = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMore) return;

    setState(prev => ({ ...prev, isLoadingMore: true }));

    try {
      const nextPage = state.page + 1;
      const newRepos = await getUserRepos({ per_page: 30, page: nextPage });

      setState(prev => ({
        ...prev,
        repositories: [...prev.repositories, ...newRepos],
        page: nextPage,
        hasMore: newRepos.length === 30,
        isLoadingMore: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || "Failed to load more repositories",
        isLoadingMore: false,
      }));
    }
  }, [state.isLoadingMore, state.hasMore, state.page, getUserRepos]);

  // Refresh repositories
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true, error: null }));

    try {
      await syncRepositories();
      await loadInitialRepositories();
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || "Failed to refresh repositories",
      }));
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [syncRepositories, loadInitialRepositories]);

  // Search repositories
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setState(prev => ({
          ...prev,
          filteredRepositories: prev.repositories,
        }));
        return;
      }

      setState(prev => ({ ...prev, isLoading: true }));

      try {
        const searchParams: SearchParams = {
          query,
          per_page: 100,
          page: 1,
          sort: "updated",
          order: "desc",
        };

        const results = await searchRepos(searchParams);

        setState(prev => ({
          ...prev,
          filteredRepositories: results.items,
          isLoading: false,
        }));
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || "Search failed",
          isLoading: false,
        }));
      }
    },
    [searchRepos],
  );

  // Filter and sort repositories
  const filteredRepositories = useMemo(() => {
    let repos = debouncedSearchQuery
      ? state.filteredRepositories
      : state.repositories;

    // Apply filters
    if (state.filters.language) {
      repos = repos.filter(
        repo =>
          repo.language === state.filters.language ||
          Object.keys(repo.languages || {}).includes(state.filters.language!),
      );
    }

    if (state.filters.topic) {
      repos = repos.filter(repo =>
        (repo.topics || []).includes(state.filters.topic!),
      );
    }

    // Apply sorting
    repos = [...repos].sort((a, b) => {
      let comparison = 0;

      switch (state.filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "stars":
          comparison = b.stargazers_count - a.stargazers_count;
          break;
        case "updated":
        default:
          const aDate = new Date(a.updated_at || 0);
          const bDate = new Date(b.updated_at || 0);
          comparison = bDate.getTime() - aDate.getTime();
          break;
      }

      return state.filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return repos;
  }, [
    state.repositories,
    state.filteredRepositories,
    debouncedSearchQuery,
    state.filters,
  ]);

  // Update filtered repositories when they change
  useEffect(() => {
    setState(prev => ({ ...prev, filteredRepositories: filteredRepositories }));
  }, [filteredRepositories]);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      performSearch(debouncedSearchQuery);
    } else {
      setState(prev => ({ ...prev, filteredRepositories: prev.repositories }));
    }
  }, [debouncedSearchQuery, performSearch]);

  // Load initial data
  useEffect(() => {
    loadInitialRepositories();
  }, [loadInitialRepositories]);

  // Filter actions
  const search = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, searchQuery: query },
    }));
  }, []);

  const setLanguageFilter = useCallback((language: string | null) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, language },
    }));
  }, []);

  const setTopicFilter = useCallback((topic: string | null) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, topic },
    }));
  }, []);

  const setSortBy = useCallback((sortBy: RepositoryFilters["sortBy"]) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, sortBy },
    }));
  }, []);

  const setSortOrder = useCallback(
    (sortOrder: RepositoryFilters["sortOrder"]) => {
      setState(prev => ({
        ...prev,
        filters: { ...prev.filters, sortOrder },
      }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {
        searchQuery: "",
        language: null,
        topic: null,
        sortBy: "updated",
        sortOrder: "desc",
      },
    }));
  }, []);

  // Repository actions with optimistic updates
  const starRepository = useCallback(
    async (repo: Repository) => {
      // Optimistic update
      setState(prev => ({
        ...prev,
        repositories: prev.repositories.map(r =>
          r.id === repo.id
            ? { ...r, stargazers_count: r.stargazers_count + 1 }
            : r,
        ),
      }));

      try {
        await starRepo(repo.owner.login, repo.name);
      } catch (error) {
        // Revert optimistic update
        setState(prev => ({
          ...prev,
          repositories: prev.repositories.map(r =>
            r.id === repo.id
              ? { ...r, stargazers_count: r.stargazers_count - 1 }
              : r,
          ),
        }));
        throw error;
      }
    },
    [starRepo],
  );

  const unstarRepository = useCallback(
    async (repo: Repository) => {
      // Optimistic update
      setState(prev => ({
        ...prev,
        repositories: prev.repositories.map(r =>
          r.id === repo.id
            ? { ...r, stargazers_count: Math.max(0, r.stargazers_count - 1) }
            : r,
        ),
      }));

      try {
        await unstarRepo(repo.owner.login, repo.name);
      } catch (error) {
        // Revert optimistic update
        setState(prev => ({
          ...prev,
          repositories: prev.repositories.map(r =>
            r.id === repo.id
              ? { ...r, stargazers_count: r.stargazers_count + 1 }
              : r,
          ),
        }));
        throw error;
      }
    },
    [unstarRepo],
  );

  const forkRepository = useCallback(
    async (repo: Repository) => {
      // Optimistic update
      setState(prev => ({
        ...prev,
        repositories: prev.repositories.map(r =>
          r.id === repo.id ? { ...r, forks_count: r.forks_count + 1 } : r,
        ),
      }));

      try {
        await forkRepo(repo.owner.login, repo.name);
      } catch (error) {
        // Revert optimistic update
        setState(prev => ({
          ...prev,
          repositories: prev.repositories.map(r =>
            r.id === repo.id ? { ...r, forks_count: r.forks_count - 1 } : r,
          ),
        }));
        throw error;
      }
    },
    [forkRepo],
  );

  // Get repository with enhanced details
  const getRepositoryWithDetails = useCallback(
    async (repo: Repository): Promise<Repository> => {
      try {
        const [topics, languages] = await Promise.all([
          getRepoTopics(repo.owner.login, repo.name),
          getRepoLanguages(repo.owner.login, repo.name),
        ]);

        return {
          ...repo,
          topics,
          languages,
        };
      } catch (error) {
        // Return repo without additional details if loading fails
        return repo;
      }
    },
    [getRepoTopics, getRepoLanguages],
  );

  return {
    ...state,
    filteredRepositories,
    refresh,
    loadMore,
    search,
    setLanguageFilter,
    setTopicFilter,
    setSortBy,
    setSortOrder,
    clearFilters,
    starRepository,
    unstarRepository,
    forkRepository,
    getRepositoryWithDetails,
  };
}

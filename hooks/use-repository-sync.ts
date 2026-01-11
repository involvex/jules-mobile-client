import { useCallback, useEffect, useRef, useState } from "react";
import { useGithubApi, Repository } from "./use-github-api";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

export interface RepositorySyncStatus {
  isSyncing: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  error: string | null;
  progress: number;
}

export interface RepositoryCache {
  repositories: Repository[];
  lastUpdated: Date;
  etag?: string;
}

export function useRepositorySync() {
  const { getUserRepos, getRepoDetails, isAuthenticated, isLoading } =
    useGithubApi();
  const [syncStatus, setSyncStatus] = useState<RepositorySyncStatus>({
    isSyncing: false,
    lastSync: null,
    nextSync: null,
    error: null,
    progress: 0,
  });
  const [cache, setCache] = useState<RepositoryCache | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  // Cache management
  const CACHE_KEY = "github_repositories_cache";
  const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const loadCache = useCallback(async (): Promise<RepositoryCache | null> => {
    try {
      const cachedData = await SecureStore.getItemAsync(CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return {
          ...parsed,
          lastUpdated: new Date(parsed.lastUpdated),
        };
      }
    } catch (error) {
      console.error("Failed to load cache:", error);
    }
    return null;
  }, []);

  const saveCache = useCallback(
    async (data: RepositoryCache): Promise<void> => {
      try {
        await SecureStore.setItemAsync(CACHE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save cache:", error);
      }
    },
    [],
  );

  // Background sync
  const startBackgroundSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(async () => {
      if (!isAuthenticated || isSyncingRef.current) {
        return;
      }
      await syncRepositories(false);
    }, SYNC_INTERVAL);

    // Calculate next sync time
    const nextSync = new Date(Date.now() + SYNC_INTERVAL);
    setSyncStatus(prev => ({ ...prev, nextSync }));
  }, [isAuthenticated]);

  const stopBackgroundSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // Conflict resolution
  const resolveConflicts = useCallback(
    async (
      localRepos: Repository[],
      remoteRepos: Repository[],
    ): Promise<Repository[]> => {
      const localMap = new Map(
        localRepos.map(repo => [repo.id, { ...repo, source: "local" }]),
      );
      const remoteMap = new Map(
        remoteRepos.map(repo => [repo.id, { ...repo, source: "remote" }]),
      );

      const merged: Repository[] = [];

      // Process all repositories
      for (const [id, remoteRepo] of remoteMap.entries()) {
        const localRepo = localMap.get(id);

        if (localRepo) {
          // Conflict: both local and remote have the repository
          // Use the more recently updated one
          const localDate = new Date(localRepo.updated_at);
          const remoteDate = new Date(remoteRepo.updated_at);

          if (remoteDate > localDate) {
            merged.push(remoteRepo);
          } else {
            merged.push(localRepo);
          }
        } else {
          // Only exists in remote
          merged.push(remoteRepo);
        }
      }

      // Add repositories that only exist locally (user might have removed access)
      for (const [id, localRepo] of localMap.entries()) {
        if (!remoteMap.has(id)) {
          // Check if this was a legitimate removal by trying to fetch the repo
          try {
            await getRepoDetails(localRepo.owner.login, localRepo.name);
            // If successful, the repo still exists, keep it
            merged.push(localRepo);
          } catch (error) {
            // Repo was removed or access was revoked, don't include it
            console.log(
              `Repository ${localRepo.full_name} no longer accessible`,
            );
          }
        }
      }

      return merged.sort((a, b) => {
        const dateA = new Date(a.updated_at);
        const dateB = new Date(b.updated_at);
        return dateB.getTime() - dateA.getTime();
      });
    },
    [getRepoDetails],
  );

  // Main sync function
  const syncRepositories = useCallback(
    async (showAlert = true): Promise<void> => {
      if (!isAuthenticated || isSyncingRef.current || isLoading) {
        return;
      }

      isSyncingRef.current = true;
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: true,
        error: null,
        progress: 0,
      }));

      try {
        // Load existing cache
        const existingCache = await loadCache();
        setCache(existingCache);

        // Fetch fresh data from GitHub
        const remoteRepos = await getUserRepos(100, 1);
        setSyncStatus(prev => ({ ...prev, progress: 50 }));

        // Resolve conflicts if cache exists
        let finalRepos: Repository[];
        if (existingCache) {
          finalRepos = await resolveConflicts(
            existingCache.repositories,
            remoteRepos,
          );
        } else {
          finalRepos = remoteRepos;
        }

        // Update cache
        const newCache: RepositoryCache = {
          repositories: finalRepos,
          lastUpdated: new Date(),
        };

        await saveCache(newCache);
        setCache(newCache);

        // Update sync status
        const lastSync = new Date();
        const nextSync = new Date(Date.now() + SYNC_INTERVAL);

        setSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          lastSync,
          nextSync,
          progress: 100,
        }));

        if (showAlert) {
          Alert.alert(
            "Sync Complete",
            `Successfully synchronized ${finalRepos.length} repositories`,
          );
        }
      } catch (error) {
        console.error("Sync failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          error: errorMessage,
          progress: 0,
        }));

        if (showAlert) {
          Alert.alert("Sync Failed", errorMessage);
        }
      } finally {
        isSyncingRef.current = false;
      }
    },
    [
      isAuthenticated,
      isLoading,
      getUserRepos,
      loadCache,
      resolveConflicts,
      saveCache,
    ],
  );

  // Repository health monitoring
  const checkRepositoryHealth = useCallback(
    async (
      repository: Repository,
    ): Promise<{
      healthy: boolean;
      issues: string[];
      lastChecked: Date;
    }> => {
      const issues: string[] = [];
      const lastChecked = new Date();

      try {
        // Check if repository is still accessible
        const repoDetails = await getRepoDetails(
          repository.owner.login,
          repository.name,
        );

        // Check for significant changes
        if (repoDetails.updated_at !== repository.updated_at) {
          issues.push("Repository metadata has changed");
        }

        // Check if repository is still active
        if (repoDetails.private !== repository.private) {
          issues.push("Repository visibility has changed");
        }

        return {
          healthy: issues.length === 0,
          issues,
          lastChecked,
        };
      } catch (error) {
        issues.push("Unable to access repository");
        return {
          healthy: false,
          issues,
          lastChecked,
        };
      }
    },
    [getRepoDetails],
  );

  // Offline support - get repositories from cache
  const getOfflineRepositories = useCallback(async (): Promise<
    Repository[]
  > => {
    if (cache) {
      return cache.repositories;
    }

    const cachedData = await loadCache();
    if (cachedData) {
      setCache(cachedData);
      return cachedData.repositories;
    }

    return [];
  }, [cache, loadCache]);

  // Initialize
  useEffect(() => {
    if (isAuthenticated) {
      startBackgroundSync();
      // Initial sync
      syncRepositories(false);
    } else {
      stopBackgroundSync();
      setCache(null);
    }

    return () => {
      stopBackgroundSync();
    };
  }, [
    isAuthenticated,
    startBackgroundSync,
    stopBackgroundSync,
    syncRepositories,
  ]);

  return {
    syncStatus,
    cache,
    syncRepositories,
    getOfflineRepositories,
    checkRepositoryHealth,
    startBackgroundSync,
    stopBackgroundSync,
  };
}

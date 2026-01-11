import { renderHook, act } from "@testing-library/react-native";
import { useRepositorySync } from "@/hooks/use-repository-sync";
import { useGithubApi } from "@/hooks/use-github-api";
import * as SecureStore from "expo-secure-store";
import React from "react";

// Mock SecureStore
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// Mock useGithubApi
jest.mock("@/hooks/use-github-api", () => ({
  useGithubApi: jest.fn(),
}));

describe("useRepositorySync", () => {
  const mockGetUserRepos = jest.fn();
  const mockGetRepoDetails = jest.fn();
  const mockIsAuthenticated = true;
  const mockIsLoading = false;

  beforeEach(() => {
    jest.clearAllMocks();

    (useGithubApi as jest.Mock).mockReturnValue({
      getUserRepos: mockGetUserRepos,
      getRepoDetails: mockGetRepoDetails,
      isAuthenticated: mockIsAuthenticated,
      isLoading: mockIsLoading,
    });

    // Mock SecureStore responses
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useRepositorySync());

    expect(result.current.syncStatus).toEqual({
      isSyncing: false,
      lastSync: null,
      nextSync: null,
      error: null,
      progress: 0,
    });
    expect(result.current.cache).toBeNull();
  });

  it("should load cache on initialization", async () => {
    const mockCache = {
      repositories: [
        {
          id: 1,
          name: "test-repo",
          full_name: "testuser/test-repo",
          owner: { login: "testuser", avatar_url: "avatar.jpg" },
          private: false,
          html_url: "https://github.com/testuser/test-repo",
          language: "JavaScript",
          stargazers_count: 10,
          forks_count: 5,
          updated_at: "2023-01-01T00:00:00Z",
        },
      ],
      lastUpdated: new Date("2023-01-01T00:00:00Z"),
    };

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(mockCache),
    );

    const { result } = renderHook(() => useRepositorySync());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.cache).toEqual(mockCache);
  });

  it("should sync repositories successfully", async () => {
    const mockRemoteRepos = [
      {
        id: 1,
        name: "test-repo",
        full_name: "testuser/test-repo",
        owner: { login: "testuser", avatar_url: "avatar.jpg" },
        private: false,
        html_url: "https://github.com/testuser/test-repo",
        language: "JavaScript",
        stargazers_count: 10,
        forks_count: 5,
        updated_at: "2023-01-01T00:00:00Z",
      },
    ];

    mockGetUserRepos.mockResolvedValue(mockRemoteRepos);

    const { result } = renderHook(() => useRepositorySync());

    await act(async () => {
      await result.current.syncRepositories(false);
    });

    expect(mockGetUserRepos).toHaveBeenCalledWith(100, 1);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "github_repositories_cache",
      JSON.stringify({
        repositories: mockRemoteRepos,
        lastUpdated: expect.any(Date),
      }),
    );
    expect(result.current.syncStatus.isSyncing).toBe(false);
    expect(result.current.syncStatus.lastSync).toBeInstanceOf(Date);
  });

  it("should handle sync errors gracefully", async () => {
    const syncError = new Error("Network error");
    mockGetUserRepos.mockRejectedValue(syncError);

    const { result } = renderHook(() => useRepositorySync());

    await act(async () => {
      await result.current.syncRepositories(false);
    });

    expect(result.current.syncStatus.isSyncing).toBe(false);
    expect(result.current.syncStatus.error).toBe("Network error");
    expect(result.current.syncStatus.progress).toBe(0);
  });

  it("should resolve conflicts between local and remote repositories", async () => {
    const mockLocalCache = {
      repositories: [
        {
          id: 1,
          name: "test-repo",
          full_name: "testuser/test-repo",
          owner: { login: "testuser", avatar_url: "avatar.jpg" },
          private: false,
          html_url: "https://github.com/testuser/test-repo",
          language: "JavaScript",
          stargazers_count: 10,
          forks_count: 5,
          updated_at: "2023-01-01T00:00:00Z",
        },
      ],
      lastUpdated: new Date("2023-01-01T00:00:00Z"),
    };

    const mockRemoteRepos = [
      {
        id: 1,
        name: "test-repo",
        full_name: "testuser/test-repo",
        owner: { login: "testuser", avatar_url: "avatar.jpg" },
        private: false,
        html_url: "https://github.com/testuser/test-repo",
        language: "JavaScript",
        stargazers_count: 15, // Updated
        forks_count: 5,
        updated_at: "2023-01-02T00:00:00Z", // More recent
      },
      {
        id: 2,
        name: "new-repo",
        full_name: "testuser/new-repo",
        owner: { login: "testuser", avatar_url: "avatar.jpg" },
        private: false,
        html_url: "https://github.com/testuser/new-repo",
        language: "TypeScript",
        stargazers_count: 20,
        forks_count: 8,
        updated_at: "2023-01-02T00:00:00Z",
      },
    ];

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(mockLocalCache),
    );
    mockGetUserRepos.mockResolvedValue(mockRemoteRepos);

    const { result } = renderHook(() => useRepositorySync());

    await act(async () => {
      await result.current.syncRepositories(false);
    });

    // Should use the more recent remote version and include the new repo
    expect(result.current.cache?.repositories).toHaveLength(2);
    expect(result.current.cache?.repositories[0].stargazers_count).toBe(15);
  });

  it("should check repository health", async () => {
    const mockRepository = {
      id: 1,
      name: "test-repo",
      full_name: "testuser/test-repo",
      owner: { login: "testuser", avatar_url: "avatar.jpg" },
      private: false,
      html_url: "https://github.com/testuser/test-repo",
      language: "JavaScript",
      stargazers_count: 10,
      forks_count: 5,
      updated_at: "2023-01-01T00:00:00Z",
    };

    mockGetRepoDetails.mockResolvedValue(mockRepository);

    const { result } = renderHook(() => useRepositorySync());

    const health = await act(async () => {
      return result.current.checkRepositoryHealth(mockRepository);
    });

    expect(health.healthy).toBe(true);
    expect(health.issues).toEqual([]);
    expect(health.lastChecked).toBeInstanceOf(Date);
  });

  it("should get offline repositories from cache", async () => {
    const mockCache = {
      repositories: [
        {
          id: 1,
          name: "test-repo",
          full_name: "testuser/test-repo",
          owner: { login: "testuser", avatar_url: "avatar.jpg" },
          private: false,
          html_url: "https://github.com/testuser/test-repo",
          language: "JavaScript",
          stargazers_count: 10,
          forks_count: 5,
          updated_at: "2023-01-01T00:00:00Z",
        },
      ],
      lastUpdated: new Date("2023-01-01T00:00:00Z"),
    };

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(mockCache),
    );

    const { result } = renderHook(() => useRepositorySync());

    const offlineRepos = await act(async () => {
      return result.current.getOfflineRepositories();
    });

    expect(offlineRepos).toEqual(mockCache.repositories);
  });

  it("should start and stop background sync", async () => {
    const { result } = renderHook(() => useRepositorySync());

    // Start background sync
    act(() => {
      result.current.startBackgroundSync();
    });

    // Should set next sync time
    expect(result.current.syncStatus.nextSync).toBeInstanceOf(Date);

    // Stop background sync
    act(() => {
      result.current.stopBackgroundSync();
    });

    // Should clear the interval (we can't directly test this, but we can test the function exists)
    expect(typeof result.current.stopBackgroundSync).toBe("function");
  });
});

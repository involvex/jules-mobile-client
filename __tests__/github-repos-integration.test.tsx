import { EnhancedRepositoryManager } from "@/components/github/enhanced-repository-manager";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { useRepositorySync } from "@/hooks/use-repository-sync";
import { useGithubApi } from "@/hooks/use-github-api";
import { View } from "react-native";
import React from "react";

// Mock the hooks
jest.mock("@/hooks/use-github-api");
jest.mock("@/hooks/use-repository-sync");
jest.mock("@/hooks/use-color-scheme");
jest.mock("@/hooks/use-theme-color");
jest.mock("@/constants/i18n-context");

const mockUseGithubApi = useGithubApi as jest.Mock;
const mockUseRepositorySync = useRepositorySync as jest.Mock;

describe("EnhancedRepositoryManager Integration Tests", () => {
  const mockRepositories = [
    {
      id: 1,
      name: "test-repo-1",
      full_name: "user/test-repo-1",
      description: "Test repository 1",
      html_url: "https://github.com/user/test-repo-1",
      private: false,
      owner: {
        login: "user",
        avatar_url: "https://github.com/user.png",
      },
      language: "TypeScript",
      stargazers_count: 10,
      forks_count: 5,
      topics: ["react", "typescript"],
      languages: { TypeScript: 1000, JavaScript: 500 },
      updated_at: "2023-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "test-repo-2",
      full_name: "user/test-repo-2",
      description: "Test repository 2",
      html_url: "https://github.com/user/test-repo-2",
      private: true,
      owner: {
        login: "user",
        avatar_url: "https://github.com/user.png",
      },
      language: "JavaScript",
      stargazers_count: 20,
      forks_count: 10,
      topics: ["react-native"],
      languages: { JavaScript: 2000 },
      updated_at: "2023-02-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    mockUseGithubApi.mockReturnValue({
      isAuthenticated: true,
      getRepoTopics: jest.fn().mockImplementation((owner, repo) => {
        const repoData = mockRepositories.find(
          r => r.full_name === `${owner}/${repo}`,
        );
        return Promise.resolve(repoData?.topics || []);
      }),
      getRepoLanguages: jest.fn().mockImplementation((owner, repo) => {
        const repoData = mockRepositories.find(
          r => r.full_name === `${owner}/${repo}`,
        );
        return Promise.resolve(repoData?.languages || {});
      }),
    });

    mockUseRepositorySync.mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSync: new Date(),
        nextSync: new Date(Date.now() + 300000),
        error: null,
        progress: 0,
      },
      cache: {
        repositories: mockRepositories,
        lastUpdated: new Date(),
      },
      syncRepositories: jest.fn(),
      getOfflineRepositories: jest.fn().mockResolvedValue(mockRepositories),
      checkRepositoryHealth: jest.fn(),
      startBackgroundSync: jest.fn(),
      stopBackgroundSync: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render repositories list", async () => {
    render(
      <View style={{ flex: 1 }}>
        <EnhancedRepositoryManager />
      </View>,
    );

    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText("test-repo-1")).toBeTruthy();
      expect(screen.getByText("test-repo-2")).toBeTruthy();
    });
  });

  it("should filter repositories by search query", async () => {
    render(
      <View style={{ flex: 1 }}>
        <EnhancedRepositoryManager />
      </View>,
    );

    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText("test-repo-1")).toBeTruthy();
      expect(screen.getByText("test-repo-2")).toBeTruthy();
    });

    // Type in search input
    const searchInput = screen.getByPlaceholderText("Search repositories...");
    fireEvent.changeText(searchInput, "test-repo-1");

    // Should only show test-repo-1
    expect(screen.getByText("test-repo-1")).toBeTruthy();
    expect(screen.queryByText("test-repo-2")).toBeNull();
  });

  it("should filter repositories by language", async () => {
    render(
      <View style={{ flex: 1 }}>
        <EnhancedRepositoryManager />
      </View>,
    );

    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText("test-repo-1")).toBeTruthy();
      expect(screen.getByText("test-repo-2")).toBeTruthy();
    });

    // Click TypeScript filter
    const tsFilter = screen.getByText("TypeScript");
    fireEvent.press(tsFilter);

    // Should only show TypeScript repositories
    expect(screen.getByText("test-repo-1")).toBeTruthy();
    expect(screen.queryByText("test-repo-2")).toBeNull();
  });

  it("should expand repository details on press", async () => {
    render(
      <View style={{ flex: 1 }}>
        <EnhancedRepositoryManager />
      </View>,
    );

    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText("test-repo-1")).toBeTruthy();
    });

    // Find and press the expand button for the first repository
    const expandButtons = screen.getAllByTestId("expand-button");
    fireEvent.press(expandButtons[0]);

    // Should show repository details
    await waitFor(() => {
      expect(screen.getByText("Topics:")).toBeTruthy();
      expect(screen.getByText("#react")).toBeTruthy();
      expect(screen.getByText("#typescript")).toBeTruthy();
    });
  });

  it("should handle repository selection", async () => {
    const mockOnRepositorySelect = jest.fn();

    render(
      <View style={{ flex: 1 }}>
        <EnhancedRepositoryManager
          onRepositorySelect={mockOnRepositorySelect}
        />
      </View>,
    );

    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText("test-repo-1")).toBeTruthy();
    });

    // Press the first repository
    fireEvent.press(screen.getByText("test-repo-1"));

    // Should call onRepositorySelect with the correct repository
    expect(mockOnRepositorySelect).toHaveBeenCalledWith(mockRepositories[0]);
  });

  it("should show empty state when no repositories match filters", async () => {
    render(
      <View style={{ flex: 1 }}>
        <EnhancedRepositoryManager />
      </View>,
    );

    // Wait for repositories to load
    await waitFor(() => {
      expect(screen.getByText("test-repo-1")).toBeTruthy();
    });

    // Type in search input that won't match anything
    const searchInput = screen.getByPlaceholderText("Search repositories...");
    fireEvent.changeText(searchInput, "nonexistent-repo");

    // Should show empty state
    expect(screen.getByText("No repositories match your filters")).toBeTruthy();
  });

  it("should handle sync operations", async () => {
    const mockSyncRepositories = jest.fn().mockResolvedValue(undefined);

    mockUseRepositorySync.mockReturnValue({
      syncStatus: {
        isSyncing: false,
        lastSync: new Date(),
        nextSync: new Date(Date.now() + 300000),
        error: null,
        progress: 0,
      },
      cache: null,
      syncRepositories: mockSyncRepositories,
      getOfflineRepositories: jest.fn().mockResolvedValue([]),
      checkRepositoryHealth: jest.fn(),
      startBackgroundSync: jest.fn(),
      stopBackgroundSync: jest.fn(),
    });

    render(
      <View style={{ flex: 1 }}>
        <EnhancedRepositoryManager />
      </View>,
    );

    // Press sync button
    const syncButton = screen.getByText("Sync Now");
    fireEvent.press(syncButton);

    // Should call syncRepositories
    await waitFor(() => {
      expect(mockSyncRepositories).toHaveBeenCalled();
    });
  });

  it("should show authentication required when not authenticated", () => {
    mockUseGithubApi.mockReturnValue({
      isAuthenticated: false,
    });

    render(
      <View style={{ flex: 1 }}>
        <EnhancedRepositoryManager />
      </View>,
    );

    expect(screen.getByText("Authentication Required")).toBeTruthy();
  });
});

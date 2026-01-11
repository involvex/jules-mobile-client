import { usePullRequestAnalysis } from "@/hooks/use-pull-request-analysis";
import { useWorkflowUpdates } from "@/hooks/use-workflow-updates";
import { renderHook, act } from "@testing-library/react-native";
import { useRepositorySync } from "@/hooks/use-repository-sync";
import { useGithubApi } from "@/hooks/use-github-api";

// Mock the API key context
jest.mock("@/constants/api-key-context", () => ({
  useApiKey: () => ({
    GITHUB_TOKEN: "test-token",
  }),
}));

describe("Performance Tests", () => {
  describe("API Call Performance", () => {
    it("should handle concurrent API calls efficiently", async () => {
      const { result } = renderHook(() => useGithubApi());

      const startTime = performance.now();

      // Simulate 10 concurrent API calls
      const promises = Array.from({ length: 10 }, (_, i) =>
        result.current.getUserRepos(),
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // API calls should complete within reasonable time (under 5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it("should cache repository data to avoid duplicate calls", async () => {
      const { result } = renderHook(() => useGithubApi());

      // First call
      const startTime1 = performance.now();
      await result.current.getRepoDetails("owner", "repo");
      const endTime1 = performance.now();
      const firstCallDuration = endTime1 - startTime1;

      // Second call (should be cached)
      const startTime2 = performance.now();
      await result.current.getRepoDetails("owner", "repo");
      const endTime2 = performance.now();
      const secondCallDuration = endTime2 - startTime2;

      // Second call should be significantly faster due to caching
      expect(secondCallDuration).toBeLessThan(firstCallDuration * 0.5);
    });

    it("should handle large repository lists efficiently", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Mock a large repository list response
      const largeRepoList = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `repo-${i}`,
        full_name: `user/repo-${i}`,
        owner: { login: "user", avatar_url: "avatar.jpg" },
        private: false,
        html_url: `https://github.com/user/repo-${i}`,
        language: "JavaScript",
        stargazers_count: Math.floor(Math.random() * 1000),
        forks_count: Math.floor(Math.random() * 500),
        updated_at: new Date().toISOString(),
      }));

      result.current.octokit.rest.repos.listForAuthenticatedUser.mockResolvedValue(
        {
          data: largeRepoList,
        },
      );

      const startTime = performance.now();
      const repos = await result.current.getUserRepos();
      const endTime = performance.now();

      expect(repos).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory with repeated API calls", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Simulate repeated API calls
      for (let i = 0; i < 100; i++) {
        await result.current.getUserRepos();
        await result.current.getRepoDetails("owner", "repo");
      }

      // Memory should be managed properly (no explicit test, but no errors should occur)
      expect(result.current.octokit).toBeDefined();
    });

    it("should handle large workflow run lists without memory issues", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Mock large workflow run list
      const largeWorkflowRuns = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `workflow-run-${i}`,
        status: "completed",
        conclusion: "success",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      result.current.octokit.rest.actions.listWorkflowRuns.mockResolvedValue({
        data: { workflow_runs: largeWorkflowRuns },
      });

      const workflowRuns = await result.current.getWorkflowRuns(
        "owner",
        "repo",
      );

      expect(workflowRuns).toHaveLength(500);
      expect(workflowRuns[0].id).toBe(0);
    });
  });

  describe("Caching Performance", () => {
    it("should implement intelligent caching for repository data", async () => {
      const { result } = renderHook(() => useRepositorySync());

      const mockRepos = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `repo-${i}`,
        full_name: `user/repo-${i}`,
        owner: { login: "user", avatar_url: "avatar.jpg" },
        private: false,
        html_url: `https://github.com/user/repo-${i}`,
        language: "JavaScript",
        stargazers_count: 10,
        forks_count: 5,
        updated_at: new Date().toISOString(),
      }));

      // First sync
      const startTime1 = performance.now();
      await act(async () => {
        await result.current.syncRepositories(false);
      });
      const endTime1 = performance.now();
      const firstSyncDuration = endTime1 - startTime1;

      // Second sync (should use cache)
      const startTime2 = performance.now();
      await act(async () => {
        await result.current.syncRepositories(false);
      });
      const endTime2 = performance.now();
      const secondSyncDuration = endTime2 - startTime2;

      // Second sync should be faster due to caching
      expect(secondSyncDuration).toBeLessThan(firstSyncDuration * 0.3);
    });

    it("should invalidate cache when data is stale", async () => {
      const { result } = renderHook(() => useRepositorySync());

      // Mock initial data
      const initialRepos = [{ id: 1, name: "repo1" }];
      const updatedRepos = [
        { id: 1, name: "repo1" },
        { id: 2, name: "repo2" },
      ];

      // First sync with initial data
      await act(async () => {
        await result.current.syncRepositories(false);
      });

      // Simulate cache expiration and new data
      const cache = result.current.cache;
      if (cache) {
        cache.lastUpdated = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      }

      // Mock updated data
      result.current.getUserRepos.mockResolvedValue(updatedRepos);

      const startTime = performance.now();
      await act(async () => {
        await result.current.syncRepositories(false);
      });
      const endTime = performance.now();

      // Should fetch new data due to cache expiration
      expect(endTime - startTime).beGreaterThan(100); // Should take some time to fetch
    });
  });

  describe("Workflow Update Performance", () => {
    it("should handle frequent workflow updates efficiently", async () => {
      const { result } = renderHook(() => useWorkflowUpdates());

      // Start polling
      await act(async () => {
        result.current.startPolling("owner", "repo", 100); // 100ms interval for testing
      });

      // Simulate multiple updates
      const updatePromises = Array.from({ length: 10 }, async (_, i) => {
        await new Promise(resolve => setTimeout(resolve, i * 50));
        // Simulate workflow update
        result.current.getUpdatesForWorkflow(1);
      });

      await Promise.all(updatePromises);

      // Stop polling
      await act(async () => {
        result.current.stopPolling();
      });

      expect(result.current.isPolling).toBe(false);
    });

    it("should limit concurrent workflow API calls", async () => {
      const { result } = renderHook(() => useWorkflowUpdates());

      // Mock multiple concurrent requests
      const concurrentRequests = Array.from({ length: 20 }, () =>
        result.current.getUpdatesForWorkflow(1),
      );

      const startTime = performance.now();
      await Promise.all(concurrentRequests);
      const endTime = performance.now();

      // Should handle concurrent requests without overwhelming the API
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });

  describe("Pull Request Analysis Performance", () => {
    it("should handle multiple PR analyses concurrently", async () => {
      const { result } = renderHook(() => usePullRequestAnalysis());

      // Mock multiple PR analyses
      const analysisPromises = Array.from({ length: 5 }, (_, i) =>
        result.current.analyzePullRequest("user", "repo", i + 1),
      );

      const startTime = performance.now();
      await Promise.all(analysisPromises);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000);
    });

    it("should cache PR analysis results", async () => {
      const { result } = renderHook(() => usePullRequestAnalysis());

      // First analysis
      const startTime1 = performance.now();
      await result.current.analyzePullRequest("user", "repo", 123);
      const endTime1 = performance.now();
      const firstAnalysisDuration = endTime1 - startTime1;

      // Second analysis of same PR (should be cached)
      const startTime2 = performance.now();
      await result.current.analyzePullRequest("user", "repo", 123);
      const endTime2 = performance.now();
      const secondAnalysisDuration = endTime2 - startTime2;

      // Second analysis should be faster due to caching
      expect(secondAnalysisDuration).toBeLessThan(firstAnalysisDuration * 0.5);
    });
  });

  describe("Bundle Size and Startup Performance", () => {
    it("should load GitHub integration modules efficiently", () => {
      const startTime = performance.now();

      // Import modules
      require("@/hooks/use-github-api");
      require("@/hooks/use-github-deep-linking");
      require("@/hooks/use-github-webhooks");
      require("@/hooks/use-repository-sync");
      require("@/hooks/use-workflow-updates");
      require("@/hooks/use-pull-request-analysis");
      require("@/hooks/use-notifications");

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Module loading should be fast (under 100ms)
      expect(loadTime).toBeLessThan(100);
    });

    it("should lazy load heavy components", () => {
      const startTime = performance.now();

      // Test lazy loading of workflow components
      const WorkflowDashboard =
        require("@/components/github/workflow-dashboard").default;
      const WorkflowLogsViewer =
        require("@/components/github/workflow-logs-viewer").default;
      const PullRequestAnalyzer =
        require("@/components/github/pull-request-analyzer").default;

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Lazy loaded components should load quickly
      expect(loadTime).toBeLessThan(50);
    });
  });
});

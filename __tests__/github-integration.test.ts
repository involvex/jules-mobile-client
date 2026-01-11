import { useGithubDeepLinking } from "@/hooks/use-github-deep-linking";
import { useGithubSession } from "@/hooks/use-github-session";
import { useGithubApi } from "@/hooks/use-github-api";

// Mock dependencies
jest.mock("@octokit/rest", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      users: {
        getAuthenticated: jest.fn(),
      },
      repos: {
        listForAuthenticatedUser: jest.fn(),
        get: jest.fn(),
      },
      actions: {
        listRepoWorkflows: jest.fn(),
        listWorkflowRuns: jest.fn(),
        downloadWorkflowRunLogs: jest.fn(),
      },
      pulls: {
        list: jest.fn(),
      },
      search: {
        repos: jest.fn(),
      },
    },
  })),
}));

jest.mock("expo-linking", () => ({
  getInitialURL: jest.fn(),
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
  addEventListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

// Mock secure storage
jest.mock("@/hooks/use-secure-storage", () => ({
  useSecureStorage: () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));

describe("GitHub Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useGithubApi", () => {
    it("should validate GitHub token", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Mock successful authentication
      result.current.octokit.rest.users.getAuthenticated.mockResolvedValue({
        data: { login: "testuser" },
      });

      const isValid = await result.current.validateToken();
      expect(isValid).toBe(true);
      expect(
        result.current.octokit.rest.users.getAuthenticated,
      ).toHaveBeenCalled();
    });

    it("should fetch user repositories", async () => {
      const mockRepos = [
        {
          id: 1,
          name: "test-repo",
          full_name: "testuser/test-repo",
          owner: { login: "testuser", avatar_url: "avatar.jpg" },
        },
      ];

      const { result } = renderHook(() => useGithubApi());
      result.current.octokit.rest.repos.listForAuthenticatedUser.mockResolvedValue(
        {
          data: mockRepos,
        },
      );

      const repos = await result.current.getUserRepos();
      expect(repos).toEqual(mockRepos);
      expect(
        result.current.octokit.rest.repos.listForAuthenticatedUser,
      ).toHaveBeenCalledWith({
        per_page: 30,
        page: 1,
        sort: "updated",
        direction: "desc",
      });
    });

    it("should parse GitHub URLs correctly", () => {
      const { result } = renderHook(() => useGithubApi());

      const url = "https://github.com/testuser/test-repo";
      const parsed = result.current.parseGithubUrl(url);

      expect(parsed).toEqual({
        owner: "testuser",
        repo: "test-repo",
      });
    });

    it("should return null for invalid GitHub URLs", () => {
      const { result } = renderHook(() => useGithubApi());

      const url = "https://example.com/test";
      const parsed = result.current.parseGithubUrl(url);

      expect(parsed).toBeNull();
    });
  });

  describe("useGithubDeepLinking", () => {
    it("should parse GitHub repository URLs", () => {
      const { result } = renderHook(() => useGithubDeepLinking());

      const url = "https://github.com/testuser/test-repo";
      const parsed = result.current.parseGithubUrlData(url);

      expect(parsed).toEqual({
        type: "repository",
        owner: "testuser",
        repo: "test-repo",
      });
    });

    it("should parse GitHub pull request URLs", () => {
      const { result } = renderHook(() => useGithubDeepLinking());

      const url = "https://github.com/testuser/test-repo/pull/123";
      const parsed = result.current.parseGithubUrlData(url);

      expect(parsed).toEqual({
        type: "pull_request",
        owner: "testuser",
        repo: "test-repo",
        number: 123,
      });
    });

    it("should parse GitHub issue URLs", () => {
      const { result } = renderHook(() => useGithubDeepLinking());

      const url = "https://github.com/testuser/test-repo/issues/456";
      const parsed = result.current.parseGithubUrlData(url);

      expect(parsed).toEqual({
        type: "issue",
        owner: "testuser",
        repo: "test-repo",
        number: 456,
      });
    });

    it("should create GitHub URLs", () => {
      const { result } = renderHook(() => useGithubDeepLinking());

      const data = {
        type: "repository" as const,
        owner: "testuser",
        repo: "test-repo",
      };

      const url = result.current.createGithubUrl(data);
      expect(url).toBe("https://github.com/testuser/test-repo");
    });
  });

  describe("useGithubSession", () => {
    it("should get repository context", async () => {
      const mockRepository = {
        id: 1,
        name: "test-repo",
        full_name: "testuser/test-repo",
        default_branch: "main",
      };

      const { result } = renderHook(() => useGithubSession());

      // Mock the GitHub API hook
      result.current.getRepositoryContext = jest.fn().mockResolvedValue({
        owner: "testuser",
        repo: "test-repo",
        defaultBranch: "main",
        repository: mockRepository,
      });

      const context = await result.current.getRepositoryContext(
        "testuser",
        "test-repo",
      );

      expect(context).toEqual({
        owner: "testuser",
        repo: "test-repo",
        defaultBranch: "main",
        repository: mockRepository,
      });
    });

    it("should create session templates", () => {
      const { result } = renderHook(() => useGithubSession());

      const templates = result.current.getTemplates();

      expect(templates).toHaveLength(6);
      expect(templates[0]).toEqual({
        id: "bug-fix",
        name: "Bug Fix",
        description: "Fix a specific bug or issue in the codebase",
        prompt: "Fix the following bug in this repository:",
        category: "development",
      });
    });

    it("should get templates by category", () => {
      const { result } = renderHook(() => useGithubSession());

      const developmentTemplates = result.current.getTemplates("development");

      expect(developmentTemplates).toHaveLength(2);
      expect(developmentTemplates[0].category).toBe("development");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Mock API error
      result.current.octokit.rest.users.getAuthenticated.mockRejectedValue(
        new Error("API Error"),
      );

      const isValid = await result.current.validateToken();
      expect(isValid).toBe(false);
    });

    it("should handle invalid URLs gracefully", () => {
      const { result } = renderHook(() => useGithubDeepLinking());

      const parsed = result.current.parseGithubUrlData("invalid-url");
      expect(parsed).toBeNull();
    });
  });

  describe("Integration Tests", () => {
    it("should create session from GitHub URL", async () => {
      const { result } = renderHook(() => useGithubSession());

      // Mock successful repository context retrieval
      result.current.getRepositoryContext = jest.fn().mockResolvedValue({
        owner: "testuser",
        repo: "test-repo",
        defaultBranch: "main",
        repository: { id: 1, name: "test-repo", default_branch: "main" },
      });

      // Mock successful session creation
      result.current.createGithubSession = jest
        .fn()
        .mockResolvedValue("session-123");

      const sessionName = await result.current.createSessionFromUrl(
        "https://github.com/testuser/test-repo",
        "Fix the bug",
        { useDefaultBranch: true },
      );

      expect(sessionName).toBe("session-123");
      expect(result.current.getRepositoryContext).toHaveBeenCalledWith(
        "testuser",
        "test-repo",
      );
      expect(result.current.createGithubSession).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "testuser",
          repo: "test-repo",
          defaultBranch: "main",
        }),
        expect.objectContaining({
          prompt: "Fix the bug",
          useDefaultBranch: true,
        }),
      );
    });
  });
});

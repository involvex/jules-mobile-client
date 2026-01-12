import {
  usePullRequestAnalysis,
  PullRequestAnalysis,
} from "@/hooks/use-pull-request-analysis";
import { renderHook, act } from "@testing-library/react-native";
import { useApiKey } from "@/constants/api-key-context";
import { useGithubApi } from "@/hooks/use-github-api";
import { useJulesApi } from "@/hooks/use-jules-api";
import React from "react";

// Mock useGithubApi
jest.mock("@/hooks/use-github-api", () => ({
  useGithubApi: jest.fn(),
}));

// Mock useJulesApi
jest.mock("@/hooks/use-jules-api", () => ({
  useJulesApi: jest.fn(),
}));

// Mock useApiKey
jest.mock("@/constants/api-key-context", () => ({
  useApiKey: jest.fn(),
}));

describe("usePullRequestAnalysis", () => {
  const mockOctokit = {
    rest: {
      pulls: {
        get: jest.fn(),
        listFiles: jest.fn(),
        createReview: jest.fn(),
      },
      issues: {
        createComment: jest.fn(),
      },
    },
  };
  const mockGetAiResponse = jest.fn();
  const mockAnalyzeCode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useApiKey as jest.Mock).mockReturnValue({
      apiKey: "test-api-key",
    });

    (useGithubApi as jest.Mock).mockReturnValue({
      octokit: mockOctokit,
    });

    (useJulesApi as jest.Mock).mockReturnValue({
      getAiResponse: mockGetAiResponse,
      analyzeCode: mockAnalyzeCode,
    });
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => usePullRequestAnalysis());

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.analyses).toBeInstanceOf(Map);
    expect(result.current.reviews).toBeInstanceOf(Map);
  });

  it("should analyze pull request successfully", async () => {
    const mockPrDetails = {
      number: 123,
      title: "Test PR",
      body: "Test description",
      changed_files: 2,
    };

    mockOctokit.rest.pulls.get.mockResolvedValueOnce({ data: mockPrDetails }); // Details
    mockOctokit.rest.pulls.get.mockResolvedValueOnce({ data: "diff content" }); // Diff

    const mockAnalysisResponse = JSON.stringify({
      summary: "Test summary",
      issues: ["Issue 1", "Issue 2"],
      suggestions: ["Suggestion 1"],
      qualityScore: 8,
      riskLevel: "medium",
    });

    mockAnalyzeCode.mockResolvedValue({ name: "sessions/123" });
    mockGetAiResponse.mockResolvedValue({
      agentMessaged: { agentMessage: mockAnalysisResponse },
    });

    const { result } = renderHook(() => usePullRequestAnalysis());

    const analysis = await act(async () => {
      return result.current.analyzePullRequest("testuser", "testrepo", 123);
    });

    expect(mockAnalyzeCode).toHaveBeenCalled();
    expect(analysis.id).toBe(123);
    expect(analysis.title).toBe("Test PR");
    expect(analysis.summary).toBe("Test summary");
    expect(analysis.issues).toEqual(["Issue 1", "Issue 2"]);
    expect(analysis.riskLevel).toBe("medium");
    expect(result.current.isAnalyzing).toBe(false);
  });

  it("should handle analysis errors", async () => {
    mockOctokit.rest.pulls.get.mockRejectedValue(new Error("GitHub error"));

    const { result } = renderHook(() => usePullRequestAnalysis());

    await expect(
      act(async () => {
        return result.current.analyzePullRequest("testuser", "testrepo", 123);
      }),
    ).rejects.toThrow("GitHub error");

    expect(result.current.isAnalyzing).toBe(false);
  });

  it("should create automated review", async () => {
    const mockAnalysis: PullRequestAnalysis = {
      id: 123,
      title: "Test PR",
      confidence: 0.85,
      summary: "Test summary",
      issues: ["Issue 1"],
      suggestions: ["Suggestion 1"],
      riskLevel: "medium",
      timeEstimate: "30 minutes",
      createdAt: new Date(),
    };

    const mockReviewResponse = {
      id: 456,
      body: "Automated review content",
    };

    mockAnalyzeCode.mockResolvedValue({ name: "sessions/review" });
    mockGetAiResponse.mockResolvedValue({
      agentMessaged: { agentMessage: "Review content" },
    });
    mockOctokit.rest.pulls.createReview.mockResolvedValue({
      data: mockReviewResponse,
    });

    const { result } = renderHook(() => usePullRequestAnalysis());

    const review = await act(async () => {
      return result.current.createAutomatedReview(
        "testuser",
        "testrepo",
        123,
        mockAnalysis,
      );
    });

    expect(mockOctokit.rest.pulls.createReview).toHaveBeenCalledWith(
      expect.objectContaining({
        pull_number: 123,
        body: "Review content",
      }),
    );
    expect(review.id).toBe(456);
  });

  it("should get pull request metrics", async () => {
    const mockDiff = "+++ a/file.js\n--- b/file.js\n+ new line\n- old line";
    const mockFiles = [
      { filename: "file.js", additions: 10, deletions: 5 },
      { filename: "config.json", additions: 2, deletions: 0 },
    ];

    mockOctokit.rest.pulls.get.mockResolvedValue({ data: mockDiff });
    mockOctokit.rest.pulls.listFiles.mockResolvedValue({ data: mockFiles });

    const { result } = renderHook(() => usePullRequestAnalysis());

    const metrics = await act(async () => {
      return result.current.getPullRequestMetrics("testuser", "testrepo", 123);
    });

    expect(metrics.totalFilesChanged).toBe(2);
    expect(metrics.totalAdditions).toBeGreaterThan(0);
    expect(metrics.complexityScore).toBeGreaterThan(0);
    expect(metrics.riskFactors).toBeInstanceOf(Array);
  });

  it("should add comment to PR", async () => {
    const comment = "This is a test comment";
    mockOctokit.rest.issues.createComment.mockResolvedValue({
      data: { id: 789 },
    });

    const { result } = renderHook(() => usePullRequestAnalysis());

    await act(async () => {
      await result.current.addCommentToPr("testuser", "testrepo", 123, comment);
    });

    expect(mockOctokit.rest.issues.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        issue_number: 123,
        body: comment,
      }),
    );
  });

  it("should approve PR", async () => {
    mockOctokit.rest.pulls.createReview.mockResolvedValue({
      data: { id: 789 },
    });

    const { result } = renderHook(() => usePullRequestAnalysis());

    await act(async () => {
      await result.current.approvePr("testuser", "testrepo", 123);
    });

    expect(mockOctokit.rest.pulls.createReview).toHaveBeenCalledWith(
      expect.objectContaining({
        pull_number: 123,
        event: "APPROVE",
      }),
    );
  });

  it("should request changes on PR", async () => {
    const body = "Please fix these issues";
    mockOctokit.rest.pulls.createReview.mockResolvedValue({
      data: { id: 789 },
    });

    const { result } = renderHook(() => usePullRequestAnalysis());

    await act(async () => {
      await result.current.requestChangesOnPr(
        "testuser",
        "testrepo",
        123,
        body,
      );
    });

    expect(mockOctokit.rest.pulls.createReview).toHaveBeenCalledWith(
      expect.objectContaining({
        pull_number: 123,
        event: "REQUEST_CHANGES",
        body,
      }),
    );
  });
});
